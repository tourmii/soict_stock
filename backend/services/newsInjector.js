/**
 * News Injector — persists real news to MongoDB and applies price shocks.
 *
 * Hardcoded fake-news templates are intentionally absent: all price-moving
 * events come from the live news APIs configured in newsService.js.
 * When no fresh real articles are available the injector simply skips,
 * keeping price dynamics driven solely by the simulation model.
 */
import { getDb } from './db.js';
import { NewsService } from './newsService.js';

export class NewsInjector {
  constructor(engine, apiKey) {
    this.engine = engine;
    this.newsService = new NewsService(apiKey);
    this.news = [];
    this.intervalId = null;
    this.injectedIds = new Set(); // in-memory dedup within a session
  }

  start(minInterval = 3 * 60 * 1000, maxInterval = 8 * 60 * 1000) {
    // Initial fetch so articles are ready immediately
    this._fetchRealNews();

    const schedule = () => {
      const delay = minInterval + Math.random() * (maxInterval - minInterval);
      this.intervalId = setTimeout(async () => {
        await this.injectNews();
        schedule();
      }, delay);
    };
    schedule();
    console.log('📰 News injector started (3–8 min intervals, real news only)');
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
      console.error('Failed to fetch real news:', err.message);
    }
  }

  async injectNews() {
    const realArticles = this.newsService.getLatest(20);

    // Pick the first article that hasn't been injected this session
    const article = realArticles.find((a) => !this.injectedIds.has(a.id));

    if (!article) {
      // No fresh articles — refresh the pool and skip this cycle
      await this._fetchRealNews();
      return null;
    }

    this.injectedIds.add(article.id);

    // Check MongoDB for cross-session duplicates before persisting
    try {
      const db = getDb();
      const duplicate = await db.collection('news').findOne({
        $or: [{ _id: article.id }, { headline: article.headline }],
      });

      if (!duplicate) {
        await db.collection('news').insertOne({ ...article, _id: article.id });
      }
    } catch (err) {
      if (err.code !== 11000) console.error('News insert error:', err.message);
    }

    // Apply price impact only when sentiment is clear and impact is non-trivial
    if (article.sentiment !== 'neutral' && Math.abs(article.impact) >= 0.005) {
      if (article.isMarketWide) {
        for (const s of this.engine.stocks) {
          this.engine.applyShock(s.ticker, article.impact * 0.3);
        }
      } else {
        for (const ticker of article.affectedTickers) {
          this.engine.applyShock(ticker, article.impact);
        }
      }
    }

    const newsItem = { ...article, timestamp: new Date().toISOString() };
    this.news.unshift(newsItem);
    if (this.news.length > 50) this.news = this.news.slice(0, 50);

    // When the in-memory pool is exhausted, refresh from API on next cycle
    if (this.injectedIds.size >= realArticles.length) {
      this.injectedIds.clear();
      this._fetchRealNews();
    }

    return newsItem;
  }

  /** @deprecated alias kept for any legacy callers */
  injectRandomNews() {
    return this.injectNews();
  }

  async getNews(limit = 20) {
    if (this.news.length > 0) {
      return this.news.slice(0, limit);
    }
    try {
      const db = getDb();
      return await db.collection('news')
        .find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
    } catch {
      return [];
    }
  }
}
