/**
 * Expanded stock universe — 30 stocks across 6 sectors
 * All fictional tickers for simulation purposes.
 */
export const STOCKS = [
  // ── Technology (6) ──────────────────────────
  { ticker: 'SCT',  name: 'SCTech Ltd.',      fullName: 'SC Technologies Limited',      sector: 'Technology', color: '#1B3BFC', basePrice: 128.45, drift: 0.0008, volatility: 0.025 },
  { ticker: 'INNO', name: 'InnoVance',        fullName: 'InnoVance Corporation',         sector: 'Technology', color: '#8B5CF6', basePrice: 95.20,  drift: 0.0006, volatility: 0.022 },
  { ticker: 'NXTG', name: 'NextGen Corp',     fullName: 'NextGen Corporation',           sector: 'Technology', color: '#06B6D4', basePrice: 210.75, drift: 0.0005, volatility: 0.028 },
  { ticker: 'TECH', name: 'TechVault',        fullName: 'TechVault Industries',          sector: 'Technology', color: '#F59E0B', basePrice: 315.80, drift: 0.0004, volatility: 0.020 },
  { ticker: 'DIGI', name: 'DigiWave',         fullName: 'DigiWave Technologies Inc.',    sector: 'Technology', color: '#7C3AED', basePrice: 72.35,  drift: 0.0009, volatility: 0.030 },
  { ticker: 'CYBN', name: 'CyberNex',         fullName: 'CyberNex Security Corp',       sector: 'Technology', color: '#0EA5E9', basePrice: 156.90, drift: 0.0007, volatility: 0.027 },

  // ── Healthcare (5) ──────────────────────────
  { ticker: 'HEAL', name: 'HealthAxis',       fullName: 'HealthAxis Inc.',               sector: 'Healthcare', color: '#10B981', basePrice: 78.30,  drift: 0.0003, volatility: 0.018 },
  { ticker: 'BPHR', name: 'BioPharma',        fullName: 'BioPharma Research Ltd.',       sector: 'Healthcare', color: '#14B8A6', basePrice: 134.60, drift: 0.0005, volatility: 0.024 },
  { ticker: 'MEDE', name: 'MedEdge',          fullName: 'MedEdge Diagnostics',           sector: 'Healthcare', color: '#059669', basePrice: 52.15,  drift: 0.0004, volatility: 0.020 },
  { ticker: 'GNOM', name: 'GenoMix',          fullName: 'GenoMix Genomics Inc.',         sector: 'Healthcare', color: '#34D399', basePrice: 89.40,  drift: 0.0006, volatility: 0.032 },
  { ticker: 'VITA', name: 'VitaCore',         fullName: 'VitaCore Health Systems',       sector: 'Healthcare', color: '#6EE7B7', basePrice: 41.80,  drift: 0.0003, volatility: 0.016 },

  // ── Energy (5) ──────────────────────────
  { ticker: 'GRN',  name: 'GreenFuture',      fullName: 'GreenFuture Energy',            sector: 'Energy', color: '#22C55E', basePrice: 45.60,  drift: 0.0007, volatility: 0.032 },
  { ticker: 'SLRX', name: 'SolaraX',          fullName: 'SolaraX Renewable Corp.',       sector: 'Energy', color: '#FACC15', basePrice: 68.20,  drift: 0.0008, volatility: 0.035 },
  { ticker: 'VOLT', name: 'VoltEdge',         fullName: 'VoltEdge Power Systems',        sector: 'Energy', color: '#EAB308', basePrice: 112.50, drift: 0.0004, volatility: 0.022 },
  { ticker: 'FUSL', name: 'FusionLite',       fullName: 'FusionLite Energy Inc.',        sector: 'Energy', color: '#84CC16', basePrice: 37.90,  drift: 0.0010, volatility: 0.038 },
  { ticker: 'HDRO', name: 'HydroGen',         fullName: 'HydroGen Clean Power',          sector: 'Energy', color: '#A3E635', basePrice: 24.75,  drift: 0.0009, volatility: 0.040 },

  // ── Finance (5) ──────────────────────────
  { ticker: 'FINI', name: 'FinIntel',         fullName: 'Financial Intelligence Corp',   sector: 'Finance', color: '#EC4899', basePrice: 162.40, drift: 0.0005, volatility: 0.019 },
  { ticker: 'BKGR', name: 'BankGrowth',       fullName: 'BankGrowth Holdings',           sector: 'Finance', color: '#F472B6', basePrice: 88.60,  drift: 0.0003, volatility: 0.017 },
  { ticker: 'CRDX', name: 'CreditMax',        fullName: 'CreditMax Financial',           sector: 'Finance', color: '#DB2777', basePrice: 145.30, drift: 0.0004, volatility: 0.021 },
  { ticker: 'WXCH', name: 'WealthExch',       fullName: 'WealthExchange Platform',       sector: 'Finance', color: '#BE185D', basePrice: 210.00, drift: 0.0006, volatility: 0.023 },
  { ticker: 'PYFN', name: 'PayFinity',        fullName: 'PayFinity Inc.',                sector: 'Finance', color: '#E11D48', basePrice: 56.40,  drift: 0.0008, volatility: 0.028 },

  // ── Consumer (5) ──────────────────────────
  { ticker: 'LUXR', name: 'LuxeRetail',       fullName: 'LuxeRetail Group',              sector: 'Consumer', color: '#D946EF', basePrice: 193.20, drift: 0.0004, volatility: 0.019 },
  { ticker: 'RTAL', name: 'RetailNow',        fullName: 'RetailNow Corp.',               sector: 'Consumer', color: '#A855F7', basePrice: 64.80,  drift: 0.0003, volatility: 0.016 },
  { ticker: 'FDBV', name: 'FoodBev',          fullName: 'FoodBev International',         sector: 'Consumer', color: '#C084FC', basePrice: 82.90,  drift: 0.0002, volatility: 0.014 },
  { ticker: 'STRM', name: 'StreamMax',        fullName: 'StreamMax Entertainment',       sector: 'Consumer', color: '#E879F9', basePrice: 118.50, drift: 0.0007, volatility: 0.026 },
  { ticker: 'GLBR', name: 'GlobalBrands',     fullName: 'GlobalBrands Holdings',         sector: 'Consumer', color: '#F0ABFC', basePrice: 145.70, drift: 0.0003, volatility: 0.015 },

  // ── Industrial (4) ──────────────────────────
  { ticker: 'AROX', name: 'AeroX',            fullName: 'AeroX Defense Systems',         sector: 'Industrial', color: '#F97316', basePrice: 278.40, drift: 0.0005, volatility: 0.022 },
  { ticker: 'CNST', name: 'ConstraPro',       fullName: 'ConstraPro Infrastructure',     sector: 'Industrial', color: '#FB923C', basePrice: 95.60,  drift: 0.0003, volatility: 0.018 },
  { ticker: 'MTLX', name: 'MetalliX',         fullName: 'MetalliX Resources',            sector: 'Industrial', color: '#FDBA74', basePrice: 43.20,  drift: 0.0004, volatility: 0.025 },
  { ticker: 'LOGQ', name: 'LogiQuest',        fullName: 'LogiQuest Logistics',           sector: 'Industrial', color: '#FED7AA', basePrice: 67.30,  drift: 0.0003, volatility: 0.017 },
];

// Sector → tickers mapping (derived)
export const SECTOR_TICKERS = {};
for (const stock of STOCKS) {
  if (!SECTOR_TICKERS[stock.sector]) SECTOR_TICKERS[stock.sector] = [];
  SECTOR_TICKERS[stock.sector].push(stock.ticker);
}

// Ticker → sector mapping
export const STOCK_SECTORS = {};
for (const stock of STOCKS) {
  STOCK_SECTORS[stock.ticker] = stock.sector;
}
