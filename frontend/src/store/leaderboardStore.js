import { create } from 'zustand';

export const useLeaderboardStore = create((set) => ({
  entries: [
    { rank: 1, name: 'TradeMaster_Pro', portfolio: 189450.20, return: 26.30, sharpe: 2.45, badge: 'top_trader', trades: 142 },
    { rank: 2, name: 'AlphaSeeker', portfolio: 178230.50, return: 18.82, sharpe: 2.12, badge: 'risk_master', trades: 98 },
    { rank: 3, name: 'MarketWhiz', portfolio: 171890.00, return: 14.59, sharpe: 1.87, badge: 'bear_survivor', trades: 215 },
    { rank: 4, name: 'StockNinja', portfolio: 165420.30, return: 10.28, sharpe: 1.65, badge: null, trades: 76 },
    { rank: 5, name: 'BullRunner', portfolio: 159780.40, return: 6.52, sharpe: 1.42, badge: null, trades: 183 },
    { rank: 6, name: 'ValueHawk', portfolio: 156340.10, return: 4.23, sharpe: 1.28, badge: null, trades: 54 },
    { rank: 7, name: 'SwingKing', portfolio: 153290.80, return: 2.19, sharpe: 1.05, badge: null, trades: 267 },
    { rank: 8, name: 'DipBuyer', portfolio: 150890.60, return: 0.59, sharpe: 0.89, badge: null, trades: 145 },
    { rank: 9, name: 'ChartSavant', portfolio: 148560.20, return: -0.96, sharpe: 0.65, badge: null, trades: 312 },
    { rank: 10, name: 'RiskTaker', portfolio: 145230.50, return: -3.18, sharpe: 0.34, badge: null, trades: 89 },
  ],
  period: 'weekly',
  userRank: null,

  setPeriod: (period) => set({ period }),
  setEntries: (entries) => set({ entries }),
}));
