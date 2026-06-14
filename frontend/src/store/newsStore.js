import { create } from 'zustand';
import { NEWS_TEMPLATES, STOCKS } from '../lib/constants';

/* ── helpers ──────────────────────────────────────────────── */

const ANALYST_FIRMS = [
  'Goldman Sachs', 'Morgan Stanley', 'JPMorgan', 'Barclays',
  'Citi', 'UBS', 'Bank of America', 'Wells Fargo', 'Jefferies',
];

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function randFloat(min, max, dec = 1) {
  return Number((min + Math.random() * (max - min)).toFixed(dec));
}

/** Build a map of all random values that templates can reference via {key}. */
function buildVars(stock) {
  const base = stock?.basePrice ?? 100;

  const revenue         = randFloat(1.2, 9.8);
  const consensusRevenue = Number((revenue + randFloat(0.2, 1.5)).toFixed(1));

  const cpi             = randFloat(2.3, 4.0);
  const prevCpi         = Number((cpi + randFloat(0.2, 0.8)).toFixed(1));

  const gdp             = randFloat(1.1, 2.5);
  const consensusGdp    = Number((gdp + randFloat(0.3, 1.0)).toFixed(1));

  const analystFirm     = pick(ANALYST_FIRMS);

  return {
    // Stock context
    company:         stock?.name     ?? 'The Market',
    fullName:        stock?.fullName ?? 'The Market',
    ticker:          stock?.ticker   ?? '',
    sector:          stock?.sector   ?? 'market',

    // Earnings
    quarter:         pick(QUARTERS),
    beatPct:         randInt(5, 22),
    revGrowth:       randInt(6, 28),
    eps:             (base * 0.03 * (0.8 + Math.random() * 0.6)).toFixed(2),
    revenue,
    consensusRevenue,

    // Analyst
    analystFirm,
    target:          Math.round(base * (1.08 + Math.random() * 0.25)),
    upside:          randInt(12, 35),
    tamExpansion:    randInt(15, 45),

    // Corporate events
    dealSize:        randInt(2, 28),
    premium:         randInt(18, 48),

    // Healthcare
    patients:        randInt(5, 50),

    // Energy / Industrial
    numStates:       randInt(8, 42),
    oilMove:         randInt(4, 12),
    contractYears:   randInt(3, 8),

    // Tech / Cyber
    affectedUsers:   randInt(1, 50),

    // Macro
    cpi, prevCpi,
    gdp, consensusGdp,
    years:           randInt(15, 22),
  };
}

/** Replace every {key} placeholder in text with its value from vars. */
function substitute(text, vars) {
  return text.replace(/\{(\w+)\}/g, (_, key) => (vars[key] !== undefined ? vars[key] : `{${key}}`));
}

/** Return a stock appropriate for the template (sector-filtered if needed). */
function pickStock(template) {
  if (template.sectorWide) return null;
  const pool = template.sectors
    ? STOCKS.filter((s) => template.sectors.includes(s.sector))
    : STOCKS;
  return pick(pool.length > 0 ? pool : STOCKS);
}

function generateNewsItem(template, stock, ageMs = 0) {
  const vars = buildVars(stock);

  const sourceRaw = template.source ?? 'Reuters';
  const source    = substitute(sourceRaw, vars);

  const headline    = substitute(template.headline, vars);
  const description = substitute(template.description ?? '', vars);

  const impact = template.impact[0] + Math.random() * (template.impact[1] - template.impact[0]);

  return {
    id:              Date.now().toString() + Math.random().toString(36).substr(2, 5),
    headline,
    description,
    url:             null,
    source,
    image:           null,
    type:            template.type,
    sentiment:       template.sentiment,
    affectedTickers: stock ? [stock.ticker] : STOCKS.map((s) => s.ticker),
    isMarketWide:    template.sectorWide ?? false,
    impact,
    timestamp:       new Date(Date.now() - ageMs).toISOString(),
  };
}

/* ── store ────────────────────────────────────────────────── */

export const useNewsStore = create((set, get) => ({
  newsItems:      [],
  selectedNews:   null,
  scheduledEvents: [],

  setSelectedNews:   (item) => set({ selectedNews: item }),
  clearSelectedNews: ()     => set({ selectedNews: null }),

  generateInitialNews: () => {
    const items = [];
    for (let i = 0; i < 5; i++) {
      const template = pick(NEWS_TEMPLATES);
      const stock    = pickStock(template);
      items.push(generateNewsItem(template, stock, i * 600_000));
    }
    set({ newsItems: items });
  },

  /* Fetch real news from backend API */
  fetchFromBackend: async () => {
    try {
      const res = await fetch('/api/news?limit=20');
      if (!res.ok) return;
      const data = await res.json();
      if (data?.length > 0) set({ newsItems: data });
    } catch {
      // Backend not available — keep local news
    }
  },

  injectNews: () => {
    const template = pick(NEWS_TEMPLATES);
    const stock    = pickStock(template);
    const item     = generateNewsItem(template, stock);
    set((s) => ({ newsItems: [item, ...s.newsItems].slice(0, 30) }));
    return item;
  },

  clearNews: () => set({ newsItems: [] }),
}));
