import { create } from 'zustand';
import { STOCKS } from '../lib/constants';

/* ── GBM Price Simulation (client-side fallback) ────────────── */
function boxMuller() {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function nextPrice(price, drift, volatility, dt = 1 / (252 * 78), basePrice = null) {
  let effectiveDrift = drift;
  // Soft mean reversion toward base price
  if (basePrice && basePrice > 0) {
    const logDev = Math.log(price / basePrice);
    effectiveDrift -= 0.02 * logDev * 252 * dt;
  }
  const z = boxMuller();
  let next = price * Math.exp((effectiveDrift - 0.5 * volatility ** 2) * dt + volatility * Math.sqrt(dt) * z);
  // Clamp to ±60% of base
  if (basePrice) {
    next = Math.max(basePrice * 0.4, Math.min(basePrice * 1.6, next));
  }
  return Math.max(0.01, next);
}

/* ── Generate initial 5-min tick data (fallback only) ────────────── */
function generateInitialData() {
  const prices = {};
  const prevPrices = {};
  const rawTicks = {};

  for (const stock of STOCKS) {
    const ticks = [];
    let price = stock.basePrice * (0.92 + Math.random() * 0.16);
    const now = Math.floor(Date.now() / 1000);
    const intervalSec = 300;
    const barsPerDay = 78;
    const days = 90;
    const totalTicks = days * barsPerDay;
    const startTime = now - totalTicks * intervalSec;
    const dt = 1 / (252 * barsPerDay);

    for (let i = 0; i <= totalTicks; i++) {
      price = i === 0 ? price : nextPrice(price, stock.drift, stock.volatility, dt, stock.basePrice);
      ticks.push({
        time: startTime + i * intervalSec,
        price: Math.round(price * 100) / 100,
        volume: Math.floor(500 + Math.random() * 3000),
      });
    }

    rawTicks[stock.ticker] = ticks;
    prices[stock.ticker] = ticks[ticks.length - 1].price;
    prevPrices[stock.ticker] = ticks[ticks.length - 2]?.price || prices[stock.ticker];
  }

  return { prices, prevPrices, rawTicks };
}

/* ── OHLCV aggregation utility ────────────── */
function aggregateToOHLCV(ticks, intervalSeconds) {
  if (!ticks || ticks.length === 0) return [];

  const candles = [];
  let currentBucket = null;
  let candle = null;

  for (const tick of ticks) {
    const bucket = Math.floor(tick.time / intervalSeconds) * intervalSeconds;

    if (bucket !== currentBucket) {
      if (candle) candles.push(candle);
      currentBucket = bucket;
      candle = {
        time: bucket,
        open: tick.price,
        high: tick.price,
        low: tick.price,
        close: tick.price,
        volume: tick.volume,
      };
    } else {
      candle.high = Math.max(candle.high, tick.price);
      candle.low = Math.min(candle.low, tick.price);
      candle.close = tick.price;
      candle.volume += tick.volume;
    }
  }
  if (candle) candles.push(candle);
  return candles;
}

/* ── Timeframe to seconds map ────────────── */
const INTERVAL_SECONDS = {
  '15m': 900,
  '1H': 3600,
  '4H': 14400,
  '1D': 86400,
  '1W': 604800,
  '1M': 2592000,
};

const initialData = generateInitialData();

/* ── Store ────────────── */
export const useMarketStore = create((set, get) => ({
  stocks: STOCKS,
  prices: initialData.prices,
  prevPrices: initialData.prevPrices,
  rawTicks: initialData.rawTicks,  // minute-level tick data
  regime: 'normal',
  activeScenario: null,
  selectedTicker: 'SCT',
  watchlist: ['SCT', 'INNO', 'NXTG', 'HEAL', 'GRN', 'FINI', 'TECH'],
  news: [],
  isConnected: false,

  /* Replace local data with server's consistent tick history */
  initFromServer: (serverData) => {
    const newPrices = {};
    const newPrevPrices = {};
    const rawTicks = serverData.rawTicks;

    for (const [ticker, ticks] of Object.entries(rawTicks)) {
      const lastTick = ticks[ticks.length - 1];
      const prevTick = ticks[ticks.length - 2];
      newPrices[ticker] = lastTick?.price || serverData.prices[ticker];
      newPrevPrices[ticker] = prevTick?.price || newPrices[ticker];
    }

    set({
      prices: newPrices,
      prevPrices: newPrevPrices,
      rawTicks,
    });
  },

  setSelectedTicker: (ticker) => set({ selectedTicker: ticker }),

  /* Calculate price change for a ticker */
  getChange: (ticker) => {
    const { prices, prevPrices } = get();
    const price = prices[ticker] || 0;
    const prev = prevPrices[ticker] || price;
    const change = price - prev;
    const changePercent = prev !== 0 ? (change / prev) * 100 : 0;
    return { change, changePercent };
  },

  addToWatchlist: (ticker) => {
    const { watchlist } = get();
    if (!watchlist.includes(ticker)) {
      const updated = [...watchlist, ticker];
      set({ watchlist: updated });
    }
  },

  removeFromWatchlist: (ticker) => {
    const { watchlist } = get();
    const updated = watchlist.filter((t) => t !== ticker);
    set({ watchlist: updated });
  },

  setConnected: (connected) => set({ isConnected: connected }),

  /* Update prices from WebSocket tick data */
  updatePrices: (data) => {
    const { prices, rawTicks } = get();
    const newPrices = { ...prices };
    const newPrevPrices = { ...prices };
    const newRawTicks = { ...rawTicks };

    for (const [ticker, update] of Object.entries(data)) {
      newPrevPrices[ticker] = prices[ticker];
      newPrices[ticker] = update.price;

      if (update.tick && newRawTicks[ticker]) {
        newRawTicks[ticker] = [...newRawTicks[ticker], update.tick];
      }
    }

    set({ prices: newPrices, prevPrices: newPrevPrices, rawTicks: newRawTicks });
  },

  /* Local simulation tick (fallback when not connected) */
  simulateTick: () => {
    const { stocks, prices, rawTicks } = get();
    const newPrices = {};
    const newPrevPrices = {};
    const newRawTicks = { ...rawTicks };
    const now = Math.floor(Date.now() / 1000);
    // Same tiny dt as backend: 3s / (252 * 6.5h trading day in seconds)
    const realtimeDt = 3 / (252 * 6.5 * 3600);

    for (const stock of stocks) {
      const oldPrice = prices[stock.ticker];
      if (oldPrice === undefined) continue;

      const newPrice = nextPrice(oldPrice, stock.drift, stock.volatility, realtimeDt, stock.basePrice);
      newPrevPrices[stock.ticker] = oldPrice;
      newPrices[stock.ticker] = Math.round(newPrice * 100) / 100;

      const tick = { time: now, price: newPrices[stock.ticker], volume: Math.floor(500 + Math.random() * 3000) };
      newRawTicks[stock.ticker] = [...(rawTicks[stock.ticker] || []), tick];
    }

    set({ prices: newPrices, prevPrices: newPrevPrices, rawTicks: newRawTicks });
  },

  /* Get OHLCV candles for a ticker at a given timeframe */
  getOHLCV: (ticker, timeframe = '1D') => {
    const { rawTicks } = get();
    const ticks = rawTicks[ticker];
    if (!ticks || ticks.length === 0) return [];

    const intervalSec = INTERVAL_SECONDS[timeframe] || 86400;
    const candles = aggregateToOHLCV(ticks, intervalSec);

    // Limit to last 200 candles for performance
    return candles.slice(-200);
  },

  /* Backward-compatible: return daily OHLCV for legacy components */
  getHistories: () => {
    const { rawTicks } = get();
    const histories = {};

    for (const [ticker, ticks] of Object.entries(rawTicks)) {
      if (!ticks || ticks.length === 0) {
        histories[ticker] = [];
        continue;
      }
      histories[ticker] = aggregateToOHLCV(ticks, 86400);
    }

    return histories;
  },
}));
