import { Router } from 'express';
const router = Router();

const leaderboard = [
  { rank: 1, name: 'TradeMaster_Pro', portfolio: 189450.20, return: 26.30, sharpe: 2.45, trades: 142 },
  { rank: 2, name: 'AlphaSeeker', portfolio: 178230.50, return: 18.82, sharpe: 2.12, trades: 98 },
  { rank: 3, name: 'MarketWhiz', portfolio: 171890.00, return: 14.59, sharpe: 1.87, trades: 215 },
  { rank: 4, name: 'StockNinja', portfolio: 165420.30, return: 10.28, sharpe: 1.65, trades: 76 },
  { rank: 5, name: 'BullRunner', portfolio: 159780.40, return: 6.52, sharpe: 1.42, trades: 183 },
];

router.get('/', (req, res) => {
  res.json(leaderboard);
});

export default router;
