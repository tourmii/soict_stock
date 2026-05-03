const STOCKS = [
  { ticker: 'SCT', name: 'SCTech Ltd.', basePrice: 128.45, drift: 0.0008, volatility: 0.025, sector: 'Technology' },
  { ticker: 'INNO', name: 'InnoVance', basePrice: 95.20, drift: 0.0006, volatility: 0.022, sector: 'Technology' },
  { ticker: 'NXTG', name: 'NextGen Corp', basePrice: 210.75, drift: 0.0005, volatility: 0.028, sector: 'Technology' },
  { ticker: 'HEAL', name: 'HealthAxis', basePrice: 78.30, drift: 0.0003, volatility: 0.018, sector: 'Healthcare' },
  { ticker: 'GRN', name: 'GreenFuture', basePrice: 45.60, drift: 0.0007, volatility: 0.032, sector: 'Energy' },
  { ticker: 'TECH', name: 'TechVault', basePrice: 315.80, drift: 0.0004, volatility: 0.020, sector: 'Technology' },
  { ticker: 'FINI', name: 'FinIntel', basePrice: 162.40, drift: 0.0005, volatility: 0.019, sector: 'Finance' },
];

function boxMuller() {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

export class SimulationEngine {
  constructor() {
    this.stocks = STOCKS;
    this.prices = {};
    this.rawTicks = {};      // minute-level tick data per ticker
    this.regime = 'normal';
    this.driftOverrides = {};
    this.volatilityMultipliers = {};
    this.intervalId = null;
    this.listeners = [];

    this._initializePrices();
  }

  _initializePrices() {
    for (const stock of this.stocks) {
      this.rawTicks[stock.ticker] = this._generateMinuteTicks(stock, 90);
      const lastTick = this.rawTicks[stock.ticker][this.rawTicks[stock.ticker].length - 1];
      this.prices[stock.ticker] = lastTick.price;
    }
  }

  /**
   * Generate granular 5-minute tick data for N days of history.
   */
  _generateMinuteTicks(stock, days) {
    const ticks = [];
    let price = stock.basePrice * (0.7 + Math.random() * 0.3);
    const now = Math.floor(Date.now() / 1000);
    const intervalSec = 300; // 5 minutes
    const ticksPerDay = 288;
    const totalTicks = days * ticksPerDay;
    const startTime = now - totalTicks * intervalSec;
    const dt = 1 / (252 * ticksPerDay);

    for (let i = 0; i <= totalTicks; i++) {
      price = i === 0 ? price : this._nextPrice(price, stock.drift, stock.volatility, dt);
      ticks.push({
        time: startTime + i * intervalSec,
        price,
        volume: Math.floor(200 + Math.random() * 2000),
      });
    }
    return ticks;
  }

  _nextPrice(price, drift, volatility, dt = 1 / 252) {
    const driftOverride = this.driftOverrides[this.regime] || 0;
    const volMult = this.volatilityMultipliers[this.regime] || 1;
    const effectiveDrift = drift + driftOverride;
    const effectiveVol = volatility * volMult;
    const z = boxMuller();
    return price * Math.exp((effectiveDrift - 0.5 * effectiveVol ** 2) * dt + effectiveVol * Math.sqrt(dt) * z);
  }

  tick() {
    const updates = {};
    const now = Math.floor(Date.now() / 1000);

    for (const stock of this.stocks) {
      const newPrice = this._nextPrice(this.prices[stock.ticker], stock.drift, stock.volatility);
      this.prices[stock.ticker] = newPrice;

      // Append raw tick
      this.rawTicks[stock.ticker].push({
        time: now,
        price: newPrice,
        volume: Math.floor(200 + Math.random() * 2000),
      });

      updates[stock.ticker] = {
        price: newPrice,
        tick: { time: now, price: newPrice, volume: Math.floor(200 + Math.random() * 2000) },
      };
    }

    for (const listener of this.listeners) {
      listener(updates);
    }
    return updates;
  }

  start(intervalMs = 3000) {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.tick(), intervalMs);
    console.log('📈 Simulation engine started (5-min tick granularity)');
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
      this.prices[ticker] *= (1 + shockPercent);
    }
  }

  getQuote(ticker) {
    const price = this.prices[ticker];
    if (!price) return null;
    const spread = price * 0.001;
    return { ticker, price, bid: price - spread / 2, ask: price + spread / 2, spread };
  }
}
