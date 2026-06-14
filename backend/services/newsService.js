/**
 * News Service — fetches real financial news from multiple APIs
 * and determines which stocks are affected via keyword matching.
 *
 * Sources (all optional, configured via env vars):
 *   GNEWS_API_KEY      — https://gnews.io            (free: 100 req/day)
 *   MARKETAUX_API_KEY  — https://marketaux.com        (free: 100 req/day)
 *
 * Article IDs are derived from URL so the same article is never stored twice,
 * even across server restarts or re-fetches.
 */

import https from 'https';
import { createHash } from 'crypto';
import { STOCK_SECTORS, SECTOR_TICKERS } from './stockData.js';

/* ── Keyword mapping ─────────────────────────────────────────── */

const SECTOR_KEYWORDS = {
  Technology: [
    'tech', 'technology', 'software', 'AI', 'artificial intelligence', 'chip', 'semiconductor',
    'cloud', 'SaaS', 'Apple', 'Google', 'Microsoft', 'Amazon', 'Meta', 'Nvidia', 'Tesla',
    'startup', 'coding', 'data center', 'cybersecurity', 'machine learning', 'algorithm',
    'digital', 'platform', 'app', 'computing', 'innovation',
  ],
  Healthcare: [
    'health', 'healthcare', 'pharma', 'pharmaceutical', 'drug', 'FDA', 'hospital', 'vaccine',
    'biotech', 'medical', 'clinical trial', 'disease', 'patient', 'treatment', 'therapy',
    'diagnosis', 'pandemic', 'WHO', 'medicine',
  ],
  Energy: [
    'oil', 'gas', 'renewable', 'solar', 'energy', 'green', 'wind', 'nuclear', 'EV',
    'electric vehicle', 'battery', 'climate', 'carbon', 'OPEC', 'crude', 'fuel',
    'sustainability', 'emission', 'power grid',
  ],
  Finance: [
    'bank', 'banking', 'interest rate', 'Fed', 'Federal Reserve', 'inflation', 'bond',
    'credit', 'loan', 'mortgage', 'Wall Street', 'SEC', 'regulation', 'IPO', 'stock market',
    'GDP', 'recession', 'unemployment', 'fiscal', 'monetary', 'treasury',
  ],
  Consumer: [
    'retail', 'consumer', 'shopping', 'luxury', 'brand', 'entertainment', 'streaming',
    'food', 'beverage', 'restaurant', 'e-commerce', 'fashion', 'apparel',
  ],
  Industrial: [
    'industrial', 'manufacturing', 'aerospace', 'defense', 'construction', 'logistics',
    'metals', 'mining', 'infrastructure', 'shipping', 'transportation',
  ],
};

const MARKET_WIDE_KEYWORDS = [
  'recession', 'crash', 'rally', 'S&P', 'Dow', 'Nasdaq', 'global market',
  'tariff', 'trade war', 'sanctions', 'geopolitical', 'war', 'crisis',
  'stimulus', 'quantitative easing', 'shutdown', 'default',
];

const POSITIVE_KEYWORDS = [
  'surge', 'jump', 'soar', 'rally', 'gain', 'rise', 'record', 'boom', 'bull',
  'upgrade', 'beats', 'exceeds', 'growth', 'optimism', 'breakthrough', 'approval',
  'profit', 'recover', 'stimulus', 'strong', 'best', 'high', 'up',
];

const NEGATIVE_KEYWORDS = [
  'crash', 'fall', 'drop', 'plunge', 'decline', 'loss', 'bear', 'recession',
  'downgrade', 'misses', 'layoff', 'cuts', 'fear', 'crisis', 'default',
  'investigation', 'lawsuit', 'scandal', 'weak', 'worst', 'low', 'down',
  'slump', 'tumble', 'collapse', 'warning', 'risk',
];

/* ── Analysis helper ─────────────────────────────────────────── */

/**
 * Returns a stable, URL-derived article ID so the same article fetched
 * in multiple API cycles always gets the same ID.
 */
function stableId(url, title) {
  const source = url || title || String(Date.now());
  return createHash('sha1').update(source).digest('hex').slice(0, 24);
}

/**
 * Analyze a news headline to determine affected tickers, sentiment, and impact.
 * Impact is capped at ±3.5 % for sector news, ±1.75 % for market-wide.
 */
