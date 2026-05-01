import { create } from 'zustand';
import { INITIAL_CASH } from '../lib/constants';

export const usePortfolioStore = create((set, get) => ({
  cash: INITIAL_CASH,
  initialCash: INITIAL_CASH,
  holdings: {},        // { ticker: { shares, avgPrice, realizedPL } }
  transactions: [],    // { id, type, ticker, orderType, quantity, price, total, time, status }
  portfolioHistory: [], // { time, value }
  dailyPLHistory: [],

  /* Buy shares */
  buy: (ticker, quantity, price, orderType = 'Market') => {
    const total = quantity * price;
    const { cash, holdings, transactions } = get();

    if (total > cash) return false;

    const existing = holdings[ticker] || { shares: 0, avgPrice: 0, realizedPL: 0 };
    const totalShares = existing.shares + quantity;
    const avgPrice = (existing.avgPrice * existing.shares + price * quantity) / totalShares;

    const tx = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type: 'Buy',
      ticker,
      orderType,
      quantity,
      price,
      total,
      time: new Date().toISOString(),
      status: 'Filled',
    };

    set({
      cash: cash - total,
      holdings: {
        ...holdings,
        [ticker]: { shares: totalShares, avgPrice, realizedPL: existing.realizedPL },
      },
      transactions: [tx, ...transactions],
    });
    return tx;
  },

  /* Sell shares */
  sell: (ticker, quantity, price, orderType = 'Market') => {
    const { cash, holdings, transactions } = get();
    const existing = holdings[ticker];

    if (!existing || existing.shares < quantity) return false;

    const total = quantity * price;
    const realizedPL = (price - existing.avgPrice) * quantity;
    const remainingShares = existing.shares - quantity;

    const tx = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type: 'Sell',
      ticker,
      orderType,
      quantity,
      price,
      total,
      time: new Date().toISOString(),
      status: 'Filled',
    };

    const newHoldings = { ...holdings };
    if (remainingShares === 0) {
      newHoldings[ticker] = { shares: 0, avgPrice: 0, realizedPL: existing.realizedPL + realizedPL };
    } else {
      newHoldings[ticker] = {
        shares: remainingShares,
        avgPrice: existing.avgPrice,
        realizedPL: existing.realizedPL + realizedPL,
      };
    }

    set({
      cash: cash + total,
      holdings: newHoldings,
      transactions: [tx, ...transactions],
    });
    return tx;
  },

  /* Calculate portfolio value */
  getPortfolioValue: (prices) => {
    const { cash, holdings } = get();
    let stockValue = 0;
    for (const [ticker, holding] of Object.entries(holdings)) {
      if (holding.shares > 0 && prices[ticker]) {
        stockValue += holding.shares * prices[ticker];
      }
    }
    return cash + stockValue;
  },

  /* Get unrealized P&L */
  getUnrealizedPL: (prices) => {
    const { holdings } = get();
    let total = 0;
    for (const [ticker, holding] of Object.entries(holdings)) {
      if (holding.shares > 0 && prices[ticker]) {
        total += (prices[ticker] - holding.avgPrice) * holding.shares;
      }
    }
    return total;
  },

  /* Get realized P&L */
  getTotalRealizedPL: () => {
    const { holdings } = get();
    let total = 0;
    for (const holding of Object.values(holdings)) {
      total += holding.realizedPL || 0;
    }
    return total;
  },

  /* Get total return */
  getTotalReturn: (prices) => {
    const { initialCash } = get();
    const portfolioValue = get().getPortfolioValue(prices);
    return portfolioValue - initialCash;
  },

  /* Get holdings as array with live P&L */
  getHoldingsArray: (prices) => {
    const { holdings } = get();
    return Object.entries(holdings)
      .filter(([, h]) => h.shares > 0)
      .map(([ticker, h]) => {
        const currentPrice = prices[ticker] || 0;
        const marketValue = h.shares * currentPrice;
        const unrealizedPL = (currentPrice - h.avgPrice) * h.shares;
        const unrealizedPLPercent = h.avgPrice > 0 ? ((currentPrice - h.avgPrice) / h.avgPrice) * 100 : 0;
        return {
          ticker,
          shares: h.shares,
          avgPrice: h.avgPrice,
          currentPrice,
          marketValue,
          unrealizedPL,
          unrealizedPLPercent,
          realizedPL: h.realizedPL,
        };
      })
      .sort((a, b) => b.marketValue - a.marketValue);
  },

  /* Get allocation breakdown */
  getAllocation: (prices) => {
    const { cash } = get();
    const holdingsArr = get().getHoldingsArray(prices);
    const totalValue = get().getPortfolioValue(prices);

    const stockValue = holdingsArr.reduce((sum, h) => sum + h.marketValue, 0);
    return {
      stocks: totalValue > 0 ? (stockValue / totalValue) * 100 : 0,
      cash: totalValue > 0 ? (cash / totalValue) * 100 : 100,
      etfs: 0, // placeholder
      other: 0, // placeholder
    };
  },

  /* Record portfolio snapshot */
  recordSnapshot: (prices) => {
    const value = get().getPortfolioValue(prices);
    set((s) => ({
      portfolioHistory: [...s.portfolioHistory, { time: Date.now(), value }],
    }));
  },

  /* Reset portfolio */
  reset: () =>
    set({
      cash: INITIAL_CASH,
      holdings: {},
      transactions: [],
      portfolioHistory: [],
      dailyPLHistory: [],
    }),
}));
