import { Router } from 'express';
import { getDb } from '../services/db.js';
import { ObjectId } from 'mongodb';
import { updateLeaderboard } from '../services/valuation.js';

const router = Router();
const ALLOWED_LEVERAGE   = [2, 5, 10];
const LIQ_THRESHOLD      = 0.80; // liquidate when 80% of margin is lost

function liquidationPrice(side, entryPrice, leverage) {
  return side === 'Long'
    ? entryPrice * (1 - LIQ_THRESHOLD / leverage)
    : entryPrice * (1 + LIQ_THRESHOLD / leverage);
}

function calcPnL(side, entryPrice, currentPrice, quantity) {
  return (currentPrice - entryPrice) * quantity * (side === 'Long' ? 1 : -1);
}

/* POST /api/leverage/open */
router.post('/open', async (req, res) => {
  const engine = req.app.locals.engine;
  const { userId, ticker, side, leverage, quantity, contestId = null } = req.body;

  if (!userId || !ticker || !side || !leverage || !quantity)
    return res.status(400).json({ message: 'Missing required fields' });
  if (!['Long', 'Short'].includes(side))
    return res.status(400).json({ message: 'side must be Long or Short' });
  if (!ALLOWED_LEVERAGE.includes(Number(leverage)))
    return res.status(400).json({ message: `leverage must be one of: ${ALLOWED_LEVERAGE.join(', ')}` });

  const lev  = Number(leverage);
  const qty  = Number(quantity);
  const price = engine.prices[ticker];
  if (!price) return res.status(404).json({ message: 'Unknown ticker' });

  const notional = qty * price;
  const margin   = notional / lev;
  const liqPrice = liquidationPrice(side, price, lev);

  const db = getDb();

  // Check cash in the right portfolio
  if (contestId) {
    const pf = await db.collection('contest_portfolios').findOne({ contestId, userId });
    if (!pf)          return res.status(404).json({ message: 'Contest portfolio not found' });
    if (pf.cash < margin) return res.status(400).json({ message: `Need ${margin.toFixed(2)}, have ${pf.cash.toFixed(2)}` });
    await db.collection('contest_portfolios').updateOne({ contestId, userId }, { $inc: { cash: -margin } });
  } else {
    const pf = await db.collection('portfolios').findOne({ userId });
    if (!pf)          return res.status(404).json({ message: 'Portfolio not found' });
    if (pf.cash < margin) return res.status(400).json({ message: `Need ${margin.toFixed(2)}, have ${pf.cash.toFixed(2)}` });
    await db.collection('portfolios').updateOne({ userId }, { $inc: { cash: -margin } });
  }

  const position = {
    userId, ticker, side, leverage: lev, quantity: qty,
    entryPrice: price, notionalValue: notional, margin,
    liquidationPrice: liqPrice,
    contestId: contestId || null,
    status: 'Open',
    createdAt: new Date().toISOString(),
  };

  const result = await db.collection('leveraged_positions').insertOne(position);

  // Keep the global leaderboard in sync for non-contest positions
  if (!contestId) await updateLeaderboard(db, engine, userId);

  res.json({ success: true, position: { ...position, _id: result.insertedId } });
});

/* POST /api/leverage/close */
router.post('/close', async (req, res) => {
  const engine = req.app.locals.engine;
  const { userId, positionId } = req.body;
  if (!userId || !positionId) return res.status(400).json({ message: 'userId and positionId required' });

  const db = getDb();
  const position = await db.collection('leveraged_positions').findOne({
    _id: new ObjectId(positionId), userId, status: 'Open',
  });
  if (!position) return res.status(404).json({ message: 'Open position not found' });

  const price = engine.prices[position.ticker];
  if (!price) return res.status(400).json({ message: 'Cannot price position' });

  const pnl         = calcPnL(position.side, position.entryPrice, price, position.quantity);
  const returnedCash = Math.max(0, position.margin + pnl);

  await db.collection('leveraged_positions').updateOne(
    { _id: position._id },
    { $set: { status: 'Closed', closePrice: price, realizedPnL: pnl, closedAt: new Date().toISOString() } }
  );

  if (position.contestId) {
    await db.collection('contest_portfolios').updateOne(
      { contestId: position.contestId, userId }, { $inc: { cash: returnedCash } }
    );
  } else {
    await db.collection('portfolios').updateOne({ userId }, { $inc: { cash: returnedCash } });
    await updateLeaderboard(db, engine, userId);
  }

  res.json({ success: true, pnl, returnedCash, closePrice: price });
});

/* GET /api/leverage?userId=...&contestId=... */
router.get('/', async (req, res) => {
  const engine = req.app.locals.engine;
  const { userId, contestId } = req.query;
  if (!userId) return res.status(400).json({ message: 'userId required' });

  const db = getDb();
  const query = { userId, status: 'Open', contestId: contestId || null };
  const positions = await db.collection('leveraged_positions').find(query).toArray();

  const enriched = positions.map(p => {
    const cur = engine.prices[p.ticker] || p.entryPrice;
    const pnl = calcPnL(p.side, p.entryPrice, cur, p.quantity);
    return { ...p, currentPrice: cur, unrealizedPnL: pnl, marginRemaining: p.margin + pnl };
  });

  res.json(enriched);
});

/* Exported helper — called every 30 s from server.js */
export async function checkLiquidations(db, engine) {
  const positions = await db.collection('leveraged_positions').find({ status: 'Open' }).toArray();
  for (const pos of positions) {
    const price = engine.prices[pos.ticker];
    if (!price) continue;
    const pnl = calcPnL(pos.side, pos.entryPrice, price, pos.quantity);
    if (pnl > -(pos.margin * LIQ_THRESHOLD)) continue;

    await db.collection('leveraged_positions').updateOne(
      { _id: pos._id },
      { $set: { status: 'Liquidated', closePrice: price, realizedPnL: pnl, closedAt: new Date().toISOString() } }
    );
    const remaining = Math.max(0, pos.margin + pnl);
    if (remaining > 0) {
      if (pos.contestId) {
        await db.collection('contest_portfolios').updateOne(
          { contestId: pos.contestId, userId: pos.userId }, { $inc: { cash: remaining } }
        );
      } else {
        await db.collection('portfolios').updateOne({ userId: pos.userId }, { $inc: { cash: remaining } });
      }
    }
    console.log(`⚡ Liquidated ${pos.side} ${pos.ticker} (${pos.userId}) PnL=${pnl.toFixed(2)}`);
  }
}

export default router;