export function analyzeHeadline(title, description = '') {
  const text = `${title} ${description}`.toLowerCase();

  const isMarketWide = MARKET_WIDE_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));

  const affectedSectors = new Set();
  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      affectedSectors.add(sector);
    }
  }

  const affectedTickers = [];
  if (isMarketWide) {
    affectedTickers.push(...Object.keys(STOCK_SECTORS));
  } else {
    for (const sector of affectedSectors) {
      if (SECTOR_TICKERS[sector]) affectedTickers.push(...SECTOR_TICKERS[sector]);
    }
  }

  let positiveScore = 0;
  let negativeScore = 0;
  for (const kw of POSITIVE_KEYWORDS) if (text.includes(kw.toLowerCase())) positiveScore++;
  for (const kw of NEGATIVE_KEYWORDS) if (text.includes(kw.toLowerCase())) negativeScore++;

  let sentiment = 'neutral';
  if (positiveScore > negativeScore) sentiment = 'positive';
  else if (negativeScore > positiveScore) sentiment = 'negative';

  // Impact: 0.5 % base, up to 3.5 % for strong signals (capped at 5 keywords)
  const strength = Math.min(Math.max(positiveScore, negativeScore), 5) / 5;
  const rawImpact = (sentiment === 'positive' ? 1 : -1) * (0.005 + strength * 0.030);
  const impact = isMarketWide ? rawImpact * 0.5 : rawImpact;

  return { affectedTickers, isMarketWide, sentiment, impact };
}

/* ── HTTP helper ─────────────────────────────────────────────── */

function requestJson(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { family: 4, headers: { accept: 'application/json' } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({
        ok: res.statusCode >= 200 && res.statusCode < 300,
        status: res.statusCode,
        json: () => JSON.parse(body || '{}'),
      }));
    });
    req.setTimeout(timeoutMs, () => {
      const err = new Error('Request timed out');
      err.code = 'ETIMEDOUT';
      req.destroy(err);
    });
    req.on('error', reject);
  });
}

/* ── NewsService ─────────────────────────────────────────────── */

export class NewsService {
  constructor(gnewsApiKey, marketauxApiKey = '') {
    this.gnewsKey     = gnewsApiKey || process.env.GNEWS_API_KEY || '';
    this.marketauxKey = marketauxApiKey || process.env.MARKETAUX_API_KEY || '';
    this.cachedArticles = [];
    this.lastFetch = 0;
    this.fetchInterval = 10 * 60 * 1000; // 10 minutes between API calls
  }

  async fetchNews() {
    const now = Date.now();
    if (now - this.lastFetch < this.fetchInterval && this.cachedArticles.length > 0) {
      return this.cachedArticles;
    }

    const results = await Promise.allSettled([
      this._fetchGNews(),
      this._fetchMarketaux(),
    ]);

    // Merge and deduplicate by stable ID
    const seen = new Set();
    const merged = [];
    for (const r of results) {
      if (r.status === 'fulfilled') {
        for (const a of r.value) {
          if (!seen.has(a.id)) {
            seen.add(a.id);
            merged.push(a);
          }
        }
      }
    }

    if (merged.length > 0) {
      this.cachedArticles = merged;
      this.lastFetch = now;
      console.log(`📰 News pool: ${merged.length} articles`);
    }

    return this.cachedArticles;
  }

  async _fetchGNews() {
    if (!this.gnewsKey) return [];
    try {
      const url = `https://gnews.io/api/v4/search?q=stock+market+finance&lang=en&max=10&token=${this.gnewsKey}`;
      const res = await requestJson(url);
      if (!res.ok) {
        console.warn(`📰 GNews returned ${res.status}`);
        return [];
      }
      const data = res.json();
      return (data.articles || []).map((a) => this._normalizeGNews(a));
    } catch (err) {
      console.warn(`📰 GNews fetch failed (${err.code || err.message})`);
      return [];
    }
  }

  _normalizeGNews(article) {
    const analysis = analyzeHeadline(article.title, article.description);
    return {
      id:          stableId(article.url, article.title),
      headline:    article.title,
      description: article.description || '',
      url:         article.url || null,
      source:      article.source?.name || 'GNews',
      image:       article.image || null,
      publishedAt: article.publishedAt,
      timestamp:   article.publishedAt || new Date().toISOString(),
      ...analysis,
    };
  }

  async _fetchMarketaux() {
    if (!this.marketauxKey) return [];
    try {
      const url = `https://api.marketaux.com/v1/news/all?filter_entities=true&language=en&limit=10&api_token=${this.marketauxKey}`;
      const res = await requestJson(url);
      if (!res.ok) {
        console.warn(`📰 Marketaux returned ${res.status}`);
        return [];
      }
      const data = res.json();
      return (data.data || []).map((a) => this._normalizeMarketaux(a));
    } catch (err) {
      console.warn(`📰 Marketaux fetch failed (${err.code || err.message})`);
      return [];
    }
  }

  _normalizeMarketaux(article) {
    const analysis = analyzeHeadline(article.title, article.description);
    return {
      id:          stableId(article.url, article.title),
      headline:    article.title,
      description: article.description || '',
      url:         article.url || null,
      source:      article.source || 'Marketaux',
      image:       article.image_url || null,
      publishedAt: article.published_at,
      timestamp:   article.published_at || new Date().toISOString(),
      ...analysis,
    };
  }

  getLatest(limit = 20) {
    return this.cachedArticles.slice(0, limit);
  }
}
