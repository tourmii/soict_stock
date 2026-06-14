import { create } from 'zustand';
import { STOCKS } from '../lib/constants';
import { API_BASE } from '../lib/api';

/* ── Merton Jump-Diffusion (client-side fallback) ───────────────── */
function randn() {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function poissonRng(lambda) {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

const SECTOR_JUMPS = {
  Technology:  { lambda: 60,  muJ: -0.003, sigmaJ: 0.025 },
  Healthcare:  { lambda: 30,  muJ: -0.002, sigmaJ: 0.035 },
  Energy:      { lambda: 45,  muJ: -0.001, sigmaJ: 0.030 },
  Finance:     { lambda: 35,  muJ: -0.002, sigmaJ: 0.020 },
  Consumer:    { lambda: 20,  muJ:  0.000, sigmaJ: 0.018 },
  Industrial:  { lambda: 25,  muJ: -0.001, sigmaJ: 0.022 },
};

function mertonStep(price, drift, vol, dt, stock) {
  const jp = SECTOR_JUMPS[stock.sector] || SECTOR_JUMPS.Technology;
  let logReturn = (drift - 0.5 * vol ** 2) * dt + vol * Math.sqrt(dt) * randn();
  const nJumps = poissonRng(jp.lambda * dt);
  for (let j = 0; j < nJumps; j++) logReturn += jp.muJ + jp.sigmaJ * randn();
  let next = price * Math.exp(logReturn);
  const lo = stock.basePrice * 0.50;
  const hi = stock.basePrice * 1.50;
  if (next < lo) next = lo + (lo - next) * 0.5;
  if (next > hi) next = hi - (next - hi) * 0.5;
  return Math.max(0.50, next);
}

/* ── Offline fallback: 365 days of 5-min bars per ticker ──────── */
function generateInitialData() {
  const prices = {}, prevPrices = {}, rawTicks = {};
  for (const stock of STOCKS) {
    const ticks = [];
    let price = stock.basePrice * (0.90 + Math.random() * 0.20);
    const now = Math.floor(Date.now() / 1000);
    const barSec = 300, barsPerDay = 78, days = 365;
    const totalBars = days * barsPerDay;
    const startTime = now - totalBars * barSec;
    const dt = 1 / (252 * barsPerDay);
    for (let i = 0; i <= totalBars; i++) {
      if (i > 0) price = mertonStep(price, stock.drift, stock.volatility, dt, stock);
      ticks.push({ time: startTime + i * barSec, price: Math.round(price * 100) / 100, volume: Math.floor(500 + Math.random() * 4000) });
    }
    rawTicks[stock.ticker]      = ticks;
    prices[stock.ticker]        = ticks[ticks.length - 1].price;
    prevPrices[stock.ticker]    = ticks[ticks.length - 2]?.price || prices[stock.ticker];
  }
  return { prices, prevPrices, rawTicks };
}

/* ── OHLCV aggregation ──────────────────────────────────────────── */
export function aggregateToOHLCV(ticks, intervalSeconds) {
  if (!ticks || ticks.length === 0) return [];
  const candles = [];
  let currentBucket = null, candle = null;
  for (const tick of ticks) {
    const bucket = Math.floor(tick.time / intervalSeconds) * intervalSeconds;
    if (bucket !== currentBucket) {
      if (candle) candles.push(candle);
      currentBucket = bucket;
      // Use bar-level open/high/low when provided (backend OHLCV tracking);
      // fall back to price for legacy bars that only have a close price.
      candle = {
        time:   bucket,
        open:   tick.open  ?? tick.price,
        high:   tick.high  ?? tick.price,
        low:    tick.low   ?? tick.price,
        close:  tick.price,
        volume: tick.volume,
      };
    } else {
      candle.high   = Math.max(candle.high, tick.high  ?? tick.price);
      candle.low    = Math.min(candle.low,  tick.low   ?? tick.price);
      candle.close  = tick.price;
      candle.volume += tick.volume;
    }
  }
  if (candle) candles.push(candle);
  return candles;
}

/* ── Interval seconds ───────────────────────────────────────────── */
export const INTERVAL_SECONDS = {
  '15m': 900,
  '1H':  3600,
  '4H':  14400,
  '1D':  86400,
  '1W':  604800,
  '1M':  2592000,
};

// Timeframes that require more history than WebSocket's 30-day window
const LONG_TIMEFRAMES = new Set(['4H', '1D', '1W', '1M']);

const initialData = generateInitialData();

/* ── Store ──────────────────────────────────────────────────────── */
export const useMarketStore = create((set, get) => ({
  stocks:        STOCKS,
  prices:        initialData.prices,
  prevPrices:    initialData.prevPrices,
  rawTicks:      initialData.rawTicks,
  regime:        'normal',
  activeScenario: null,
  selectedTicker: 'SCT',
  watchlist:     ['SCT', 'INNO', 'HEAL', 'GRN', 'FINI', 'LUXR', 'AROX'],
  news:          [],
  isConnected:   false,

  // Loading state while engine.initialize() runs on the server
  isLoading:       true,
  loadingTimeoutId: null,
  initProgress:    null,   // { stock, current, total, phase }

  // Cache for server-aggregated OHLCV (keyed by `${ticker}_${timeframe}`)
  historicalOHLCV: {},
  fetchedSet:    {},     // tracks which `${ticker}_${timeframe}` keys were already fetched

  /* ── Replace local data with server history ──────────────── */
  initFromServer: (serverData) => {
    const newPrices = {}, newPrevPrices = {};
    const rawTicks  = serverData.rawTicks;
    for (const [ticker, ticks] of Object.entries(rawTicks)) {
      const lastTick = ticks[ticks.length - 1];
      const prevTick = ticks[ticks.length - 2];
      newPrices[ticker]     = lastTick?.price ?? serverData.prices[ticker];
      newPrevPrices[ticker] = prevTick?.price ?? newPrices[ticker];
    }
    set({ prices: newPrices, prevPrices: newPrevPrices, rawTicks, isLoading: false, initProgress: null });
  },

  setLoading:      (v)   => set({ isLoading: v }),
  setInitProgress: (p)   => set({ initProgress: p }),
  setSelectedTicker: (t) => set({ selectedTicker: t }),

  // Clears the loading overlay after 10s if the server never sends 'init' or 'loading'
  startFallbackTimer: () => {
    const { loadingTimeoutId } = get();
    if (loadingTimeoutId) clearTimeout(loadingTimeoutId);
    const id = setTimeout(() => {
      set({ isLoading: false, loadingTimeoutId: null });
    }, 10000);
    set({ loadingTimeoutId: id });
  },

  // Tick-to-tick change (used only for flash direction)
  getChange: (ticker) => {
    const { prices, prevPrices } = get();
    const price  = prices[ticker] || 0;
    const prev   = prevPrices[ticker] || price;
    const change = price - prev;
    return { change, changePercent: prev !== 0 ? (change / prev) * 100 : 0 };
  },

  // Daily change vs today's open — what exchanges actually show
  getDailyChange: (ticker) => {
    const { prices, rawTicks } = get();
    const price = prices[ticker] || 0;
    const ticks = rawTicks[ticker] || [];
    const todayStart = Math.floor(Date.now() / 1000) - 86400;
    const todayTicks = ticks.filter((t) => t.time >= todayStart);
    const open = todayTicks.length > 0 ? todayTicks[0].price : price;
    const change = price - open;
    return { change, changePercent: open !== 0 ? (change / open) * 100 : 0, open };
  },

  addToWatchlist: (ticker) => {
    const { watchlist } = get();
    if (!watchlist.includes(ticker)) set({ watchlist: [...watchlist, ticker] });
  },

  removeFromWatchlist: (ticker) =>
    set({ watchlist: get().watchlist.filter((t) => t !== ticker) }),

  setConnected: (connected) => set({ isConnected: connected }),

  /* ── Real-time tick update ──────────────────────────────── */
  updatePrices: (data) => {
    const { prices, rawTicks } = get();
    const newPrices = { ...prices }, newPrevPrices = { ...prices }, newRawTicks = { ...rawTicks };
    for (const [ticker, update] of Object.entries(data)) {
      newPrevPrices[ticker] = prices[ticker];
      newPrices[ticker]     = update.price;
      if (update.tick && newRawTicks[ticker]) {
        newRawTicks[ticker] = [...newRawTicks[ticker], update.tick];
      }
    }
    set({ prices: newPrices, prevPrices: newPrevPrices, rawTicks: newRawTicks });
  },

  /* ── Local simulation fallback ──────────────────────────── */
  simulateTick: () => {
    const { stocks, prices, rawTicks } = get();
    const newPrices = {}, newPrevPrices = {}, newRawTicks = { ...rawTicks };
    const now = Math.floor(Date.now() / 1000);
    for (const stock of stocks) {
      const oldPrice = prices[stock.ticker];
      if (oldPrice === undefined) continue;
      const newPrice = mertonStep(oldPrice, stock.drift, stock.volatility, 1 / 1000, stock);
      newPrevPrices[stock.ticker] = oldPrice;
      newPrices[stock.ticker]     = Math.round(newPrice * 100) / 100;
      const tick = { time: now, price: newPrices[stock.ticker], volume: Math.floor(500 + Math.random() * 3000) };
      newRawTicks[stock.ticker] = [...(rawTicks[stock.ticker] || []), tick];
    }
    set({ prices: newPrices, prevPrices: newPrevPrices, rawTicks: newRawTicks });
  },

  /* ── OHLCV from WebSocket rawTicks (covers 15m and 1H charts) ── */
  getOHLCV: (ticker, timeframe = '1D') => {
    const ticks = get().rawTicks[ticker];
    if (!ticks || ticks.length === 0) return [];
    return aggregateToOHLCV(ticks, INTERVAL_SECONDS[timeframe] || 86400);
  },

  /**
   * OHLCV with long-timeframe history.
   * For 4H/1D/1W/1M, merges server-aggregated historical candles with recent
   * rawTicks so the chart seamlessly extends to real-time.
   */
  getOHLCVWithHistory: (ticker, timeframe = '1D') => {
    const { rawTicks, historicalOHLCV } = get();
    const intervalSec = INTERVAL_SECONDS[timeframe] || 86400;

    if (!LONG_TIMEFRAMES.has(timeframe)) {
      return aggregateToOHLCV(rawTicks[ticker] || [], intervalSec);
    }

    const key        = `${ticker}_${timeframe}`;
    const historical = historicalOHLCV[key];
    if (!historical || historical.length === 0) {
      // Fallback to rawTicks while historical data is being fetched
      return aggregateToOHLCV(rawTicks[ticker] || [], intervalSec);
    }

    // Merge: historical candles + recent rawTicks (fills in any gap at the tail)
    const cutoff     = historical[historical.length - 1]?.time ?? 0;
    const recentTicks = (rawTicks[ticker] || []).filter((t) => t.time > cutoff);
    const recentCandles = aggregateToOHLCV(recentTicks, intervalSec);

    // Deduplicate on bucket time
    const merged = [...historical];
    for (const c of recentCandles) {
      if (merged[merged.length - 1]?.time === c.time) {
        merged[merged.length - 1] = c; // update last in-progress candle
      } else {
        merged.push(c);
      }
    }
    return merged;
  },

  /**
   * Fetch server-aggregated OHLCV for long timeframes.
   * Caches result so subsequent calls for the same ticker+timeframe are instant.
   */
  fetchHistoricalOHLCV: async (ticker, timeframe) => {
    const { fetchedSet } = get();
    const key = `${ticker}_${timeframe}`;
    if (fetchedSet[key]) return; // already fetched

    try {
      const res = await fetch(`${API_BASE}/market/ohlcv/${ticker}?timeframe=${timeframe}&limit=500`);
      if (!res.ok) return;
      const candles = await res.json();
      set((s) => ({
        historicalOHLCV: { ...s.historicalOHLCV, [key]: candles },
        fetchedSet:      { ...s.fetchedSet, [key]: true },
      }));
    } catch (err) {
      console.error('fetchHistoricalOHLCV error:', err);
    }
  },

  /* ── Legacy compatibility ───────────────────────────────── */
  getHistories: () => {
    const { rawTicks } = get();
    const histories = {};
    for (const [ticker, ticks] of Object.entries(rawTicks)) {
      histories[ticker] = ticks?.length ? aggregateToOHLCV(ticks, 86400) : [];
    }
    return histories;
  },
}));
