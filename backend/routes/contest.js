import { Router } from 'express';
import { getDb } from '../services/db.js';
import { STOCKS } from '../services/stockData.js';
import { ObjectId } from 'mongodb';
import { futuresEquity } from '../services/valuation.js';

const router = Router();
const INITIAL_CONTEST_CASH = 100000;
const CONTEST_TICKERS = STOCKS.slice(0, 12).map(s => s.ticker);

export const CONTEST_SCENARIOS = {
  bull_run: {
    id: 'bull_run',
    name: 'Bull Market Run',
    description: 'Strong upward momentum, low volatility. Ride the wave and maximize gains.',
    badgeColor: '#22C55E',
    driftBoost: 0.0015,
    volMult: 0.85,
  },
  crisis_2008: {
    id: 'crisis_2008',
    name: 'Financial Crisis',
    description: 'Banks collapse, credit freezes. Survive the meltdown and find the rare opportunities.',
    badgeColor: '#EF4444',
    driftBoost: -0.003,
    volMult: 2.5,
  },
  tech_bubble: {
    id: 'tech_bubble',
    name: 'Tech Bubble',
    description: 'Irrational exuberance and high volatility. Time entries and exits carefully.',
    badgeColor: '#8B5CF6',
    driftBoost: 0.002,
    volMult: 1.8,
  },
  high_inflation: {
    id: 'high_inflation',
    name: 'High Inflation',
    description: 'Rising rates hit growth stocks. Rotate into value and energy plays.',
    badgeColor: '#F59E0B',
    driftBoost: -0.001,
    volMult: 1.3,
  },
  bear_market: {
    id: 'bear_market',
    name: 'Bear Market',
    description: 'Sustained downtrend with elevated volatility. Defense and short plays.',
    badgeColor: '#DC2626',
    driftBoost: -0.002,
    volMult: 1.4,
  },
  risky_growth: {
    id: 'risky_growth',
    name: 'High-Risk Ventures',
    description: 'Speculative moonshots with extreme volatility. Huge gains or total wipeout — timing is everything.',
    badgeColor: '#F97316',
    driftBoost: 0.0035,
    volMult: 2.2,
  },
  ta_patterns: {
    id: 'ta_patterns',
    name: 'Technical Analysis',
    description: 'Trending market with clear chart patterns. Test your chart reading, support/resistance, and timing skills.',
    badgeColor: '#06B6D4',
    driftBoost: 0.0008,
    volMult: 0.95,
  },
};

