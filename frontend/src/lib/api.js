const API_BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  /* Market */
  getStocks: () => request('/market/stocks'),
  getHistory: (ticker, timeframe) => request(`/market/history/${ticker}?timeframe=${timeframe}`),
  getQuote: (ticker) => request(`/market/quote/${ticker}`),

  /* Orders */
  placeOrder: (order) => request('/orders', { method: 'POST', body: JSON.stringify(order) }),
  getOrders: () => request('/orders'),
  cancelOrder: (id) => request(`/orders/${id}`, { method: 'DELETE' }),

  /* Portfolio */
  getPortfolio: () => request('/portfolio'),
  getPortfolioHistory: () => request('/portfolio/history'),
  getRiskMetrics: () => request('/portfolio/risk'),

  /* Leaderboard */
  getLeaderboard: (period) => request(`/leaderboard?period=${period}`),

  /* Advisor */
  chatAdvisor: (message, mode, context) =>
    request('/advisor/chat', {
      method: 'POST',
      body: JSON.stringify({ message, mode, context }),
    }),

  /* Scenarios */
  activateScenario: (id) => request(`/scenarios/${id}/activate`, { method: 'POST' }),
  deactivateScenario: () => request('/scenarios/deactivate', { method: 'POST' }),

  /* Backtest */
  runBacktest: (strategy) => request('/backtest', { method: 'POST', body: JSON.stringify(strategy) }),
};
