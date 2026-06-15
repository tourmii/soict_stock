import { create } from 'zustand';
import { INITIAL_CASH } from '../lib/constants';
import { api } from '../lib/api';
import { useAuthStore } from './authStore';
import { useLeverageStore } from './leverageStore';

export const usePortfolioStore = create((set, get) => ({
    cash: INITIAL_CASH,
    initialCash: INITIAL_CASH,
    holdings: {},        // { ticker: { shares, avgPrice, realizedPL } }
    transactions: [],    // { id, type, ticker, orderType, quantity, price, total, time, status }
    portfolioHistory: [], // { time, value }
    dailyPLHistory: [],

    /* Buy shares — execute via backend API */
    buy: async (ticker, quantity, price, orderType = 'Market', prices = {}, orderId = null) => {
        const total = quantity * price;
        const { cash, holdings, transactions } = get();

        if (total > cash) return false;

        // Optimistic local update
        const existing = holdings[ticker] || { shares: 0, avgPrice: 0, realizedPL: 0 };
        const totalShares = existing.shares + quantity;
        const avgPrice = (existing.avgPrice * existing.shares + price * quantity) / totalShares;

        const tx = {
            id: orderId || Date.now().toString() + Math.random().toString(36).substr(2, 5),
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

        // Sync to backend
        try {
            const userId = useAuthStore.getState().user?.id || 'default';
            await api.executeTrade({ userId, type: 'Buy', ticker, quantity, orderType });
        } catch (err) {
            console.error('Trade sync error:', err);
        }

        return tx;
    },

    /* Sell shares — execute via backend API */
    sell: async (ticker, quantity, price, orderType = 'Market', prices = {}, orderId = null) => {
        const { cash, holdings, transactions } = get();
        const existing = holdings[ticker];

        if (!existing || existing.shares < quantity) return false;

        const total = quantity * price;
        const realizedPL = (price - existing.avgPrice) * quantity;
        const remainingShares = existing.shares - quantity;

        const tx = {
            id: orderId || Date.now().toString() + Math.random().toString(36).substr(2, 5),
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

        // Sync to backend
        try {
            const userId = useAuthStore.getState().user?.id || 'default';
            await api.executeTrade({ userId, type: 'Sell', ticker, quantity, orderType });
        } catch (err) {
            console.error('Trade sync error:', err);
        }

        return tx;
    },

    /* Load portfolio from backend API */
    loadFromBackend: async (prices = {}) => {
        try {
            const userId = useAuthStore.getState().user?.id || 'default';
            const data = await api.getPortfolio(userId);
            if (data) {
                const holdingsMap = {};
                for (const h of (data.holdings || [])) {
                    holdingsMap[h.ticker] = {
                        shares: h.shares,
                        avgPrice: h.avgPrice,
                        realizedPL: h.realizedPL || 0,
                    };
                }
                set({
                    cash: data.cash || INITIAL_CASH,
                    initialCash: data.initialCash || INITIAL_CASH,
                    holdings: holdingsMap,
                    transactions: data.transactions || [],
                });
            }
        } catch (err) {
            console.error('Portfolio load error:', err);
        }
    },

    /* Open non-contest futures positions with live P&L and equity.
       Margin was deducted from cash on open, so each position is worth
       max(0, margin + unrealizedPnL) — adding that back avoids double-count. */
    getFuturesPositions: (prices = {}) => {
        const positions = useLeverageStore.getState().positions || [];
        return positions
            .filter((p) => !p.contestId && p.status === 'Open')
            .map((p) => {
                const currentPrice = prices[p.ticker] || p.entryPrice;
                const unrealizedPnL = (currentPrice - p.entryPrice) * p.quantity * (p.side === 'Long' ? 1 : -1);
                return { ...p, currentPrice, unrealizedPnL, equity: Math.max(0, p.margin + unrealizedPnL) };
            });
    },

    getFuturesEquity: (prices = {}) =>
        get().getFuturesPositions(prices).reduce((sum, p) => sum + p.equity, 0),

    getFuturesUnrealizedPL: (prices = {}) =>
        get().getFuturesPositions(prices).reduce((sum, p) => sum + p.unrealizedPnL, 0),

    /* Calculate portfolio value (cash + market holdings + open futures equity) */
    getPortfolioValue: (prices = {}) => {
        const { cash, holdings } = get();
        let stockValue = 0;
        for (const [ticker, holding] of Object.entries(holdings)) {
            if (holding.shares > 0) {
                stockValue += holding.shares * (prices[ticker] || holding.avgPrice || 0);
            }
        }
        return cash + stockValue + get().getFuturesEquity(prices);
    },

    /* Get unrealized P&L (market holdings + open futures) */
    getUnrealizedPL: (prices) => {
        const { holdings } = get();
        let total = 0;
        for (const [ticker, holding] of Object.entries(holdings)) {
            if (holding.shares > 0 && prices[ticker]) {
                total += (prices[ticker] - holding.avgPrice) * holding.shares;
            }
        }
        return total + get().getFuturesUnrealizedPL(prices);
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
                const currentPrice = prices[ticker] || h.avgPrice || 0;
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
        const futuresValue = get().getFuturesEquity(prices);
        return {
            stocks: totalValue > 0 ? (stockValue / totalValue) * 100 : 0,
            cash: totalValue > 0 ? (cash / totalValue) * 100 : 100,
            futures: totalValue > 0 ? (futuresValue / totalValue) * 100 : 0,
            etfs: 0,
            other: 0,
        };
    },

    /* Record a snapshot of portfolio value for history chart */
    recordSnapshot: (prices) => {
        const value = get().getPortfolioValue(prices);
        const now = new Date().toISOString();
        
        set((s) => ({
            portfolioHistory: [...s.portfolioHistory.slice(-99), { time: now, value }]
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