// Each entry defines a contest with its scenario and fixed themed alpha stocks.
// Suffix letter determines ticker prefix: 'A' → C_AA, C_AB, …
const DEFAULT_CONTEST_CONFIGS = [
  {
    name: 'Financial Crisis',
    suffix: 'A',
    scenarioId: 'crisis_2008',
    stocks: [
      { name: 'FirsTrust Bank',    sector: 'Finance',    basePrice: 28,  drift: 0.0003, volatility: 0.032 },
      { name: 'Atlantic Mortgage', sector: 'Finance',    basePrice: 15,  drift: 0.0001, volatility: 0.038 },
      { name: 'Credit Corp',       sector: 'Finance',    basePrice: 44,  drift: 0.0002, volatility: 0.030 },
      { name: 'Bail Capital',      sector: 'Industrial', basePrice: 57,  drift: 0.0002, volatility: 0.035 },
    ],
    rewards: [
      { rank: '1',     type: 'Grand Prize Bundle', name: 'SOICT Stock Champion Pack (T-Shirt + Bottle + Cap)', image: '/soict_stock_tshirt.png', description: 'The complete official merchandise gear set for the absolute champion.' },
      { rank: '2 - 5', type: 'Elite Prize Bundle',  name: 'SOICT Stock Runner-Up Pack (T-Shirt + Cap)',        image: '/soict_stock_cap.png',    description: 'Exclusive T-Shirt and Cap for the elite runner-up traders.' },
    ],
  },
  {
    name: 'High-Risk Ventures',
    suffix: 'B',
    scenarioId: 'risky_growth',
    stocks: [
      { name: 'MoonTech Inc',     sector: 'Technology', basePrice: 12,  drift: 0.0005, volatility: 0.042 },
      { name: 'Quantum Leap',     sector: 'Technology', basePrice: 88,  drift: 0.0004, volatility: 0.038 },
      { name: 'BioFrontier Labs', sector: 'Healthcare', basePrice: 35,  drift: 0.0003, volatility: 0.045 },
      { name: 'Viral Growth Co',  sector: 'Consumer',   basePrice: 8,   drift: 0.0006, volatility: 0.040 },
    ],
    rewards: [
      { rank: '1',     type: 'Grand Prize Bundle', name: 'SOICT Stock Tech Legend Pack (T-Shirt + Bottle + Cap)', image: '/soict_stock_tshirt.png', description: 'Custom printed tech sector champion set.' },
      { rank: '2 - 5', type: 'Elite Prize Bundle',  name: 'SOICT Stock Tech Legend Pack (T-Shirt + Cap)',         image: '/soict_stock_cap.png',    description: 'Exclusive T-Shirt and Cap for the tech sprint runners-up.' },
    ],
  },
  {
    name: 'TA Mastermind',
    suffix: 'C',
    scenarioId: 'ta_patterns',
    stocks: [
      { name: 'TrendLine Capital', sector: 'Finance',    basePrice: 76,  drift: 0.0003, volatility: 0.024 },
      { name: 'PivotPoint Corp',   sector: 'Industrial', basePrice: 48,  drift: 0.0002, volatility: 0.022 },
      { name: 'Breakout Systems',  sector: 'Technology', basePrice: 112, drift: 0.0004, volatility: 0.026 },
      { name: 'Reversal Media',    sector: 'Consumer',   basePrice: 33,  drift: 0.0002, volatility: 0.020 },
    ],
    rewards: [
      { rank: '1',     type: 'Grand Prize Bundle', name: 'SOICT Stock Crypto Bull Pack (T-Shirt + Bottle + Cap)', image: '/soict_stock_tshirt.png', description: 'Premium cotton t-shirt, insulated thermos bottle, and sleek cap.' },
      { rank: '2 - 5', type: 'Elite Prize Bundle',  name: 'SOICT Stock HODL Pack (T-Shirt + Cap)',                image: '/soict_stock_cap.png',    description: 'Exclusive T-Shirt and Cap for the top TA runners-up.' },
    ],
  },
];

