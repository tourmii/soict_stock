import { Router } from 'express';
import { getDb } from '../services/db.js';
import { futuresEquity } from '../services/valuation.js';

const router = Router();
const INITIAL_CASH = 150000;

router.get('/', async (req, res) => {
  const db     = getDb();
  const engine = req.app.locals.engine;
  const period = req.query.period || 'all-time';

  try {
    // Period filter: only include users who traded within the window
    const filter = {};
    if (period === 'weekly') {
      filter.updatedAt = { $gte: new Date(Date.now() - 7 * 86400000).toISOString() };
    } else if (period === 'monthly') {
      filter.updatedAt = { $gte: new Date(Date.now() - 30 * 86400000).toISOString() };
    }

    // Candidate leaders, then recompute each one's value LIVE so it reflects
    // current prices + open futures equity (the stored value is action-time only).
    const leaders = await db.collection('leaderboard').find(filter).toArray();
    const userIds = leaders.map((l) => l.userId).filter(Boolean);

    const [users, portfolios, positions] = await Promise.all([
      userIds.length ? db.collection('users').find({ _id: { $in: userIds } }).toArray() : [],
      userIds.length ? db.collection('portfolios').find({ userId: { $in: userIds } }).toArray() : [],
      userIds.length ? db.collection('leveraged_positions').find({ userId: { $in: userIds }, status: 'Open', contestId: null }).toArray() : [],
    ]);

    const nameMap = Object.fromEntries(users.map((u) => [u._id, u.display_name]));
    const pfMap   = Object.fromEntries(portfolios.map((p) => [p.userId, p]));
    const posMap  = {};
    for (const p of positions) (posMap[p.userId] ||= []).push(p);

    const liveValue = (userId, fallback) => {
      const pf = pfMap[userId];
      if (!pf) return fallback || 0;
      let v = pf.cash;
      for (const [t, h] of Object.entries(pf.holdings || {})) {
        if (h.shares > 0) v += h.shares * (engine?.prices[t] || 0);
      }
      v += futuresEquity(posMap[userId] || [], engine?.prices || {});
      return v;
    };

    const result = leaders
      .map((l) => {
        const pf = pfMap[l.userId];
        const initialCash = pf?.initialCash || INITIAL_CASH;
        const portfolio = liveValue(l.userId, l.portfolioValue);
        return {
          userId:    l.userId,
          name:      nameMap[l.userId] || l.displayName || 'Anonymous',
          portfolio,
          return:    ((portfolio - initialCash) / initialCash) * 100,
          sharpe:    l.sharpe || 0,
          trades:    l.trades || 0,
        };
      })
      .sort((a, b) => b.portfolio - a.portfolio)
      .slice(0, 50)
      .map((l, i) => ({ rank: i + 1, ...l }));

    // If no real data yet, return mock data so the UI has something to show
    if (result.length === 0) {
      return res.json([
        { rank: 1, name: 'TradeMaster_Pro', portfolio: 189450.20, return: 26.30, sharpe: 2.45, trades: 142 },
        { rank: 2, name: 'AlphaSeeker',     portfolio: 178230.50, return: 18.82, sharpe: 2.12, trades:  98 },
        { rank: 3, name: 'MarketWhiz',      portfolio: 171890.00, return: 14.59, sharpe: 1.87, trades: 215 },
        { rank: 4, name: 'StockNinja',      portfolio: 165420.30, return: 10.28, sharpe: 1.65, trades:  76 },
        { rank: 5, name: 'BullRunner',      portfolio: 159780.40, return:  6.52, sharpe: 1.42, trades: 183 },
      ]);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
