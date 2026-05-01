import { create } from 'zustand';

export const useSettingsStore = create((set) => ({
  theme: 'light',
  chartType: 'candlestick', // 'candlestick' | 'line'
  showVolume: true,
  advisorMode: 'trend',
  advisorOpen: false,
  toasts: [],

  setChartType: (chartType) => set({ chartType }),
  setShowVolume: (showVolume) => set({ showVolume }),
  setAdvisorMode: (advisorMode) => set({ advisorMode }),
  toggleAdvisor: () => set((s) => ({ advisorOpen: !s.advisorOpen })),

  addToast: (toast) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { id: Date.now(), ...toast },
      ],
    })),

  removeToast: (id) =>
    set((s) => ({
      toasts: s.toasts.filter((t) => t.id !== id),
    })),
}));
