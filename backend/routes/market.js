import { Router } from 'express';
const router = Router();

/* ── Interval seconds for server-side aggregation ──────────────── */
const INTERVAL_SECONDS = {
  '15m': 900,
  '1H':  3600,
  '4H':  14400,
  '1D':  86400,
  '1W':  604800,
  '1M':  2592000,
};

/* ── Aggregate raw 5-min bars into OHLCV candles ──────────────── */
function aggregateOHLCV(ticks, intervalSec) {
  if (!ticks || ticks.length === 0) return [];
  const candles = [];
  let bucket = null;
  let candle  = null;
  for (const tick of ticks) {
    const b = Math.floor(tick.time / intervalSec) * intervalSec;
    if (b !== bucket) {
      if (candle) candles.push(candle);
      bucket = b;
      candle = { time: b, open: tick.price, high: tick.price, low: tick.price, close: tick.price, volume: tick.volume };
    } else {
      candle.high   = Math.max(candle.high, tick.price);
      candle.low    = Math.min(candle.low,  tick.price);
      candle.close  = tick.price;
      candle.volume += tick.volume;
    }
  }
  if (candle) candles.push(candle);
  return candles;
}

/* ── Routes ─────────────────────────────────────────────────────── */

router.get('/stocks', (req, res) => {
  const engine = req.app.locals.engine;
  const stocks = engine.stocks.map((s) => ({
    ...s,
    price: engine.prices[s.ticker],
    quote: engine.getQuote(s.ticker),
  }));
  res.json(stocks);
});

/**
 * GET /api/market/history/:ticker?timeframe=All|1D|1W|1M|3M|1Y
 * Returns raw 5-minute bars (optionally filtered by time window).
 * Used for: full tick data, merging with WebSocket rawTicks on the client.
 */
router.get('/history/:ticker', async (req, res) => {
  const engine = req.app.locals.engine;
  const { ticker } = req.params;
  const { timeframe = 'All' } = req.query;

  try {
    const ticks = await engine.getTickHistory(ticker);
    if (!ticks || ticks.length === 0) {
      return res.status(404).json({ message: 'Ticker not found' });
    }

    const now    = Math.floor(Date.now() / 1000);
    const ranges = { '1D': 86400, '1W': 604800, '1M': 2592000, '3M': 7776000, '1Y': 31536000, 'All': Infinity };
    const cutoff = now - (ranges[timeframe] ?? Infinity);
    const filtered = cutoff === -Infinity ? ticks : ticks.filter((b) => b.time >= cutoff);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/market/ohlcv/:ticker?timeframe=4H|1D|1W|1M&limit=365
 * Returns server-aggregated OHLCV candles for longer timeframes.
 * Much smaller payload than raw 5-min bars — used by the chart for 4H/1D/1W/1M.
 */
router.get('/ohlcv/:ticker', async (req, res) => {
  const engine = req.app.locals.engine;
  const { ticker } = req.params;
  const { timeframe = '1D', limit = '500' } = req.query;

  try {
    const allTicks   = await engine.getTickHistory(ticker);
    if (!allTicks || allTicks.length === 0) {
      return res.status(404).json({ message: 'Ticker not found' });
    }

    const intervalSec = INTERVAL_SECONDS[timeframe] || 86400;
    const candles     = aggregateOHLCV(allTicks, intervalSec);
    const maxCandles  = Math.min(parseInt(limit, 10) || 365, 1000);
    res.json(candles.slice(-maxCandles));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/quote/:ticker', (req, res) => {
  const engine = req.app.locals.engine;
  const quote  = engine.getQuote(req.params.ticker);
  if (!quote) return res.status(404).json({ message: 'Ticker not found' });
  res.json(quote);
});

export default router;
