const NEWS_TEMPLATES = [
  { type: 'earnings_positive', headline: '{company} Reports Record Q4 Earnings, Beats Estimates by 15%', impact: [0.05, 0.15], sentiment: 'positive' },
  { type: 'earnings_negative', headline: '{company} Misses Revenue Expectations', impact: [-0.05, -0.15], sentiment: 'negative' },
  { type: 'fed_rate_hike', headline: 'Federal Reserve Raises Interest Rates by 25 Basis Points', impact: [-0.02, -0.05], sentiment: 'negative', sectorWide: true },
  { type: 'fed_rate_cut', headline: 'Fed Cuts Rates in Surprise Move, Markets Rally', impact: [0.02, 0.05], sentiment: 'positive', sectorWide: true },
  { type: 'product_launch', headline: '{company} Unveils Revolutionary AI Platform', impact: [0.03, 0.08], sentiment: 'positive' },
  { type: 'ceo_departure', headline: '{company} CEO Steps Down Amid Board Disagreements', impact: [-0.03, -0.08], sentiment: 'negative' },
  { type: 'merger', headline: '{company} Announces Strategic Merger', impact: [0.04, 0.12], sentiment: 'positive' },
  { type: 'black_swan', headline: 'BREAKING: Global Supply Chain Crisis Triggers Market Selloff', impact: [-0.15, -0.25], sentiment: 'negative', sectorWide: true },
];

export class NewsInjector {
  constructor(engine) {
    this.engine = engine;
    this.news = [];
    this.intervalId = null;
  }

  start(minInterval = 30000, maxInterval = 90000) {
    const schedule = () => {
      const delay = minInterval + Math.random() * (maxInterval - minInterval);
      this.intervalId = setTimeout(() => {
        this.injectRandomNews();
        schedule();
      }, delay);
    };
    schedule();
    console.log('📰 News injector started');
  }

  stop() {
    if (this.intervalId) clearTimeout(this.intervalId);
  }

  injectRandomNews() {
    const template = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
    const stocks = this.engine.stocks;
    const stock = stocks[Math.floor(Math.random() * stocks.length)];

    const headline = template.headline.replace('{company}', stock.name);
    const impactRange = template.impact;
    const impact = impactRange[0] + Math.random() * (impactRange[1] - impactRange[0]);

    const newsItem = {
      id: Date.now().toString(),
      headline,
      type: template.type,
      sentiment: template.sentiment,
      ticker: template.sectorWide ? null : stock.ticker,
      impact,
      timestamp: new Date().toISOString(),
      sectorWide: template.sectorWide || false,
    };

    // Apply price impact
    if (template.sectorWide) {
      for (const s of stocks) {
        this.engine.applyShock(s.ticker, impact * 0.5);
      }
    } else {
      this.engine.applyShock(stock.ticker, impact);
    }

    this.news.unshift(newsItem);
    if (this.news.length > 50) this.news = this.news.slice(0, 50);
    return newsItem;
  }

  getNews(limit = 20) {
    return this.news.slice(0, limit);
  }
}
