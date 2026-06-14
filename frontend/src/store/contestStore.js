import { create } from 'zustand';
import { api } from '../lib/api';

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
      const { portfolio } = get();
      if (!portfolio) return 0;
      let stockValue = 0;
      for (const h of (portfolio.holdings || [])) {
          if (h.shares > 0) {
              stockValue += h.shares * (prices[h.ticker] || h.avgPrice || 0);
          }
      }
      return portfolio.cash + stockValue;
  },
}));
