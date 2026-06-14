import { create } from 'zustand';
import { api } from '../lib/api';

export const useLeverageStore = create((set, get) => ({
  positions:  [],
  isLoading:  false,

  fetchPositions: async (userId, contestId = null) => {
    if (!userId) return;
    try {
      const data = await api.getLeveragePositions(userId, contestId);
      set({ positions: data });
    } catch (err) {
      console.error('leverage fetch error:', err);
    }
  },

  openPosition: async (userId, ticker, side, leverage, quantity, contestId = null) => {
    set({ isLoading: true });
    try {
      const res = await api.openLeveragePosition({ userId, ticker, side, leverage, quantity, contestId: contestId || null });
      if (res.success) await get().fetchPositions(userId, contestId);
      return res;
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      set({ isLoading: false });
    }
  },

  closePosition: async (userId, positionId, contestId = null) => {
    set({ isLoading: true });
    try {
      const res = await api.closeLeveragePosition({ userId, positionId });
      if (res.success) await get().fetchPositions(userId, contestId);
      return res;
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Update live P&L using current prices (call on every price tick)
  updatePrices: (prices) => {
    set(s => ({
      positions: s.positions.map(p => {
        const cur = prices[p.ticker] || p.entryPrice;
        const pnl = (cur - p.entryPrice) * p.quantity * (p.side === 'Long' ? 1 : -1);
        return { ...p, currentPrice: cur, unrealizedPnL: pnl, marginRemaining: p.margin + pnl };
      }),
    }));
  },
}));
