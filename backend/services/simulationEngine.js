/**
 * Unified Simulation Engine — persists to MongoDB
 * 
 * Price model: Geometric Brownian Motion with mean reversion.
 * Prices drift slowly around a fair value, with volatility scaled to
 * realistic intraday magnitudes (~0.1-0.3% per tick).
 * 
 * On startup:
 *   - Loads existing tick data from DB (or generates 90 days of history)
 *   - Stores latest prices in memory for fast access
 * 
 * On each tick (every 3s):
 *   - Generates new price for all tickers via GBM (tiny dt)
 *   - Appends tick to MongoDB `ticks` collection
 *   - Broadcasts via WebSocket to all connected clients
 */
import { getDb } from './db.js';
import { STOCKS } from './stockData.js';

function boxMuller() {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Clamp a value so it never deviates more than maxPct from a reference.
 * This is a safety net to prevent runaway prices.
 */
function clamp(price, base, maxPct = 0.60) {
  const lo = base * (1 - maxPct);
  const hi = base * (1 + maxPct);
  return Math.max(lo, Math.min(hi, price));
}

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
  }

  /**
   * Initialize from MongoDB — load or generate tick history
   */
  async initialize() {
    const db = getDb();
    const ticksCol = db.collection('ticks');

    // Seed stocks collection
    const stocksCol = db.collection('stocks');
    const existingStockCount = await stocksCol.countDocuments();
    if (existingStockCount === 0) {
      await stocksCol.insertMany(this.stocks.map(s => ({ ...s, _id: s.ticker })));
      console.log(`📊 Seeded ${this.stocks.length} stocks into MongoDB`);
    }

    // For each stock, check if we have tick data
    for (const stock of this.stocks) {
      const latestTick = await ticksCol.findOne(
        { ticker: stock.ticker },
        { sort: { time: -1 } }
      );

      if (!latestTick) {
        // No data — generate 90 days of 5-min ticks
        console.log(`⏳ Generating history for ${stock.ticker}...`);
        const ticks = this._generateHistoricalTicks(stock, 90);
        if (ticks.length > 0) {
          await ticksCol.insertMany(ticks);
        }
        this.prices[stock.ticker] = ticks[ticks.length - 1].price;
      } else {
        // Data exists — use latest price
        this.prices[stock.ticker] = latestTick.price;
      }
    }

    this.initialized = true;
    console.log(`📈 Simulation engine initialized with ${this.stocks.length} stocks`);
  }

  /**
   * Generate 5-minute tick data for N days of history.
   * Uses per-bar dt = 1 / (252 * 78) ≈ intraday-scale step.
   *
   * Each bar is a gentle GBM step — over 90 days this produces
   * a realistic-looking price series.
   */
  _generateHistoricalTicks(stock, days) {
    const ticks = [];
    // Start near base price, small random offset
    let price = stock.basePrice * (0.92 + Math.random() * 0.16);
    const now = Math.floor(Date.now() / 1000);
    const intervalSec = 300;         // 5-minute bars
    const barsPerDay = 78;           // ~6.5h trading day
    const totalBars = days * barsPerDay;
    const startTime = now - totalBars * intervalSec;
    const dt = 1 / (252 * barsPerDay); // fraction of a trading year

    for (let i = 0; i <= totalBars; i++) {
      if (i > 0) {
        price = this._nextPrice(price, stock.drift, stock.volatility, dt, stock.basePrice);
      }
      ticks.push({
        ticker: stock.ticker,
        time: startTime + i * intervalSec,
        price: Math.round(price * 100) / 100,
        volume: Math.floor(500 + Math.random() * 3000),
      });
    }
    return ticks;
  }

  /**
   * GBM with soft mean reversion.
   * 
   * @param price     current price
   * @param drift     annualised drift  (small, e.g. 0.0003)
   * @param vol       annualised vol    (e.g. 0.018)
   * @param dt        time step as fraction of a year
   * @param fairValue optional anchor price for mean reversion
   */
  _nextPrice(price, drift, vol, dt = 1 / (252 * 78), fairValue = null) {
    // Regime adjustments
    const driftOverride = this.driftOverrides[this.regime] || 0;
    const volMult = this.volatilityMultipliers[this.regime] || 1;

    let effectiveDrift = drift + driftOverride;
    const effectiveVol = vol * volMult;

    // Soft mean reversion: if price drifts far from fairValue,
    // pull drift toward fair value (spring constant κ ≈ 0.02 / day).
    if (fairValue && fairValue > 0) {
      const logDev = Math.log(price / fairValue);
      const kappa = 0.02;                           // reversion speed per day
      effectiveDrift -= kappa * logDev * 252 * dt;   // convert to per-step
    }

    const z = boxMuller();
    let next = price * Math.exp(
      (effectiveDrift - 0.5 * effectiveVol ** 2) * dt +
      effectiveVol * Math.sqrt(dt) * z
    );

    // Hard clamp: never more than ±60% from base
    if (fairValue) next = clamp(next, fairValue, 0.60);

    return Math.max(0.01, next);
  }

  /**
   * Generate one tick for all stocks, persist to DB, notify listeners.
   *
   * Real-time dt is very small: one 3-second tick ≈ 1/(252*6.5*60/3)
   * ≈ 6.1e-6 of a trading year.  This makes each tick's price change
   * extremely small — typically < 0.05%.
   */
  async tick() {
    if (!this.initialized) return {};

    const db = getDb();
    const ticksCol = db.collection('ticks');
    const updates = {};
    const now = Math.floor(Date.now() / 1000);
    const tickDocs = [];

    // dt for a 3-second real-time tick
    // ≈ 3 / (252 * 6.5 * 3600)  ≈  5.1e-7  (fraction of trading year)
    const realtimeDt = 3 / (252 * 6.5 * 3600);

    for (const stock of this.stocks) {
      const newPrice = this._nextPrice(
        this.prices[stock.ticker],
        stock.drift,
        stock.volatility,
        realtimeDt,
        stock.basePrice,
      );
      this.prices[stock.ticker] = Math.round(newPrice * 100) / 100;

      const tickDoc = {
        ticker: stock.ticker,
        time: now,
        price: this.prices[stock.ticker],
        volume: Math.floor(200 + Math.random() * 2000),
      };
      tickDocs.push(tickDoc);

      updates[stock.ticker] = {
        price: this.prices[stock.ticker],
        tick: { time: now, price: this.prices[stock.ticker], volume: tickDoc.volume },
      };
    }

    // Bulk insert all ticks
    try {
      await ticksCol.insertMany(tickDocs, { ordered: false });
    } catch (err) {
      console.error('Tick insert error:', err.message);
    }

    for (const listener of this.listeners) {
      listener(updates);
    }
    return updates;
  }

  start(intervalMs = 3000) {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.tick(), intervalMs);
    console.log('📈 Simulation engine started (real-time tick generation)');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  onTick(callback) {
    this.listeners.push(callback);
  }

  setRegime(regime, params = {}) {
    this.regime = regime;
    this.driftOverrides = params.driftOverrides || {};
    this.volatilityMultipliers = params.volatilityMultipliers || {};
  }

  applyShock(ticker, shockPercent) {
    if (this.prices[ticker]) {
      // Cap shocks to ±8% to prevent insane swings
      const cappedShock = Math.max(-0.08, Math.min(0.08, shockPercent));
      this.prices[ticker] *= (1 + cappedShock);
    }
  }

  getQuote(ticker) {
    const price = this.prices[ticker];
    if (!price) return null;
    const spread = price * 0.001;
    return { ticker, price, bid: price - spread / 2, ask: price + spread / 2, spread };
  }

  /**
   * Get recent tick history for a ticker from MongoDB
   */
  async getTickHistory(ticker, limit = 26000) {
    const db = getDb();
    const ticks = await db.collection('ticks')
      .find({ ticker })
      .sort({ time: -1 })
      .limit(limit)
      .toArray();
    return ticks.reverse(); // oldest first
  }

  /**
   * Get tick history for all stocks (for init payload)
   */
  async getAllTickHistory(limit = 26000) {
    const result = {};
    for (const stock of this.stocks) {
      result[stock.ticker] = await this.getTickHistory(stock.ticker, limit);
    }
    return result;
  }
}
