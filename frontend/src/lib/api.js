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

  /* Learning */
  getLearningProgress: (userId) => request(`/learning/progress?userId=${encodeURIComponent(userId)}`),
  updateLearningProgress: (payload) =>
    request('/learning/progress', { method: 'PUT', body: JSON.stringify(payload) }),
  markLearningSection: (payload) =>
    request('/learning/lesson/section', { method: 'POST', body: JSON.stringify(payload) }),
  saveQuizResult: (payload) =>
    request('/learning/quiz/result', { method: 'POST', body: JSON.stringify(payload) }),
  resetLearningProgress: (userId) =>
    request('/learning/reset', { method: 'POST', body: JSON.stringify({ userId }) }),
};
