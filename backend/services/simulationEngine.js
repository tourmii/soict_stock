/**
 * Unified Simulation Engine
 * ══════════════════════════
 *
 * Price dynamics combine three layers:
 *
 *  1. Merton Jump-Diffusion (bar-level history)
 *       dS = μS dt + σS dW + S(J−1) dN
 *
 *  2. Momentum follow-through
 *       After a large move, price continues in that direction for a while
 *       before the signal decays (trend-following / autocorrelation).
 *
 *  3. Soft Ornstein-Uhlenbeck mean reversion
 *       A gentle pull back toward each stock's base price prevents
 *       multi-month drift into absurd territory without hard bounces.
 *
 *  4. GARCH-like volatility clustering (real-time only)
 *       After a shock, effective vol is elevated and decays back to normal.
 *
 * Storage model:
 *   • MongoDB stores ONLY 5-minute bars (one doc per ticker per bar).
 *   • Real-time 3-second price ticks are broadcast via WebSocket only (not stored).
 */
import { getDb } from './db.js';
import { STOCKS } from './stockData.js';

/* ── Constants ──────────────────────────────────────────────── */
const BAR_SEC      = 300;            // 5-minute bars
const HISTORY_DAYS = 365;            // 1 calendar year of stored bars
const YEAR_SEC     = 365 * 24 * 3600; // eslint-disable-line no-unused-vars
const DT_BAR       = 1 / (252 * 78); // fraction of trading year per 5-min bar
// Calibrated so each stock's 24h σ ≈ vol × √(28800/90000):
//   low-vol  (0.017) → ~1.0% / day
//   mid-vol  (0.025) → ~1.4% / day
//   high-vol (0.035) → ~2.0% / day
const DT_REALTIME  = 1 / 90000;

// Momentum / vol-clustering tuning for real-time ticks
const MOMENTUM_DECAY    = 0.9985;  // per tick; half-life ≈ 462 ticks ≈ 23 min
const VOL_CLUSTER_DECAY = 0.9980;  // per tick; half-life ≈ 346 ticks ≈ 17 min
const MOMENTUM_FEEDBACK = 0.15;    // fraction of annualised return fed back into momentum
const MEAN_REV_SPEED_RT  = 1.0;   // annual kappa for real-time OU term
const MEAN_REV_SPEED_BAR = 2.0;   // annual kappa for bar-level OU term

/* ── Random helpers ─────────────────────────────────────────── */
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

