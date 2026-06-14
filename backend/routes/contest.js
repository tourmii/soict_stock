import { Router } from 'express';
import { getDb } from '../services/db.js';
import { STOCKS } from '../services/stockData.js';

const router = Router();
const INITIAL_CONTEST_CASH = 100000; // $100k for contest
const CONTEST_TICKERS = STOCKS.slice(0, 15).map(s => s.ticker); // First 15 stocks

import { ObjectId } from 'mongodb';

// Helper to ensure default contests exist
async function getOrCreateDefaultContests(db, engine) {
  let contests = await db.collection('contests').find({ status: 'active' }).toArray();
  if (contests.length === 0) {
    const defaultContestsConfig = [
      { name: 'Weekly Alpha Contest', suffix: 'A' },
      { name: 'Tech Innovators Sprint', suffix: 'B' },
      { name: 'Weekend Crypto Dash', suffix: 'C' }
    ];

    for (const config of defaultContestsConfig) {
      // Generate custom stocks
      const customStocks = Array.from({ length: 5 }).map((_, i) => {
        const basePrice = 10 + Math.random() * 140; 
        const letter = config.suffix + String.fromCharCode(65 + i);
        return {
          ticker: `C_${letter}`,
          name: `${config.name} Asset ${letter}`,
          sector: 'Contest',
          basePrice,
          drift: 0.0001 + Math.random() * 0.0004,
          volatility: 0.015 + Math.random() * 0.02,
          color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
        };
      });

      const allowedTickers = [...CONTEST_TICKERS, ...customStocks.map(s => s.ticker)];

      const contest = {
        name: config.name,
        status: 'active',
        allowedTickers,
        customStocks,
        createdAt: new Date().toISOString(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      
      const result = await db.collection('contests').insertOne(contest);
      contest._id = result.insertedId;
      contests.push(contest);

      // Inject into running engine
      if (engine) {
        const existingTickers = new Set(engine.stocks.map(s => s.ticker));
        const stocksToAdd = customStocks.filter(s => !existingTickers.has(s.ticker));
        
        if (stocksToAdd.length > 0) {
          engine.stocks = [...engine.stocks, ...stocksToAdd];
          
          for (const stock of stocksToAdd) {
            if (!engine.prices[stock.ticker]) {
              console.log(`⏳ Generating history for custom contest stock ${stock.ticker}...`);
              const ticks = engine._generateHistoricalTicks(stock, 90);
              if (ticks.length > 0) {
                await db.collection('ticks').insertMany(ticks, { ordered: false });
                engine.prices[stock.ticker] = ticks[ticks.length - 1].price;
              }
            }
          }
        }
      }
    }
  }
  return contests;
}

// TEMPORARY DROP ROUTE
router.get('/drop', async (req, res) => {
  const db = getDb();
  await db.collection('contests').deleteMany({});
  await db.collection('contest_portfolios').deleteMany({});
  res.json({ message: 'Dropped contests' });
});

// 1. Get active contests
router.get('/active', async (req, res) => {
  const db = getDb();
  try {
    const contests = await getOrCreateDefaultContests(db, req.app.locals.engine);
    res.json(contests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Join contest
router.post('/join', async (req, res) => {
  const { userId, contestId } = req.body;
  if (!userId || !contestId) return res.status(400).json({ message: 'User ID and Contest ID required' });
  const db = getDb();

  try {
    const contest = await db.collection('contests').findOne({ _id: new ObjectId(contestId) });
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    const existing = await db.collection('contest_portfolios').findOne({ contestId: contest._id.toString(), userId });
    
    if (existing) {
      return res.status(400).json({ message: 'Already joined this contest' });
    }

    const newPortfolio = {
      contestId: contest._id.toString(),
      userId,
      cash: INITIAL_CONTEST_CASH,
      initialCash: INITIAL_CONTEST_CASH,
      holdings: [], // return as array for frontend
      joinedAt: new Date().toISOString(),
      portfolioValue: INITIAL_CONTEST_CASH,
    };

    // But save it as object in DB
    const dbPortfolio = { ...newPortfolio, holdings: {} };
    await db.collection('contest_portfolios').insertOne(dbPortfolio);
    res.json({ success: true, portfolio: newPortfolio });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Get contest portfolio
router.get('/portfolio', async (req, res) => {
  const userId = req.query.userId;
  const contestId = req.query.contestId;
  if (!userId || !contestId) return res.status(400).json({ message: 'User ID and Contest ID required' });
  const db = getDb();
  const engine = req.app.locals.engine;

  try {
    const portfolio = await db.collection('contest_portfolios').findOne({ contestId, userId });

    if (!portfolio) {
      return res.json(null); // Not joined
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

    res.json({
      cash: portfolio.cash,
      totalValue,
      initialCash: portfolio.initialCash,
      holdings: holdingsArr,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Trade in contest
router.post('/trade', async (req, res) => {
  const engine = req.app.locals.engine;
  const { userId, contestId, type, ticker, quantity } = req.body;
  const db = getDb();

  if (!userId || !contestId || !type || !ticker || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const contest = await db.collection('contests').findOne({ _id: new ObjectId(contestId) });
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    
    // Check if ticker is allowed
    if (!contest.allowedTickers.includes(ticker)) {
      return res.status(400).json({ message: 'Ticker not allowed in this contest' });
    }

    let portfolio = await db.collection('contest_portfolios').findOne({ contestId: contest._id.toString(), userId });
    if (!portfolio) {
      return res.status(400).json({ message: 'Not joined in contest' });
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
      
      await db.collection('contest_portfolios').updateOne(
        { _id: portfolio._id },
        { $set: { cash: portfolio.cash - total, holdings, updatedAt: new Date().toISOString() } }
      );
    } else if (type === 'Sell') {
      if (existing.shares < quantity) {
        return res.status(400).json({ message: 'Insufficient shares' });
      }
      const realizedPL = (currentPrice - existing.avgPrice) * quantity;
      const remainingShares = existing.shares - quantity;
      
      holdings[ticker] = { shares: remainingShares, avgPrice: remainingShares > 0 ? existing.avgPrice : 0, realizedPL: existing.realizedPL + realizedPL };
      
      await db.collection('contest_portfolios').updateOne(
        { _id: portfolio._id },
        { $set: { cash: portfolio.cash + total, holdings, updatedAt: new Date().toISOString() } }
      );
    } else {
      return res.status(400).json({ message: 'Invalid trade type' });
    }

    // Record contest transaction
    const tx = {
      contestId: contest._id.toString(), userId, type, ticker, quantity, price: currentPrice, total,
      createdAt: new Date().toISOString(),
    };
    await db.collection('contest_transactions').insertOne(tx);

    // Update leaderboard value
    const updatedPortfolio = await db.collection('contest_portfolios').findOne({ _id: portfolio._id });
    let totalValue = updatedPortfolio.cash;
    for (const [t, h] of Object.entries(updatedPortfolio.holdings || {})) {
      if (h.shares > 0) totalValue += h.shares * (engine.prices[t] || 0);
    }
    await db.collection('contest_portfolios').updateOne(
      { _id: portfolio._id },
      { $set: { portfolioValue: totalValue } }
    );

    res.json({ success: true, transaction: tx, cash: updatedPortfolio.cash });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Get leaderboard
router.get('/leaderboard', async (req, res) => {
  const db = getDb();
  const engine = req.app.locals.engine;
  const contestId = req.query.contestId;
  if (!contestId) return res.status(400).json({ message: 'Contest ID required' });
  
  try {
    const portfolios = await db.collection('contest_portfolios')
      .find({ contestId })
      .toArray();

    const leaderboard = portfolios.map(p => {
      let totalValue = p.cash;
      for (const [ticker, h] of Object.entries(p.holdings || {})) {
        if (h.shares > 0) totalValue += h.shares * (engine.prices[ticker] || 0);
      }
      return {
        userId: p.userId,
        portfolioValue: totalValue,
        returnPct: ((totalValue - p.initialCash) / p.initialCash) * 100,
      };
    });

    leaderboard.sort((a, b) => b.portfolioValue - a.portfolioValue);
    
    // Optional: Only return top 50
    res.json(leaderboard.slice(0, 50));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
