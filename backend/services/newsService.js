/**
 * News Service — fetches real news from GNews API
 * and determines which stocks are affected using keyword matching.
 */

import https from 'https';

// Keyword-to-stock mapping for the impact engine
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
};

// Stock-to-sector map
const STOCK_SECTORS = {
  SCT: 'Technology',
  INNO: 'Technology',
  NXTG: 'Technology',
  TECH: 'Technology',
  HEAL: 'Healthcare',
  GRN: 'Energy',
  FINI: 'Finance',
};

// Market-wide keywords that affect all stocks
const MARKET_WIDE_KEYWORDS = [
  'recession', 'crash', 'rally', 'S&P', 'Dow', 'Nasdaq', 'global market',
  'tariff', 'trade war', 'sanctions', 'geopolitical', 'war', 'crisis',
  'stimulus', 'quantitative easing', 'shutdown', 'default',
];

// Sentiment keywords
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

/**
 * Analyze a news headline to determine:
 * - Which stocks/sectors it affects
 * - Sentiment (positive/negative/neutral)
 * - Impact magnitude
 */
function analyzeHeadline(title, description = '') {
  const text = `${title} ${description}`.toLowerCase();

  // Check market-wide impact
  const isMarketWide = MARKET_WIDE_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));

  // Find affected sectors
  const affectedSectors = new Set();
  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) {
        affectedSectors.add(sector);
        break;
      }
    }
  }

  // Map sectors to tickers
  const affectedTickers = [];
  if (isMarketWide) {
    affectedTickers.push(...Object.keys(STOCK_SECTORS));
  } else {
    for (const [ticker, sector] of Object.entries(STOCK_SECTORS)) {
      if (affectedSectors.has(sector)) {
        affectedTickers.push(ticker);
      }
    }
  }

  // Determine sentiment
  let positiveScore = 0;
  let negativeScore = 0;
  for (const kw of POSITIVE_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) positiveScore++;
  }
  for (const kw of NEGATIVE_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) negativeScore++;
  }

  let sentiment = 'neutral';
  if (positiveScore > negativeScore) sentiment = 'positive';
  else if (negativeScore > positiveScore) sentiment = 'negative';

  // Calculate impact magnitude (0 to 0.05)
  const strength = Math.min(Math.max(positiveScore, negativeScore), 5) / 5;
  const impact = (sentiment === 'positive' ? 1 : -1) * (0.005 + strength * 0.03);

  return {
    affectedTickers,
    isMarketWide,
    sentiment,
    impact: isMarketWide ? impact * 0.5 : impact,
  };
}

export class NewsService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.cachedArticles = [];
    this.lastFetch = 0;
    this.fetchInterval = 10 * 60 * 1000; // 10 minutes between API calls
  }

  async _requestJson(url, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
      const request = https.get(url, {
        family: 4,
        headers: {
          accept: 'application/json',
        },
      }, (response) => {
        let body = '';

        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          resolve({
            ok: response.statusCode >= 200 && response.statusCode < 300,
            status: response.statusCode,
            json: async () => JSON.parse(body || '{}'),
          });
        });
      });

      request.setTimeout(timeoutMs, () => {
        const timeoutError = new Error('Request timed out');
        timeoutError.code = 'ETIMEDOUT';
        request.destroy(timeoutError);
      });

      request.on('error', reject);
    });
  }

  async fetchNews() {
    // Rate limit: only fetch every 10 minutes
    const now = Date.now();
    if (now - this.lastFetch < this.fetchInterval && this.cachedArticles.length > 0) {
      return this.cachedArticles;
    }

    if (!this.apiKey) {
      return [];
    }

    try {
      const url = `https://gnews.io/api/v4/search?q=stock+market+finance&lang=en&max=10&token=${this.apiKey}`;
      const response = await this._requestJson(url, 8000);

      if (!response.ok) {
        console.warn(`📰 GNews API returned ${response.status} — using fallback news`);
        return this.cachedArticles;
      }

      const data = await response.json();
      const articles = (data.articles || []).map((article) => {
        const analysis = analyzeHeadline(article.title, article.description);

        return {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          headline: article.title,
          description: article.description || '',
          url: article.url,
          source: article.source?.name || 'Unknown',
          image: article.image || null,
          publishedAt: article.publishedAt,
          timestamp: article.publishedAt || new Date().toISOString(),
          ...analysis,
        };
      });

      this.cachedArticles = articles;
      this.lastFetch = now;
      console.log(`📰 Fetched ${articles.length} real news articles from GNews`);
      return articles;
    } catch (err) {
      // Silently fall back on network errors (ETIMEDOUT, AbortError, etc.)
      const reason = err.name === 'AbortError' ? 'timeout' : (err.cause?.code || err.message);
      console.warn(`📰 GNews fetch failed (${reason}) — using fallback news`);
      return this.cachedArticles;
    }
  }

  getLatest(limit = 10) {
    return this.cachedArticles.slice(0, limit);
  }
}

export { analyzeHeadline };
