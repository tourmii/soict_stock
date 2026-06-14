const API_BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
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

  /* Leverage */
  getLeveragePositions: (userId, contestId = null) => {
    const params = new URLSearchParams({ userId });
    if (contestId) params.set('contestId', contestId);
    return request(`/leverage?${params.toString()}`);
  },
  openLeveragePosition: (body) => request('/leverage/open', { method: 'POST', body: JSON.stringify(body) }),
  closeLeveragePosition: (body) => request('/leverage/close', { method: 'POST', body: JSON.stringify(body) }),

  /* Advisor */
  chatAdvisor: (message, mode, context) =>
    request('/advisor/chat', {
      method: 'POST',
      body: JSON.stringify({ message, mode, context }),
    }),

  /* Chatbot */
  sendChatbotMessage: (payload) =>
    request('/chatbot/message', { method: 'POST', body: JSON.stringify(payload) }),
  getChatbotHistory: (userId) =>
    request(`/chatbot/history?userId=${encodeURIComponent(userId)}`),
  saveChatbotHistory: (payload) =>
    request('/chatbot/history', { method: 'POST', body: JSON.stringify(payload) }),
  clearChatbotHistory: (userId) =>
    request(`/chatbot/history?userId=${encodeURIComponent(userId)}`, { method: 'DELETE' }),

  /* Scenarios */
  activateScenario: (id) => request(`/scenarios/${id}/activate`, { method: 'POST' }),
  deactivateScenario: () => request('/scenarios/deactivate', { method: 'POST' }),

  /* Backtest */
  runBacktest: (strategy) => request('/advisor/backtest', { method: 'POST', body: JSON.stringify(strategy) }),

  /* Blogs */
  getBlogs: (sort = 'time', userId = '', stock = '', author = '') => {
    const params = new URLSearchParams({ sort });
    if (userId) params.set('userId', userId);
    if (stock) params.set('stock', stock);
    if (author) params.set('author', author);
    return request(`/blogs?${params.toString()}`, {
      headers: userId ? { 'x-user-id': userId } : undefined,
    });
  },
  getBlogProfile: (profileUserId, sort = 'time', viewerId = '') => {
    const params = new URLSearchParams({ sort });
    if (viewerId) params.set('userId', viewerId);
    return request(`/blogs/profiles/${encodeURIComponent(profileUserId)}?${params.toString()}`, {
      headers: viewerId ? { 'x-user-id': viewerId } : undefined,
    });
  },
  getBlog: (slug, userId = '') => {
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/blogs/${encodeURIComponent(slug)}${query}`, {
      headers: userId ? { 'x-user-id': userId } : undefined,
    });
  },
  getMyBlogs: (userId) => request(`/blogs/me?userId=${encodeURIComponent(userId)}`, {
    headers: { 'x-user-id': userId },
  }),
  createBlogPost: (post, userId) => request('/blogs', {
    method: 'POST',
    headers: { 'x-user-id': userId },
    body: JSON.stringify({ ...post, userId }),
  }),
  updateBlogPost: (id, post, userId) => request(`/blogs/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'x-user-id': userId },
    body: JSON.stringify({ ...post, userId }),
  }),
  publishBlogPost: (id, userId) => request(`/blogs/${encodeURIComponent(id)}/publish`, {
    method: 'PATCH',
    headers: { 'x-user-id': userId },
    body: JSON.stringify({ userId }),
  }),
  archiveBlogPost: (id, userId) => request(`/blogs/${encodeURIComponent(id)}/archive`, {
    method: 'PATCH',
    headers: { 'x-user-id': userId },
    body: JSON.stringify({ userId }),
  }),
  deleteBlogPost: (id, userId) => request(`/blogs/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'x-user-id': userId },
    body: JSON.stringify({ userId }),
  }),
  voteBlogPost: (id, vote, userId) => request(`/blogs/${encodeURIComponent(id)}/vote`, {
    method: 'POST',
    headers: { 'x-user-id': userId },
    body: JSON.stringify({ vote, userId }),
  }),
  commentBlogPost: (id, content, userId) => request(`/blogs/${encodeURIComponent(id)}/comments`, {
    method: 'POST',
    headers: { 'x-user-id': userId },
    body: JSON.stringify({ content, userId }),
  }),
  deleteBlogComment: (id, commentId, userId) => request(`/blogs/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}`, {
    method: 'DELETE',
    headers: { 'x-user-id': userId },
    body: JSON.stringify({ userId }),
  }),
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
