import { Router } from 'express';
const router = Router();

// In-memory portfolio state
let portfolio = { cash: 150000, holdings: {}, transactions: [], history: [] };

router.get('/', (req, res) => {
  const engine = req.app.locals.engine;
  let totalValue = portfolio.cash;
  const holdingsArr = [];
  for (const [ticker, h] of Object.entries(portfolio.holdings)) {
    if (h.shares > 0) {
      const price = engine.prices[ticker] || 0;
      const marketValue = h.shares * price;
      totalValue += marketValue;
      holdingsArr.push({ ticker, shares: h.shares, avgPrice: h.avgPrice, currentPrice: price, marketValue, unrealizedPL: (price - h.avgPrice) * h.shares });
    }
  }
  res.json({ cash: portfolio.cash, totalValue, holdings: holdingsArr, transactions: portfolio.transactions.slice(0, 50) });
});

router.get('/history', (req, res) => {
  res.json(portfolio.history);
});

router.get('/risk', (req, res) => {
  const riskMetrics = req.app.locals.riskMetrics;
  const values = portfolio.history.map((h) => h.value);
  const returns = [];
  for (let i = 1; i < values.length; i++) {
    returns.push((values[i] - values[i - 1]) / values[i - 1]);
  }
  res.json({
    sharpe: riskMetrics.sharpeRatio(returns),
    maxDrawdown: riskMetrics.maxDrawdown(values),
    volatility: riskMetrics.volatility(returns),
    winRate: 0,
    profitFactor: 0,
  });
});

export default router;
