import { Router } from 'express';
import { getDb } from '../services/db.js';

const router = Router();

router.get('/', async (req, res) => {
  const db = getDb();
  try {
    const leaders = await db.collection('leaderboard')
      .find()
      .sort({ portfolioValue: -1 })
      .limit(20)
      .toArray();

    const result = leaders.map((l, i) => ({
      rank: i + 1,
      name: l.displayName || l.userId || 'Anonymous',
      userId: l.userId,
      portfolio: l.portfolioValue || 0,
      return: l.totalReturn || 0,
      sharpe: l.sharpe || 0,
      trades: l.trades || 0,
    }));

    // If no leaderboard entries yet, return mock data
    if (result.length === 0) {
      return res.json([
        { rank: 1, name: 'TradeMaster_Pro', portfolio: 189450.20, return: 26.30, sharpe: 2.45, trades: 142 },
        { rank: 2, name: 'AlphaSeeker', portfolio: 178230.50, return: 18.82, sharpe: 2.12, trades: 98 },
        { rank: 3, name: 'MarketWhiz', portfolio: 171890.00, return: 14.59, sharpe: 1.87, trades: 215 },
        { rank: 4, name: 'StockNinja', portfolio: 165420.30, return: 10.28, sharpe: 1.65, trades: 76 },
        { rank: 5, name: 'BullRunner', portfolio: 159780.40, return: 6.52, sharpe: 1.42, trades: 183 },
      ]);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
