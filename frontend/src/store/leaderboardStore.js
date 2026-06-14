import { create } from 'zustand';
import { api } from '../lib/api';
import { useAuthStore } from './authStore';

export const useLeaderboardStore = create((set, get) => ({
  entries: [],
  period: 'all-time',
  userRank: null,
  loaded: false,

  setPeriod: (period) => {
    set({ period });
    get().fetchFromBackend();
  },

  setEntries: (entries) => set({ entries }),

  /* Fetch leaderboard from backend API */
  fetchFromBackend: async () => {
    try {
      const { period } = get();
      const data = await api.getLeaderboard(period);
      const currentUser = useAuthStore.getState().user;

      const entries = (data || []).map((row, i) => ({
        rank:      row.rank || i + 1,
        userId:    row.userId,
        name:      row.name || 'Anonymous',
        portfolio: row.portfolio || 0,
        return:    row.return   || 0,
        sharpe:    row.sharpe   || 0,
        badge:     null,
        trades:    row.trades   || 0,
      }));

      const userEntry = currentUser
        ? entries.find((e) => e.userId === currentUser.id)
        : null;

      set({ entries, userRank: userEntry?.rank ?? null, loaded: true });
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      set({ loaded: true });
    }
  },

  /* Submit user score — handled server-side during trades */
  submitScore: async (portfolioValue, totalReturn, tradesCount) => {
    // Score is now submitted automatically by the backend during trade execution
    // This method is kept for API compatibility
  },
}));
