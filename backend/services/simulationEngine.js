/**
 * Unified Simulation Engine — Merton Jump-Diffusion Model
 * ════════════════════════════════════════════════════════
 *
 * Price dynamics follow the Merton Jump-Diffusion SDE:
 *
 *   dS = μ·S·dt  +  σ·S·dW  +  S·(J − 1)·dN
 *         ╰drift╯   ╰diffusion╯  ╰Poisson jumps╯
 *
 * Storage model:
 *   • MongoDB stores ONLY 5-minute bars (one doc per ticker per bar).
 *   • Real-time 3-second price ticks are broadcast via WebSocket only (not stored).
 *   • On startup, each ticker is checked: if its oldest bar is not at least
 *     HISTORY_DAYS calendar days old, the full history is regenerated from scratch.
 *   • If history is sufficient, any gap since the last stored bar is filled.
 */
import { getDb } from './db.js';
import { STOCKS } from './stockData.js';

/* ── Constants ──────────────────────────────────── */
const BAR_SEC      = 300;           // 5-minute bars
const HISTORY_DAYS = 30;            // 30 days of stored bars (safe for Atlas 512MB free tier)
const YEAR_SEC     = 365 * 24 * 3600;
const DT_BAR       = 1 / (252 * 78); // fraction of trading year per 5-min bar
const DT_REALTIME  = 1 / 1000;       // larger dt → visible intraday movement

