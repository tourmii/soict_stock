/**
 * Curated stock universe — 12 stocks, 2 per sector
 * All fictional tickers for simulation purposes.
 */
export const STOCKS = [
  // ── Technology ──────────────────────────────
  { ticker: 'SCT',  name: 'SCTech Ltd.',   fullName: 'SC Technologies Limited',    sector: 'Technology', color: '#1B3BFC', basePrice: 128.45, drift: 0.0008, volatility: 0.025 },
  { ticker: 'INNO', name: 'InnoVance',     fullName: 'InnoVance Corporation',      sector: 'Technology', color: '#8B5CF6', basePrice: 95.20,  drift: 0.0006, volatility: 0.022 },

  // ── Healthcare ──────────────────────────────
  { ticker: 'HEAL', name: 'HealthAxis',    fullName: 'HealthAxis Inc.',            sector: 'Healthcare', color: '#10B981', basePrice: 78.30,  drift: 0.0003, volatility: 0.018 },
  { ticker: 'BPHR', name: 'BioPharma',     fullName: 'BioPharma Research Ltd.',   sector: 'Healthcare', color: '#14B8A6', basePrice: 134.60, drift: 0.0005, volatility: 0.024 },

  // ── Energy ──────────────────────────────────
  { ticker: 'GRN',  name: 'GreenFuture',   fullName: 'GreenFuture Energy',        sector: 'Energy',     color: '#22C55E', basePrice: 45.60,  drift: 0.0007, volatility: 0.032 },
  { ticker: 'SLRX', name: 'SolaraX',       fullName: 'SolaraX Renewable Corp.',   sector: 'Energy',     color: '#FACC15', basePrice: 68.20,  drift: 0.0008, volatility: 0.035 },

  // ── Finance ──────────────────────────────────
  { ticker: 'FINI', name: 'FinIntel',      fullName: 'Financial Intelligence Corp', sector: 'Finance',  color: '#EC4899', basePrice: 162.40, drift: 0.0005, volatility: 0.019 },
  { ticker: 'BKGR', name: 'BankGrowth',    fullName: 'BankGrowth Holdings',       sector: 'Finance',    color: '#F472B6', basePrice: 88.60,  drift: 0.0003, volatility: 0.017 },

  // ── Consumer ─────────────────────────────────
  { ticker: 'LUXR', name: 'LuxeRetail',    fullName: 'LuxeRetail Group',          sector: 'Consumer',   color: '#D946EF', basePrice: 193.20, drift: 0.0004, volatility: 0.019 },
  { ticker: 'STRM', name: 'StreamMax',     fullName: 'StreamMax Entertainment',   sector: 'Consumer',   color: '#E879F9', basePrice: 118.50, drift: 0.0007, volatility: 0.026 },

  // ── Industrial ───────────────────────────────
  { ticker: 'AROX', name: 'AeroX',         fullName: 'AeroX Defense Systems',     sector: 'Industrial', color: '#F97316', basePrice: 278.40, drift: 0.0005, volatility: 0.022 },
  { ticker: 'CNST', name: 'ConstraPro',    fullName: 'ConstraPro Infrastructure', sector: 'Industrial', color: '#FB923C', basePrice: 95.60,  drift: 0.0003, volatility: 0.018 },
];

// Derived lookups
export const SECTOR_TICKERS = {};
for (const stock of STOCKS) {
  if (!SECTOR_TICKERS[stock.sector]) SECTOR_TICKERS[stock.sector] = [];
  SECTOR_TICKERS[stock.sector].push(stock.ticker);
}

export const STOCK_SECTORS = {};
for (const stock of STOCKS) {
  STOCK_SECTORS[stock.ticker] = stock.sector;
}
