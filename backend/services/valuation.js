/**
 * Shared portfolio valuation helpers.
 *
 * A user's true equity = cash + market-holdings value + open-futures equity.
 * Futures margin is deducted from cash when a position opens, so each open
 * position is worth `max(0, margin + unrealizedPnL)` (its liquidation value).
 * Adding that back to cash avoids double-counting the locked margin.
 */
const DEFAULT_INITIAL_CASH = 150000;

/** Liquidation value of a single leveraged position at current prices. */
export function positionEquity(p, prices) {
  const cur = prices[p.ticker] ?? p.entryPrice;
  const pnl = (cur - p.entryPrice) * p.quantity * (p.side === 'Long' ? 1 : -1);
  return Math.max(0, p.margin + pnl);
}

/** Summed equity of a list of open positions. */
export function futuresEquity(positions, prices) {
  let total = 0;
  for (const p of positions) {
    if (p.status && p.status !== 'Open') continue;
    total += positionEquity(p, prices);
  }
  return total;
}

/**
 * Live total value of a user's non-contest portfolio:
 *   cash + market holdings + open futures equity.
 * Returns null if the user has no portfolio.
 */
export async function computeUserValue(db, engine, userId) {
  const pf = await db.collection('portfolios').findOne({ userId });
  if (!pf) return null;

  let value = pf.cash;
  for (const [ticker, h] of Object.entries(pf.holdings || {})) {
    if (h.shares > 0) value += h.shares * (engine.prices[ticker] || 0);
  }

  const positions = await db.collection('leveraged_positions')
    .find({ userId, status: 'Open', contestId: null })
    .toArray();
  value += futuresEquity(positions, engine.prices);

  return { value, cash: pf.cash, initialCash: pf.initialCash || DEFAULT_INITIAL_CASH };
}

/**
 * Recompute a user's live equity and upsert their leaderboard row.
 * Called after any action that changes equity (stock trade, futures open/close)
 * so futures-active users surface on the leaderboard with accurate-ish values.
 */
export async function updateLeaderboard(db, engine, userId) {
  const uv = await computeUserValue(db, engine, userId);
  if (!uv) return;

  const totalReturn = ((uv.value - uv.initialCash) / uv.initialCash) * 100;
  const trades = await db.collection('transactions').countDocuments({ userId });
  const user = await db.collection('users').findOne({ _id: userId }, { projection: { display_name: 1 } });

  await db.collection('leaderboard').updateOne(
    { userId },
    {
      $set: {
        userId,
        displayName: user?.display_name || userId,
        portfolioValue: uv.value,
        totalReturn,
        trades,
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true },
  );
}
