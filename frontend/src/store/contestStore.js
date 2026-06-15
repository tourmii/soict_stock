import { create } from 'zustand';
import { api } from '../lib/api';
import { useLeverageStore } from './leverageStore';

export const useContestStore = create((set, get) => ({
  contests: [],
  currentContest: null, // The currently viewed/joined contest in Arena
  isJoined: false,
  portfolio: null,
  leaderboard: [],
  isLoading: false,

  fetchActiveContests: async () => {
    try {
      const activeContests = await api.getActiveContests();
      set({ contests: activeContests });
    } catch (err) {
      console.error('Failed to fetch active contests', err);
    }
  },

  selectContest: async (contestId, userId) => {
    const { contests } = get();
    const contest = contests.find(c => c._id === contestId);
    set({ currentContest: contest || null, leaderboard: [] });
    if (userId && contest) {
      await get().checkIfJoined(userId, contestId);
      await get().fetchLeaderboard(contestId);
    }
  },

  checkIfJoined: async (userId, contestId) => {
    if (!contestId) return;
    try {
      const pf = await api.getContestPortfolio(userId, contestId);
      if (pf) {
        set({ isJoined: true, portfolio: pf });
      } else {
        set({ isJoined: false, portfolio: null });
      }
    } catch (err) {
      console.error('Failed to check contest portfolio', err);
    }
  },

  joinContest: async (userId, contestId) => {
    if (!contestId) return;
    set({ isLoading: true });
    try {
      const res = await api.joinContest(userId, contestId);
      if (res.success) {
        set({ isJoined: true, portfolio: res.portfolio });
        await get().fetchLeaderboard(contestId);
      }
    } catch (err) {
      console.error('Failed to join contest', err);
    } finally {
      set({ isLoading: false });
    }
  },

  trade: async (userId, contestId, type, ticker, quantity) => {
    set({ isLoading: true });
    try {
      const res = await api.executeContestTrade({ userId, contestId, type, ticker, quantity });
      if (res.success) {
        await get().checkIfJoined(userId, contestId);
        await get().fetchLeaderboard(contestId);
      }
      return res;
    } catch (err) {
      console.error('Contest trade error:', err);
      return { success: false, message: err.message };
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLeaderboard: async (contestId) => {
    if (!contestId) return;
    try {
      const lb = await api.getContestLeaderboard(contestId);
      set({ leaderboard: lb });
    } catch (err) {
      console.error('Failed to fetch contest leaderboard', err);
    }
  },
  
  getContestPortfolioValue: (prices) => {
      const { portfolio, currentContest } = get();
      if (!portfolio) return 0;
      let stockValue = 0;
      for (const h of (portfolio.holdings || [])) {
          if (h.shares > 0) {
              stockValue += h.shares * (prices[h.ticker] || h.avgPrice || 0);
          }
      }
      return portfolio.cash + stockValue + get().getContestFuturesEquity(prices);
  },

  /* Open contest futures positions with live P&L and equity.
     Margin was deducted from the contest cash on open, so each position is
     worth max(0, margin + unrealizedPnL). */
  getContestFuturesPositions: (prices) => {
      const { currentContest } = get();
      if (!currentContest) return [];
      const positions = useLeverageStore.getState().positions || [];
      return positions
          .filter((p) => p.contestId === currentContest._id && p.status === 'Open')
          .map((p) => {
              const currentPrice = prices[p.ticker] || p.entryPrice;
              const unrealizedPnL = (currentPrice - p.entryPrice) * p.quantity * (p.side === 'Long' ? 1 : -1);
              return { ...p, currentPrice, unrealizedPnL, equity: Math.max(0, p.margin + unrealizedPnL) };
          });
  },

  getContestFuturesEquity: (prices) =>
      get().getContestFuturesPositions(prices).reduce((sum, p) => sum + p.equity, 0),
}));
