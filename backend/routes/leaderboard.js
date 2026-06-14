import { Router } from 'express';
import { getDb } from '../services/db.js';

const router = Router();

router.get('/', async (req, res) => {
  const db     = getDb();
  const period = req.query.period || 'all-time';

  try {
    // Period filter: only include users who traded within the window
    const filter = {};
    if (period === 'weekly') {
      filter.updatedAt = { $gte: new Date(Date.now() - 7 * 86400000).toISOString() };
    } else if (period === 'monthly') {
      filter.updatedAt = { $gte: new Date(Date.now() - 30 * 86400000).toISOString() };
    }

    const leaders = await db.collection('leaderboard')
      .find(filter)
      .sort({ portfolioValue: -1 })
      .limit(50)
      .toArray();

    // Join with users collection for display names
    const userIds = leaders.map((l) => l.userId).filter(Boolean);
    const users   = userIds.length
      ? await db.collection('users').find({ _id: { $in: userIds } }).toArray()
      : [];
    const nameMap = Object.fromEntries(users.map((u) => [u._id, u.display_name]));

    const result = leaders.map((l, i) => ({
      rank:      i + 1,
      userId:    l.userId,
      name:      nameMap[l.userId] || l.displayName || 'Anonymous',
      portfolio: l.portfolioValue  || 0,
      return:    l.totalReturn     || 0,
      sharpe:    l.sharpe          || 0,
      trades:    l.trades          || 0,
    }));

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