/* ── Sector jump parameters ─────────────────────────────────── */
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
    this.stocks   = STOCKS;
    this.prices   = {};
    this.regime   = 'normal';
    this.driftOverrides        = {};
    this.volatilityMultipliers = {};
    this.intervalId  = null;
    this.listeners   = [];
    this.initialized = false;
    this._lastBarTime = 0;

    // Per-stock real-time state
    this.momentum   = {}; // extra annual drift from recent price direction
    this.volCluster = {}; // vol multiplier (1 = normal, > 1 after shock)
    this.tickerOverrides = {}; // per-ticker { driftBoost, volMult } for contest scenarios
  }

  /* ─── Startup ─────────────────────────────────────────────── */

  async initialize(onProgress) {
    const db = getDb();
    const ticksCol  = db.collection('ticks');
    const stocksCol = db.collection('stocks');

    if (await stocksCol.countDocuments() === 0) {
      await stocksCol.insertMany(this.stocks.map(s => ({ ...s, _id: s.ticker })));
      console.log(`📊 Seeded ${this.stocks.length} stocks into MongoDB`);
    }

    const now          = Math.floor(Date.now() / 1000);
    const historyStart = now - HISTORY_DAYS * 24 * 3600;

    const { deletedCount } = await ticksCol.deleteMany({ time: { $lt: historyStart - 86400 } });
    if (deletedCount > 0) console.log(`🗑️  Pruned ${deletedCount} bars older than 1 year`);

    await ticksCol.createIndex({ ticker: 1, time: 1 }, { background: true });

    for (let i = 0; i < this.stocks.length; i++) {
      const stock = this.stocks[i];
      if (onProgress) onProgress({ stock: stock.ticker, current: i + 1, total: this.stocks.length, phase: 'check' });

      const oldestTick  = await ticksCol.findOne({ ticker: stock.ticker }, { sort: { time:  1 } });
      const latestTick  = await ticksCol.findOne({ ticker: stock.ticker }, { sort: { time: -1 } });
      const hasFullYear = oldestTick && oldestTick.time <= historyStart + BAR_SEC;

      if (!hasFullYear) {
        console.log(`⏳ Generating 1-year history for ${stock.ticker} (${i + 1}/${this.stocks.length})...`);
        if (onProgress) onProgress({ stock: stock.ticker, current: i + 1, total: this.stocks.length, phase: 'generate' });
        await ticksCol.deleteMany({ ticker: stock.ticker });
        const ticks = this._generateHistory(stock, now, historyStart);
        await this._batchInsert(ticksCol, ticks);
        this.prices[stock.ticker] = ticks[ticks.length - 1].price;

      } else if (latestTick && (now - latestTick.time) > BAR_SEC) {
        const gapHours = ((now - latestTick.time) / 3600).toFixed(1);
        console.log(`⏳ Filling ${gapHours}h gap for ${stock.ticker}...`);
        if (onProgress) onProgress({ stock: stock.ticker, current: i + 1, total: this.stocks.length, phase: 'gap-fill' });
        const gapTicks = this._fillGap(stock, latestTick.price, latestTick.time, now);
        if (gapTicks.length > 0) {
          await this._batchInsert(ticksCol, gapTicks);
          this.prices[stock.ticker] = gapTicks[gapTicks.length - 1].price;
        } else {
          this.prices[stock.ticker] = latestTick.price;
        }

      } else {
        this.prices[stock.ticker] = latestTick ? latestTick.price : stock.basePrice;
      }

      // Initialise real-time momentum state for every stock (including newly added ones)
      this.momentum[stock.ticker]   = 0;
      this.volCluster[stock.ticker] = 1;
    }

    this._lastBarTime = Math.floor(now / BAR_SEC) * BAR_SEC;
    this.initialized  = true;
    console.log(`📈 Simulation engine initialised with ${this.stocks.length} stocks`);
  }

  /* ─── Core: Merton Jump-Diffusion step ───────────────────── */

  _mertonStep(price, { drift, vol, lambda, muJ, sigmaJ, dt }) {
    const driftAdj     = drift + (this.driftOverrides[this.regime] || 0);
    const effectiveVol = vol   * (this.volatilityMultipliers[this.regime] || 1);

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

  /* Soft bounce at ±50% of base price — last-resort safety net. */
  _softClamp(price, stock) {
    const lo = stock.basePrice * 0.50;
    const hi = stock.basePrice * 1.50;
    if (price < lo) price = lo + (lo - price) * 0.5;
    if (price > hi) price = hi - (price - hi) * 0.5;
    return Math.max(0.50, price);
  }

  /* ─── 5-minute bar generator ─────────────────────────────── */
  /*
   * Three-component drift for each bar:
   *
   *   total_drift = stock.drift          ← long-run base drift
   *               + activeDrift          ← current trend phase OR jump follow-through
   *               + meanRevDrift         ← OU pull toward base price
   *
   * When a jump event produces a log-return > 2.5σ_bar, we override
   * `activeDrift` to point in the jump direction for 1–4 days, giving
   * natural momentum follow-through instead of an isolated spike.
   */
  _generateBars(stock, startPrice, startTime, endTime) {
    const ticks    = [];
    const jp       = this._jumpParams(stock);
    let price      = startPrice;
    let activeDrift    = 0;   // current extra drift (annual)
    let activeBarsLeft = 0;   // bars remaining in the active drift phase
    const barSigma = stock.volatility * Math.sqrt(DT_BAR); // 1σ per bar

    for (let t = startTime + BAR_SEC; t <= endTime; t += BAR_SEC) {
      // Random multi-day trend phase (market character cycles)
      if (activeBarsLeft <= 0 && Math.random() < 0.008) {
        activeDrift    = (Math.random() < 0.5 ? 1 : -1) * (0.05 + Math.random() * 0.15);
        activeBarsLeft = Math.floor(78 * (2 + Math.random() * 8)); // 2–10 days
      }
      if (activeBarsLeft > 0) activeBarsLeft--;
      else activeDrift = 0;

      // Soft OU mean reversion: stronger the further price is from base
      const deviation   = Math.log(price / stock.basePrice);
      const meanRevDrift = -MEAN_REV_SPEED_BAR * deviation;

      const prevPrice = price;
      price = this._mertonStep(price, {
        drift:  stock.drift + activeDrift + meanRevDrift,
        vol:    stock.volatility,
        lambda: jp.lambda, muJ: jp.muJ, sigmaJ: jp.sigmaJ,
        dt:     DT_BAR,
      });

      // Detect Merton jump (|return| > 2.5σ) and inject directional follow-through.
      // This replaces any current trend phase so the market "reacts" to the event.
      const logReturn = Math.log(price / prevPrice);
      if (Math.abs(logReturn) > 2.5 * barSigma) {
        const dir      = logReturn > 0 ? 1 : -1;
        activeDrift    = dir * (0.10 + Math.random() * 0.15); // 10–25% annual follow-through
        activeBarsLeft = Math.floor(78 * (1 + Math.random() * 3)); // 1–4 trading days
      }

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

  /* ─── 1 calendar-year history (on first boot) ─────────────── */

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

  /* ─── Gap-fill: bridge offline periods ─────────────────────── */

  _fillGap(stock, fromPrice, fromTime, toTime) {
    return this._generateBars(stock, fromPrice, fromTime, toTime);
  }

  /* ─── Batch insert helper ──────────────────────────────────── */

  async _batchInsert(collection, docs, batchSize = 5000) {
    for (let i = 0; i < docs.length; i += batchSize) {
      await collection.insertMany(docs.slice(i, i + batchSize), { ordered: false });
    }
  }

  /* ─── Real-time tick (every 3 s) ──────────────────────────── */
  /*
   * Per-tick price dynamics:
   *
   *   effective_drift = stock.drift
   *                   + regime override      ← scenario (bull / bear / sideways)
   *                   + momentum[ticker]     ← decaying directional memory
   *                   + meanRevDrift         ← soft OU pull toward base
   *
   *   effective_vol   = stock.volatility
   *                   × regime vol multiplier
   *                   × volCluster[ticker]   ← GARCH-like elevation after shocks
   *
   * Both momentum and volCluster decay each tick toward their resting values.
   * applyShock() injects into both when news arrives.
   *
   * MongoDB receives ONE bar per 5-minute bucket — not every 3-second tick.
   */
  async tick() {
    if (!this.initialized) return {};

    const now     = Math.floor(Date.now() / 1000);
    const updates = {};

    for (const stock of this.stocks) {
      const ticker    = stock.ticker;
      const prevPrice = this.prices[ticker];

      // Layer 1: regime scenario
      const regimeDrift  = this.driftOverrides[this.regime]        || 0;
      const regimeVolMul = this.volatilityMultipliers[this.regime]  || 1;

      // Layer 2: soft OU mean reversion
      const deviation    = Math.log(prevPrice / stock.basePrice);
      const meanRevDrift = -MEAN_REV_SPEED_RT * deviation;

      // Composite drift and vol (including per-ticker scenario overrides)
      const tickerOvr      = this.tickerOverrides[ticker] || {};
      const effectiveDrift = stock.drift + regimeDrift + (tickerOvr.driftBoost || 0) + (this.momentum[ticker] || 0) + meanRevDrift;
      const effectiveVol   = stock.volatility * regimeVolMul * (tickerOvr.volMult || 1) * (this.volCluster[ticker] || 1);

      // GBM step — no Poisson jumps in real-time; discrete events go through applyShock()
      const logStep = (effectiveDrift - 0.5 * effectiveVol ** 2) * DT_REALTIME
                    + effectiveVol * Math.sqrt(DT_REALTIME) * randn();
      let newPrice = prevPrice * Math.exp(logStep);
      newPrice = this._softClamp(newPrice, stock);
      newPrice = Math.round(newPrice * 100) / 100;

      // Update momentum: EMA of annualised returns (gives natural trend-following)
      const annualReturn = Math.log(newPrice / prevPrice) / DT_REALTIME;
      this.momentum[ticker] =
        (this.momentum[ticker] || 0) * MOMENTUM_DECAY
        + annualReturn * MOMENTUM_FEEDBACK * (1 - MOMENTUM_DECAY);

      // Decay vol clustering back toward 1
      if ((this.volCluster[ticker] || 1) > 1) {
        this.volCluster[ticker] = 1 + (this.volCluster[ticker] - 1) * VOL_CLUSTER_DECAY;
        if (this.volCluster[ticker] < 1.001) this.volCluster[ticker] = 1;
      }

      this.prices[ticker] = newPrice;
      updates[ticker] = {
        price: newPrice,
        tick:  { time: now, price: newPrice, volume: Math.floor(200 + Math.random() * 2500) },
      };
    }

    // Persist ONE 5-minute bar per bucket
    const barTime = Math.floor(now / BAR_SEC) * BAR_SEC;
    if (barTime > this._lastBarTime) {
      this._lastBarTime = barTime;
      const db      = getDb();
      const barDocs = this.stocks.map((s) => ({
        ticker: s.ticker,
        time:   barTime,
        price:  this.prices[s.ticker],
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

  /* ─── Control ──────────────────────────────────────────────── */

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

  applyTickerScenario(tickers, params) {
    for (const ticker of tickers) {
      this.tickerOverrides[ticker] = { driftBoost: params.driftBoost || 0, volMult: params.volMult || 1 };
      this.momentum[ticker]   = this.momentum[ticker]   || 0;
      this.volCluster[ticker] = this.volCluster[ticker] || 1;
    }
  }

  removeTickerScenario(tickers) {
    for (const ticker of tickers) delete this.tickerOverrides[ticker];
  }

  applyShock(ticker, shockPercent) {
    if (!this.prices[ticker]) return;
    const capped = Math.max(-0.10, Math.min(0.10, shockPercent));
    this.prices[ticker] *= (1 + capped);
    // Inject momentum in the shock direction so price continues moving after the event
    this.momentum[ticker]   = (this.momentum[ticker] || 0) + capped * 8;
    // Elevate vol clustering — more uncertainty immediately after a shock
    this.volCluster[ticker] = Math.min(2.0, (this.volCluster[ticker] || 1) + Math.abs(capped) * 5);
  }

  getQuote(ticker) {
    const price = this.prices[ticker];
    if (!price) return null;
    const spread = price * 0.001;
    return { ticker, price, bid: price - spread / 2, ask: price + spread / 2, spread };
  }

  /* ─── Data access ──────────────────────────────────────────── */

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