async function getOrCreateDefaultContests(db, engine) {
  let contests = await db.collection('contests').find({ status: 'active' }).toArray();
  if (contests.length === 0) {
    for (const config of DEFAULT_CONTEST_CONFIGS) {
      const scenario = CONTEST_SCENARIOS[config.scenarioId];

      const customStocks = config.stocks.map((s, i) => {
        const letter = config.suffix + String.fromCharCode(65 + i);
        return {
          ticker:     `C_${letter}`,
          name:       s.name,
          fullName:   `${s.name} — ${config.name}`,
          sector:     s.sector,
          basePrice:  s.basePrice,
          drift:      s.drift,
          volatility: s.volatility,
          color:      `hsl(${(i * 97 + 37) % 360}, 68%, 52%)`,
        };
      });

      const contest = {
        name:           config.name,
        status:         'active',
        scenario,
        allowedTickers: customStocks.map(s => s.ticker),
        customStocks,
        rewards: config.rewards,
        createdAt: new Date().toISOString(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const result = await db.collection('contests').insertOne(contest);
      contest._id = result.insertedId;
      contests.push(contest);

      // Inject custom stocks into engine with scenario-adjusted history
      if (engine) {
        const existingTickers = new Set(engine.stocks.map(s => s.ticker));
        const stocksToAdd = customStocks.filter(s => !existingTickers.has(s.ticker));

        if (stocksToAdd.length > 0) {
          for (const stock of stocksToAdd) {
            engine.prices[stock.ticker]     = stock.basePrice;
            engine.momentum[stock.ticker]   = 0;
            engine.volCluster[stock.ticker] = 1;
          }
          engine.stocks = [...engine.stocks, ...stocksToAdd];

          for (let si = 0; si < stocksToAdd.length; si++) {
            const stock = stocksToAdd[si];
            const stockScenario = scenario; // all alphas share the contest's scenario
            console.log(`⏳ Generating history for ${stock.ticker} [${stockScenario.name}]...`);
            const now          = Math.floor(Date.now() / 1000);
            const historyStart = now - 365 * 86400;
            const historyVolMult = Math.min(stockScenario.volMult, 1.8);
            const scenarioStock = {
              ...stock,
              drift:      stock.drift      + stockScenario.driftBoost,
              volatility: stock.volatility * historyVolMult,
            };
            const ticks = engine._generateHistory(scenarioStock, now, historyStart);
            if (ticks.length > 0) {
              await db.collection('ticks').insertMany(ticks, { ordered: false }).catch(() => {});
              engine.prices[stock.ticker] = ticks[ticks.length - 1].price;
            }
          }

          // Register real-time scenario overrides
          engine.applyTickerScenario(stocksToAdd.map(s => s.ticker), scenario);
        }
      }
    }
  } else {
    // Contests already exist — re-register scenario overrides for custom stocks
    // (needed after server restart)
    if (engine) {
      for (const contest of contests) {
        if (!contest.scenario || !contest.customStocks?.length) continue;
        const existingTickers = new Set(engine.stocks.map(s => s.ticker));
        const scenarioTickers = contest.customStocks
          .filter(s => existingTickers.has(s.ticker))
          .map(s => s.ticker);
        if (scenarioTickers.length > 0) {
          engine.applyTickerScenario(scenarioTickers, contest.scenario);
        }
      }
    }
  }
  return contests;
}

// Temporary drop route
router.get('/drop', async (req, res) => {
  const db = getDb();
  const engine = req.app.locals.engine;
  const contests = await db.collection('contests').find({}).toArray();
  for (const c of contests) {
    if (c.customStocks) {
      engine?.removeTickerScenario(c.customStocks.map(s => s.ticker));
      engine && (engine.stocks = engine.stocks.filter(s => !c.customStocks.some(cs => cs.ticker === s.ticker)));
    }
  }
  await db.collection('contests').deleteMany({});
  await db.collection('contest_portfolios').deleteMany({});
  res.json({ message: 'Dropped contests' });
});

// 1. Get active contests
router.get('/active', async (req, res) => {
  try {
    const contests = await getOrCreateDefaultContests(getDb(), req.app.locals.engine);
    res.json(contests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Join contest
router.post('/join', async (req, res) => {
  const { userId, contestId } = req.body;
  if (!userId || !contestId) return res.status(400).json({ message: 'userId and contestId required' });
  const db = getDb();
  try {
    const contest = await db.collection('contests').findOne({ _id: new ObjectId(contestId) });
    if (!contest) return res.status(404).json({ message: 'Contest not found' });

    const existing = await db.collection('contest_portfolios').findOne({ contestId: contest._id.toString(), userId });
    if (existing) return res.status(400).json({ message: 'Already joined' });

    const portfolio = {
      contestId:    contest._id.toString(),
      userId,
      cash:         INITIAL_CONTEST_CASH,
      initialCash:  INITIAL_CONTEST_CASH,
      holdings:     {},
      joinedAt:     new Date().toISOString(),
      portfolioValue: INITIAL_CONTEST_CASH,
    };
    await db.collection('contest_portfolios').insertOne(portfolio);
    res.json({ success: true, portfolio: { ...portfolio, holdings: [] } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Get contest portfolio
router.get('/portfolio', async (req, res) => {
  const { userId, contestId } = req.query;
  if (!userId || !contestId) return res.status(400).json({ message: 'userId and contestId required' });
  const engine = req.app.locals.engine;
  const db = getDb();
  try {
    const portfolio = await db.collection('contest_portfolios').findOne({ contestId, userId });
    if (!portfolio) return res.json(null);

    let totalValue = portfolio.cash;
    const holdingsArr = [];
    for (const [ticker, h] of Object.entries(portfolio.holdings || {})) {
      if (h.shares > 0) {
        const price = engine.prices[ticker] || 0;
        totalValue += h.shares * price;
        holdingsArr.push({
          ticker, shares: h.shares, avgPrice: h.avgPrice,
          currentPrice: price, marketValue: h.shares * price,
          unrealizedPL: (price - h.avgPrice) * h.shares,
        });
      }
    }

    // Open contest futures positions count toward total value (margin + unrealized PnL)
    const positions = await db.collection('leveraged_positions')
      .find({ userId, status: 'Open', contestId })
      .toArray();
    totalValue += futuresEquity(positions, engine.prices);

    res.json({ cash: portfolio.cash, totalValue, initialCash: portfolio.initialCash, holdings: holdingsArr });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Trade in contest (regular stock)
router.post('/trade', async (req, res) => {
  const engine = req.app.locals.engine;
  const { userId, contestId, type, ticker, quantity } = req.body;
  const db = getDb();

  if (!userId || !contestId || !type || !ticker || !quantity || quantity <= 0)
    return res.status(400).json({ message: 'Missing required fields' });

  try {
    const contest = await db.collection('contests').findOne({ _id: new ObjectId(contestId) });
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    if (!contest.allowedTickers.includes(ticker))
      return res.status(400).json({ message: 'Ticker not allowed in this contest' });

    let portfolio = await db.collection('contest_portfolios').findOne({ contestId: contest._id.toString(), userId });
    if (!portfolio) return res.status(400).json({ message: 'Not joined' });

    const currentPrice = engine.prices[ticker];
    if (!currentPrice) return res.status(404).json({ message: 'Unknown ticker' });

    const total    = quantity * currentPrice;
    const holdings = portfolio.holdings || {};
    const existing = holdings[ticker] || { shares: 0, avgPrice: 0, realizedPL: 0 };

    if (type === 'Buy') {
      if (total > portfolio.cash) return res.status(400).json({ message: 'Insufficient funds' });
      const totalShares = existing.shares + quantity;
      holdings[ticker] = {
        shares: totalShares,
        avgPrice: (existing.avgPrice * existing.shares + currentPrice * quantity) / totalShares,
        realizedPL: existing.realizedPL,
      };
      await db.collection('contest_portfolios').updateOne(
        { _id: portfolio._id },
        { $set: { cash: portfolio.cash - total, holdings } }
      );
    } else if (type === 'Sell') {
      if (existing.shares < quantity) return res.status(400).json({ message: 'Insufficient shares' });
      const realizedPL      = (currentPrice - existing.avgPrice) * quantity;
      const remainingShares = existing.shares - quantity;
      holdings[ticker] = {
        shares: remainingShares,
        avgPrice: remainingShares > 0 ? existing.avgPrice : 0,
        realizedPL: existing.realizedPL + realizedPL,
      };
      await db.collection('contest_portfolios').updateOne(
        { _id: portfolio._id },
        { $set: { cash: portfolio.cash + total, holdings } }
      );
    } else {
      return res.status(400).json({ message: 'Invalid trade type' });
    }

    const tx = { contestId: contest._id.toString(), userId, type, ticker, quantity, price: currentPrice, total, createdAt: new Date().toISOString() };
    await db.collection('contest_transactions').insertOne(tx);

    // Update portfolio value for leaderboard
    const updated = await db.collection('contest_portfolios').findOne({ _id: portfolio._id });
    let totalValue = updated.cash;
    for (const [t, h] of Object.entries(updated.holdings || {})) {
      if (h.shares > 0) totalValue += h.shares * (engine.prices[t] || 0);
    }
    await db.collection('contest_portfolios').updateOne({ _id: portfolio._id }, { $set: { portfolioValue: totalValue } });

    res.json({ success: true, transaction: tx });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Contest leaderboard
router.get('/leaderboard', async (req, res) => {
  const { contestId } = req.query;
  if (!contestId) return res.status(400).json({ message: 'contestId required' });
  const engine = req.app.locals.engine;
  const db = getDb();
  try {
    const portfolios = await db.collection('contest_portfolios').find({ contestId }).toArray();

    // Open contest futures positions, grouped by user, count toward each value
    const positions = await db.collection('leveraged_positions')
      .find({ contestId, status: 'Open' })
      .toArray();
    const posByUser = {};
    for (const p of positions) (posByUser[p.userId] ||= []).push(p);

    const lb = portfolios.map(p => {
      let totalValue = p.cash;
      for (const [ticker, h] of Object.entries(p.holdings || {})) {
        if (h.shares > 0) totalValue += h.shares * (engine.prices[ticker] || 0);
      }
      totalValue += futuresEquity(posByUser[p.userId] || [], engine.prices);
      return { userId: p.userId, portfolioValue: totalValue, returnPct: ((totalValue - p.initialCash) / p.initialCash) * 100 };
    });
    lb.sort((a, b) => b.portfolioValue - a.portfolioValue);
    res.json(lb.slice(0, 50));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;