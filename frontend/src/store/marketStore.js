import { create } from 'zustand';
import { STOCKS } from '../lib/constants';

/* ── GBM Price Simulation (client-side fallback) ────────────── */
function boxMuller() {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

function nextPrice(price, drift, volatility, dt = 1 / 252) {
  const z = boxMuller();
  const driftTerm = (drift - 0.5 * volatility * volatility) * dt;
  const diffusion = volatility * Math.sqrt(dt) * z;
  return price * Math.exp(driftTerm + diffusion);
}

function generateOHLCV(open, drift, volatility) {
  let high = open, low = open, close = open;
  const ticks = 10;
  for (let i = 0; i < ticks; i++) {
    close = nextPrice(close, drift, volatility, 1 / (252 * ticks));
    if (close > high) high = close;
    if (close < low) low = close;
  }
  const volume = Math.floor(50000 + Math.random() * 200000);
  return { open, high, low, close, volume };
}

function generateHistory(stock, days = 365) {
  const history = [];
  let price = stock.basePrice * (0.7 + Math.random() * 0.3);
  const now = Math.floor(Date.now() / 1000);
  const todayBarTime = Math.floor(now / 86400) * 86400;

  for (let i = days; i >= 0; i--) {
    const ohlcv = generateOHLCV(price, stock.drift, stock.volatility);
    history.push({
      time: todayBarTime - i * 86400,
      ...ohlcv,
    });
    price = ohlcv.close;
  }
  return history;
}

/* ── Initialize stock data ──────────────────────────────────── */
function initStocks() {
  const prices = {};
  const histories = {};
  const prevPrices = {};

  for (const stock of STOCKS) {
    const history = generateHistory(stock);
    const latest = history[history.length - 1];
    const prevClose = history[history.length - 2]?.close || stock.basePrice;
    prices[stock.ticker] = latest.close;
    prevPrices[stock.ticker] = prevClose;
    histories[stock.ticker] = history;
  }

  return { prices, histories, prevPrices };
}

const initialData = initStocks();

export const useMarketStore = create((set, get) => ({
  stocks: STOCKS,
  prices: initialData.prices,
  prevPrices: initialData.prevPrices,
  histories: initialData.histories,
  regime: 'normal',
  activeScenario: null,
  selectedTicker: 'SCT',
  watchlist: ['SCT', 'INNO', 'NXTG', 'HEAL', 'GRN'],
  news: [],
  isConnected: false,

  setSelectedTicker: (ticker) => set({ selectedTicker: ticker }),

  addToWatchlist: (ticker) =>
    set((s) => ({
      watchlist: s.watchlist.includes(ticker) ? s.watchlist : [...s.watchlist, ticker],
    })),

  removeFromWatchlist: (ticker) =>
    set((s) => ({
      watchlist: s.watchlist.filter((t) => t !== ticker),
    })),

  updatePrice: (ticker, price) =>
    set((s) => ({
      prices: { ...s.prices, [ticker]: price },
      prevPrices: { ...s.prices },
    })),

  updatePrices: (updates) =>
    set((s) => {
      const newPrices = { ...s.prices };
      const newHistories = { ...s.histories };
      for (const [ticker, data] of Object.entries(updates)) {
        newPrices[ticker] = data.price;
        if (data.ohlcv && newHistories[ticker]) {
          const lastBar = newHistories[ticker][newHistories[ticker].length - 1];
          if (lastBar && data.ohlcv.time === lastBar.time) {
            newHistories[ticker][newHistories[ticker].length - 1] = data.ohlcv;
          } else {
            newHistories[ticker] = [...newHistories[ticker], data.ohlcv];
          }
        }
      }
      return { prices: newPrices, histories: newHistories };
    }),

  addNews: (newsItem) =>
    set((s) => ({
      news: [newsItem, ...s.news].slice(0, 50),
    })),

  setRegime: (regime) => set({ regime }),
  setActiveScenario: (scenario) => set({ activeScenario: scenario }),
  setConnected: (val) => set({ isConnected: val }),

  /* Client-side tick simulation (runs when no backend) */
  simulateTick: () => {
    const { stocks, prices, histories } = get();
    const newPrices = { ...prices };
    const newHistories = { ...histories };

    for (const stock of stocks) {
      const currentPrice = prices[stock.ticker];
      const newP = nextPrice(currentPrice, stock.drift, stock.volatility);
      newPrices[stock.ticker] = newP;

      // Update the last bar or add new
      const hist = [...(newHistories[stock.ticker] || [])];
      const lastBar = hist[hist.length - 1];
      if (lastBar) {
        const now = Math.floor(Date.now() / 1000);
        const barTime = Math.floor(now / 86400) * 86400;
        if (lastBar.time === barTime) {
          lastBar.close = newP;
          if (newP > lastBar.high) lastBar.high = newP;
          if (newP < lastBar.low) lastBar.low = newP;
          lastBar.volume += Math.floor(Math.random() * 1000);
        } else {
          hist.push({
            time: barTime,
            open: newP,
            high: newP,
            low: newP,
            close: newP,
            volume: Math.floor(Math.random() * 50000),
          });
        }
      }
      newHistories[stock.ticker] = hist;
    }

    set({ prices: newPrices, histories: newHistories });
  },

  getChange: (ticker) => {
    const { prices, prevPrices } = get();
    const current = prices[ticker] || 0;
    const prev = prevPrices[ticker] || current;
    const change = current - prev;
    const changePercent = prev !== 0 ? (change / prev) * 100 : 0;
    return { change, changePercent };
  },

  getStockInfo: (ticker) => {
    const stock = STOCKS.find((s) => s.ticker === ticker);
    const price = get().prices[ticker] || 0;
    const { change, changePercent } = get().getChange(ticker);
    return { ...stock, price, change, changePercent };
  },
}));
