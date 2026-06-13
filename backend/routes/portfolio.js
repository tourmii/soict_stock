import { Router } from 'express';
import { getDb } from '../services/db.js';

const router = Router();
const INITIAL_CASH = 150000;

router.get('/', async (req, res) => {
  const engine = req.app.locals.engine;
  const userId = req.query.userId || 'default';
  const db = getDb();

  try {
    let portfolio = await db.collection('portfolios').findOne({ userId });
    if (!portfolio) {
      portfolio = { userId, cash: INITIAL_CASH, holdings: {}, initialCash: INITIAL_CASH };
      await db.collection('portfolios').insertOne(portfolio);
    }

    let totalValue = portfolio.cash;
    const holdingsArr = [];
    for (const [ticker, h] of Object.entries(portfolio.holdings || {})) {
      if (h.shares > 0) {
        const price = engine.prices[ticker] || 0;
        const marketValue = h.shares * price;
        totalValue += marketValue;
        holdingsArr.push({
          ticker, shares: h.shares, avgPrice: h.avgPrice, currentPrice: price,
          marketValue, unrealizedPL: (price - h.avgPrice) * h.shares,
        });
      }
    }

    const transactions = await db.collection('transactions')
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    res.json({
      cash: portfolio.cash,
      totalValue,
      initialCash: portfolio.initialCash || INITIAL_CASH,
      holdings: holdingsArr,
      transactions,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* Execute a trade (buy/sell) */
router.post('/trade', async (req, res) => {
  const engine = req.app.locals.engine;
  const { userId = 'default', type, ticker, quantity, orderType = 'Market' } = req.body;
  const db = getDb();

  if (!type || !ticker || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    let portfolio = await db.collection('portfolios').findOne({ userId });
    if (!portfolio) {
      portfolio = { userId, cash: INITIAL_CASH, holdings: {}, initialCash: INITIAL_CASH };
      await db.collection('portfolios').insertOne(portfolio);
    }

    const currentPrice = engine.prices[ticker];
    if (!currentPrice) return res.status(404).json({ message: 'Unknown ticker' });

    const total = quantity * currentPrice;
    const holdings = portfolio.holdings || {};
    const existing = holdings[ticker] || { shares: 0, avgPrice: 0, realizedPL: 0 };

    if (type === 'Buy') {
      if (total > portfolio.cash) {
        return res.status(400).json({ message: 'Insufficient funds' });
      }
      const totalShares = existing.shares + quantity;
      const avgPrice = (existing.avgPrice * existing.shares + currentPrice * quantity) / totalShares;

      holdings[ticker] = { shares: totalShares, avgPrice, realizedPL: existing.realizedPL };
      await db.collection('portfolios').updateOne(
        { userId },
        { $set: { cash: portfolio.cash - total, holdings, updatedAt: new Date().toISOString() } }
      );
    } else if (type === 'Sell') {
      if (existing.shares < quantity) {
        return res.status(400).json({ message: 'Insufficient shares' });
      }
      const realizedPL = (currentPrice - existing.avgPrice) * quantity;
      const remainingShares = existing.shares - quantity;

      if (remainingShares === 0) {
        holdings[ticker] = { shares: 0, avgPrice: 0, realizedPL: existing.realizedPL + realizedPL };
      } else {
        holdings[ticker] = { shares: remainingShares, avgPrice: existing.avgPrice, realizedPL: existing.realizedPL + realizedPL };
      }
      await db.collection('portfolios').updateOne(
        { userId },
        { $set: { cash: portfolio.cash + total, holdings, updatedAt: new Date().toISOString() } }
      );
    } else {
      return res.status(400).json({ message: 'Invalid trade type' });
    }

    // Record transaction
    const tx = {
      userId, type, ticker, orderType, quantity, price: currentPrice, total,
      status: 'Filled', createdAt: new Date().toISOString(),
    };
    await db.collection('transactions').insertOne(tx);

    // Update leaderboard
    const updatedPortfolio = await db.collection('portfolios').findOne({ userId });
    let totalValue = updatedPortfolio.cash;
    for (const [t, h] of Object.entries(updatedPortfolio.holdings || {})) {
      if (h.shares > 0) totalValue += h.shares * (engine.prices[t] || 0);
    }
    const totalReturn = ((totalValue - (updatedPortfolio.initialCash || INITIAL_CASH)) / (updatedPortfolio.initialCash || INITIAL_CASH)) * 100;
    const txCount = await db.collection('transactions').countDocuments({ userId });

    await db.collection('leaderboard').updateOne(
      { userId },
      { $set: { userId, portfolioValue: totalValue, totalReturn, trades: txCount, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );

    res.json({ success: true, transaction: tx, cash: updatedPortfolio.cash, holdings: updatedPortfolio.holdings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/history', async (req, res) => {
  const userId = req.query.userId || 'default';
  const db = getDb();
  try {
    const snapshots = await db.collection('portfolio_snapshots')
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();
    res.json(snapshots.reverse());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/risk', async (req, res) => {
  const riskMetrics = req.app.locals.riskMetrics;
  const userId = req.query.userId || 'default';
  const db = getDb();

  try {
    const snapshots = await db.collection('portfolio_snapshots')
      .find({ userId })
      .sort({ createdAt: 1 })
      .toArray();

    const values = snapshots.map((h) => h.value || h.portfolioValue || 0);
    const returns = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] !== 0) returns.push((values[i] - values[i - 1]) / values[i - 1]);
    }
    res.json({
      sharpe: riskMetrics.sharpeRatio(returns),
      maxDrawdown: riskMetrics.maxDrawdown(values),
      volatility: riskMetrics.volatility(returns),
      winRate: 0,
      profitFactor: 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
