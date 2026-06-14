const API_BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(body.error || body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  /* Auth */
  signUp: (email, password, displayName) =>
    request('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, displayName }) }),
  signIn: (email, password) =>
    request('/auth/signin', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getProfile: (userId) => request(`/auth/profile?userId=${userId}`),
  updateProfile: (userId, displayName) =>
    request('/auth/profile', { method: 'PUT', body: JSON.stringify({ userId, displayName }) }),
  /* Market */
  getStocks: () => request('/market/stocks'),
  getHistory: (ticker, timeframe) => request(`/market/history/${ticker}?timeframe=${timeframe}`),
  getQuote: (ticker) => request(`/market/quote/${ticker}`),

  /* Orders */
  placeOrder: (order) => request('/orders', { method: 'POST', body: JSON.stringify(order) }),
  getOrders: () => request('/orders'),
  cancelOrder: (id) => request(`/orders/${id}`, { method: 'DELETE' }),

  /* Portfolio */
  getPortfolio: (userId = 'default') => request(`/portfolio?userId=${userId}`),
  getPortfolioHistory: (userId = 'default') => request(`/portfolio/history?userId=${userId}`),
  getRiskMetrics: (userId = 'default') => request(`/portfolio/risk?userId=${userId}`),
  executeTrade: (trade) => request('/portfolio/trade', { method: 'POST', body: JSON.stringify(trade) }),

  /* Leaderboard */
  getLeaderboard: (period) => request(`/leaderboard?period=${period}`),

  /* Contest */
  getActiveContests: () => request('/contest/active'),
  joinContest: (userId, contestId) => request('/contest/join', { method: 'POST', body: JSON.stringify({ userId, contestId }) }),
  getContestPortfolio: (userId, contestId) => request(`/contest/portfolio?userId=${userId}&contestId=${contestId}`),
  executeContestTrade: (trade) => request('/contest/trade', { method: 'POST', body: JSON.stringify(trade) }),
  getContestLeaderboard: (contestId) => request(`/contest/leaderboard?contestId=${contestId}`),

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
  runBacktest: (strategy) => request('/advisor/backtest', { method: 'POST', body: JSON.stringify(strategy) }),
};