/* ── Random helpers ─────────────────────────────── */
function randn() {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

function poisson(lambda) {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

/* ── Sector jump parameters ─────────────────────── */
const SECTOR_JUMP_PARAMS = {
  Technology:  { lambda: 60,  muJ: -0.003, sigmaJ: 0.025 },
  Healthcare:  { lambda: 30,  muJ: -0.002, sigmaJ: 0.035 },
  Energy:      { lambda: 45,  muJ: -0.001, sigmaJ: 0.030 },
  Finance:     { lambda: 35,  muJ: -0.002, sigmaJ: 0.020 },
  Consumer:    { lambda: 20,  muJ:  0.000, sigmaJ: 0.018 },
  Industrial:  { lambda: 25,  muJ: -0.001, sigmaJ: 0.022 },
};

export class SimulationEngine {
  constructor() {
    this.stocks = STOCKS;
    this.prices = {};
    this.regime = 'normal';
    this.driftOverrides = {};
    this.volatilityMultipliers = {};
    this.intervalId = null;
    this.listeners = [];
    this.initialized = false;
    this._lastBarTime = 0; // last 5-min bar saved to MongoDB
  }

  /* ─── Startup ─────────────────────────────────── */

  /**
   * Initialize the engine.
   * @param {Function} onProgress - optional callback({ stock, current, total, phase })
   */
  async initialize(onProgress) {
    const db = getDb();
    const ticksCol  = db.collection('ticks');
    const stocksCol = db.collection('stocks');

    // Seed stock metadata once
    if (await stocksCol.countDocuments() === 0) {
      await stocksCol.insertMany(this.stocks.map(s => ({ ...s, _id: s.ticker })));
      console.log(`📊 Seeded ${this.stocks.length} stocks into MongoDB`);
    }

    const now = Math.floor(Date.now() / 1000);
    const historyStart = now - HISTORY_DAYS * 24 * 3600; // 1 full calendar year ago

    // Prune bars older than 1 year + 1 day (keep a slight buffer)
    const { deletedCount } = await ticksCol.deleteMany({ time: { $lt: historyStart - 86400 } });
    if (deletedCount > 0) console.log(`🗑️  Pruned ${deletedCount} bars older than 1 year`);

    // Ensure compound index for efficient per-ticker time queries
    await ticksCol.createIndex({ ticker: 1, time: 1 }, { background: true });

    for (let i = 0; i < this.stocks.length; i++) {
      const stock = this.stocks[i];

      if (onProgress) {
        onProgress({ stock: stock.ticker, current: i + 1, total: this.stocks.length, phase: 'check' });
      }

      // Check whether this ticker already has a full year of history
      const oldestTick  = await ticksCol.findOne({ ticker: stock.ticker }, { sort: { time:  1 } });
      const latestTick  = await ticksCol.findOne({ ticker: stock.ticker }, { sort: { time: -1 } });
      const hasFullYear = oldestTick && oldestTick.time <= historyStart + BAR_SEC;

      if (!hasFullYear) {
        // First boot OR history is insufficient — generate a full calendar year
        console.log(`⏳ Generating 1-year history for ${stock.ticker} (${i + 1}/${this.stocks.length})...`);

        if (onProgress) {
          onProgress({ stock: stock.ticker, current: i + 1, total: this.stocks.length, phase: 'generate' });
        }

        // Remove existing data so we don't mix 3-second ticks with 5-min bars
        await ticksCol.deleteMany({ ticker: stock.ticker });

        const ticks = this._generateHistory(stock, now, historyStart);
        await this._batchInsert(ticksCol, ticks);
        this.prices[stock.ticker] = ticks[ticks.length - 1].price;

      } else if (latestTick && (now - latestTick.time) > BAR_SEC) {
        // History is sufficient but server was offline — fill the gap
        const gapSec   = now - latestTick.time;
        const gapHours = (gapSec / 3600).toFixed(1);
        console.log(`⏳ Filling ${gapHours}h gap for ${stock.ticker}...`);

        if (onProgress) {
          onProgress({ stock: stock.ticker, current: i + 1, total: this.stocks.length, phase: 'gap-fill' });
        }

        const gapTicks = this._fillGap(stock, latestTick.price, latestTick.time, now);
        if (gapTicks.length > 0) {
          await this._batchInsert(ticksCol, gapTicks);
          this.prices[stock.ticker] = gapTicks[gapTicks.length - 1].price;
        } else {
          this.prices[stock.ticker] = latestTick.price;
        }

      } else {
        // Up-to-date — use the latest stored price
        this.prices[stock.ticker] = latestTick ? latestTick.price : stock.basePrice;
      }
    }

    // Align the last-bar-time to the current 5-min bucket
    this._lastBarTime = Math.floor(now / BAR_SEC) * BAR_SEC;
    this.initialized  = true;
    console.log(`📈 Simulation engine initialized with ${this.stocks.length} stocks`);
  }

  /* ─── Core: Merton Jump-Diffusion step ─────────── */

  _mertonStep(price, { drift, vol, lambda, muJ, sigmaJ, dt }) {
    const driftAdj     = drift + (this.driftOverrides[this.regime] || 0);
    const effectiveVol = vol * (this.volatilityMultipliers[this.regime] || 1);

    let logReturn = (driftAdj - 0.5 * effectiveVol ** 2) * dt
                  + effectiveVol * Math.sqrt(dt) * randn();

    const nJumps = poisson(lambda * dt);
    for (let j = 0; j < nJumps; j++) {
      logReturn += muJ + sigmaJ * randn();
    }

    return price * Math.exp(logReturn);
  }

  _jumpParams(stock) {
    return SECTOR_JUMP_PARAMS[stock.sector] || SECTOR_JUMP_PARAMS.Technology;
  }

  /* Keep price within ±50% of the stock's base price using a soft bounce. */
  _softClamp(price, stock) {
    const lo = stock.basePrice * 0.50;
    const hi = stock.basePrice * 1.50;
    if (price < lo) price = lo + (lo - price) * 0.5;
    if (price > hi) price = hi - (price - hi) * 0.5;
    return Math.max(0.50, price);
  }

  /* ─── 5-minute bar generator ─────────────────────── */

  _generateBars(stock, startPrice, startTime, endTime) {
    const ticks = [];
    const jp    = this._jumpParams(stock);
    let price   = startPrice;
    let trendDrift    = 0;
    let trendBarsLeft = 0;

    for (let t = startTime + BAR_SEC; t <= endTime; t += BAR_SEC) {
      // Inject multi-day trend phases for realistic chart patterns
      if (trendBarsLeft <= 0 && Math.random() < 0.008) {
        trendDrift    = (Math.random() < 0.5 ? 1 : -1) * (0.05 + Math.random() * 0.15);
        trendBarsLeft = Math.floor(78 * (2 + Math.random() * 8));
      }
      if (trendBarsLeft > 0) trendBarsLeft--;
      else trendDrift = 0;

      price = this._mertonStep(price, {
        drift: stock.drift + trendDrift,
        vol:   stock.volatility,
        lambda: jp.lambda, muJ: jp.muJ, sigmaJ: jp.sigmaJ,
        dt:    DT_BAR,
      });
      price = this._softClamp(price, stock);

      ticks.push({
        ticker: stock.ticker,
        time:   t,
        price:  Math.round(price * 100) / 100,
        volume: Math.floor(500 + Math.random() * 4000),
      });
    }
    return ticks;
  }

  /* ─── 1 calendar-year history (on first boot) ── */

  _generateHistory(stock, now, historyStart) {
    const startPrice = stock.basePrice * (0.90 + Math.random() * 0.20);
    const anchor = [{
      ticker: stock.ticker,
      time:   historyStart,
      price:  Math.round(startPrice * 100) / 100,
      volume: Math.floor(500 + Math.random() * 4000),
    }];
    return anchor.concat(this._generateBars(stock, startPrice, historyStart, now));
  }

  /* ─── Gap-fill: bridge offline periods ──────────── */

  _fillGap(stock, fromPrice, fromTime, toTime) {
    return this._generateBars(stock, fromPrice, fromTime, toTime);
  }

  /* ─── Batch insert helper ───────────────────────── */

  async _batchInsert(collection, docs, batchSize = 5000) {
    for (let i = 0; i < docs.length; i += batchSize) {
      await collection.insertMany(docs.slice(i, i + batchSize), { ordered: false });
    }
  }

  /* ─── Real-time tick (every 3 s) ───────────────── */
  /*
   * Price is updated in memory every 3 seconds and broadcast via WebSocket.
   * MongoDB only receives ONE bar per 5-minute bucket — NOT every 3-second tick.
   */
  async tick() {
    if (!this.initialized) return {};

    const now     = Math.floor(Date.now() / 1000);
    const updates = {};

    for (const stock of this.stocks) {
      const jp = this._jumpParams(stock);
      let newPrice = this._mertonStep(this.prices[stock.ticker], {
        drift:  stock.drift,
        vol:    stock.volatility,
        lambda: jp.lambda,
        muJ:    jp.muJ,
        sigmaJ: jp.sigmaJ,
        dt:     DT_REALTIME,
      });
      newPrice = this._softClamp(newPrice, stock);
      this.prices[stock.ticker] = Math.round(newPrice * 100) / 100;

      updates[stock.ticker] = {
        price: this.prices[stock.ticker],
        tick:  { time: now, price: this.prices[stock.ticker], volume: Math.floor(200 + Math.random() * 2500) },
      };
    }

    // Persist ONE 5-minute bar per bucket — not every 3-second tick
    const barTime = Math.floor(now / BAR_SEC) * BAR_SEC;
    if (barTime > this._lastBarTime) {
      this._lastBarTime = barTime;
      const db      = getDb();
      const barDocs = this.stocks.map((stock) => ({
        ticker: stock.ticker,
        time:   barTime,
        price:  this.prices[stock.ticker],
        volume: Math.floor(500 + Math.random() * 4000),
      }));
      try {
        await db.collection('ticks').insertMany(barDocs, { ordered: false });
      } catch (err) {
        if (err.code !== 11000) console.error('Bar insert error:', err.message);
      }
    }

    for (const listener of this.listeners) listener(updates);
    return updates;
  }

  /* ─── Control ────────────────────────────────────── */

  start(intervalMs = 3000) {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.tick(), intervalMs);
    console.log('📈 Real-time tick loop started (3s updates, 5-min MongoDB bars)');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  onTick(callback) { this.listeners.push(callback); }

  setRegime(regime, params = {}) {
    this.regime = regime;
    this.driftOverrides        = params.driftOverrides        || {};
    this.volatilityMultipliers = params.volatilityMultipliers || {};
  }

  applyShock(ticker, shockPercent) {
    if (this.prices[ticker]) {
      const capped = Math.max(-0.10, Math.min(0.10, shockPercent));
      this.prices[ticker] *= (1 + capped);
    }
  }

  getQuote(ticker) {
    const price = this.prices[ticker];
    if (!price) return null;
    const spread = price * 0.001;
    return { ticker, price, bid: price - spread / 2, ask: price + spread / 2, spread };
  }

  /* ─── Data access ─────────────────────────────── */

  /**
   * Fetch recent 5-min bars for all tickers (used for WebSocket init).
   * Only returns the last `days` calendar days to keep the payload manageable.
   */
  async getRecentHistory(days = 30) {
    const db     = getDb();
    const cutoff = Math.floor(Date.now() / 1000) - days * 24 * 3600;
    const result = {};

    for (const stock of this.stocks) {
      result[stock.ticker] = await db.collection('ticks')
        .find({ ticker: stock.ticker, time: { $gte: cutoff } })
        .sort({ time: 1 })
        .toArray();
    }
    return result;
  }

  /**
   * Fetch all stored bars for a single ticker (used by REST API for historical charts).
   */
  async getTickHistory(ticker, limit = 120000) {
    const db = getDb();
    return db.collection('ticks')
      .find({ ticker })
      .sort({ time: 1 })
      .limit(limit)
      .toArray();
  }

  /** @deprecated — kept for any legacy callers */
  async getAllTickHistory(days = 30) {
    return this.getRecentHistory(days);
  }
}
