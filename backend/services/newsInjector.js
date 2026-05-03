import { NewsService, analyzeHeadline } from './newsService.js';

const FALLBACK_TEMPLATES = [
  { type: 'earnings_positive', headline: '{company} Reports Record Q4 Earnings, Beats Estimates by 15%', impact: [0.05, 0.15], sentiment: 'positive', description: 'The company reported quarterly earnings that exceeded analyst expectations, driven by strong revenue growth across all segments.' },
  { type: 'earnings_negative', headline: '{company} Misses Revenue Expectations', impact: [-0.05, -0.15], sentiment: 'negative', description: 'Quarterly results fell short of Wall Street expectations, with the company citing macroeconomic headwinds and supply chain disruptions.' },
  { type: 'fed_rate_hike', headline: 'Federal Reserve Raises Interest Rates by 25 Basis Points', impact: [-0.02, -0.05], sentiment: 'negative', sectorWide: true, description: 'The Federal Reserve announced a quarter-point rate hike, signaling its commitment to curbing inflation. Markets reacted negatively to the tighter monetary policy.' },
  { type: 'fed_rate_cut', headline: 'Fed Cuts Rates in Surprise Move, Markets Rally', impact: [0.02, 0.05], sentiment: 'positive', sectorWide: true, description: 'In a surprise decision, the Federal Reserve lowered interest rates, boosting market sentiment and sending major indices higher.' },
  { type: 'product_launch', headline: '{company} Unveils Revolutionary AI Platform', impact: [0.03, 0.08], sentiment: 'positive', description: 'The company launched a new AI-powered platform that analysts say could reshape the industry. Early reviews have been overwhelmingly positive.' },
  { type: 'ceo_departure', headline: '{company} CEO Steps Down Amid Board Disagreements', impact: [-0.03, -0.08], sentiment: 'negative', description: 'The CEO has resigned following reported disagreements with the board of directors over the company\'s strategic direction.' },
  { type: 'merger', headline: '{company} Announces Strategic Merger', impact: [0.04, 0.12], sentiment: 'positive', description: 'A landmark merger deal has been announced that could create one of the largest companies in the sector, pending regulatory approval.' },
  { type: 'black_swan', headline: 'BREAKING: Global Supply Chain Crisis Triggers Market Selloff', impact: [-0.15, -0.25], sentiment: 'negative', sectorWide: true, description: 'A sudden disruption in global supply chains has triggered a broad market selloff, with all major indices falling sharply.' },
];

export class NewsInjector {
  constructor(engine, apiKey) {
    this.engine = engine;
    this.newsService = new NewsService(apiKey);
    this.news = [];
    this.intervalId = null;
    this.realNewsUsed = new Set();
  }

  start(minInterval = 30000, maxInterval = 90000) {
    // Initial fetch of real news
    this._fetchRealNews();

    const schedule = () => {
      const delay = minInterval + Math.random() * (maxInterval - minInterval);
      this.intervalId = setTimeout(() => {
        this.injectNews();
        schedule();
      }, delay);
    };
    schedule();
    console.log('📰 News injector started');
  }

  stop() {
    if (this.intervalId) clearTimeout(this.intervalId);
  }

  async _fetchRealNews() {
    try {
      const articles = await this.newsService.fetchNews();
      if (articles.length > 0) {
        console.log(`📰 Fetched ${articles.length} real news articles`);
      }
    } catch (err) {
      console.error('Failed to fetch real news:', err);
    }
  }

  async injectNews() {
    // Try to use a real news article first
    const realArticles = this.newsService.getLatest(10);
    const unusedArticle = realArticles.find((a) => !this.realNewsUsed.has(a.id));

    let newsItem;

    if (unusedArticle) {
      this.realNewsUsed.add(unusedArticle.id);
      newsItem = {
        ...unusedArticle,
        timestamp: new Date().toISOString(),
      };

      // Apply price impact based on analysis
      if (unusedArticle.isMarketWide) {
        for (const s of this.engine.stocks) {
          this.engine.applyShock(s.ticker, unusedArticle.impact * 0.5);
        }
      } else if (unusedArticle.affectedTickers.length > 0) {
        for (const ticker of unusedArticle.affectedTickers) {
          this.engine.applyShock(ticker, unusedArticle.impact);
        }
      }
    } else {
      // Fallback to generated news
      newsItem = this._generateFallbackNews();
    }

    this.news.unshift(newsItem);
    if (this.news.length > 50) this.news = this.news.slice(0, 50);

    // Periodically refresh real news
    if (this.realNewsUsed.size >= realArticles.length) {
      this.realNewsUsed.clear();
      this._fetchRealNews();
    }

    return newsItem;
  }

  // Alias for backward compatibility
  injectRandomNews() {
    return this.injectNews();
  }

  _generateFallbackNews() {
    const template = FALLBACK_TEMPLATES[Math.floor(Math.random() * FALLBACK_TEMPLATES.length)];
    const stocks = this.engine.stocks;
    const stock = stocks[Math.floor(Math.random() * stocks.length)];

    const headline = template.headline.replace('{company}', stock.name);
    const description = template.description.replace('{company}', stock.name);
    const impactRange = template.impact;
    const impact = impactRange[0] + Math.random() * (impactRange[1] - impactRange[0]);

    const newsItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      headline,
      description,
      url: null,
      source: 'SoictStock Simulation',
      image: null,
      sentiment: template.sentiment,
      affectedTickers: template.sectorWide ? stocks.map((s) => s.ticker) : [stock.ticker],
      isMarketWide: template.sectorWide || false,
      impact,
      timestamp: new Date().toISOString(),
    };

    // Apply price impact
    if (template.sectorWide) {
      for (const s of stocks) {
        this.engine.applyShock(s.ticker, impact * 0.5);
      }
    } else {
      this.engine.applyShock(stock.ticker, impact);
    }

    return newsItem;
  }

  getNews(limit = 20) {
    return this.news.slice(0, limit);
  }
}
