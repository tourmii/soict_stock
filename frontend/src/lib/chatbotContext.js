import { STOCKS } from './constants';
import { useAuthStore } from '../store/authStore';
import { useMarketStore } from '../store/marketStore';
import { useNewsStore } from '../store/newsStore';
import { useOrderStore } from '../store/orderStore';
import { usePortfolioStore } from '../store/portfolioStore';
import { useLearningStore } from '../store/learningStore';
import { LESSONS, QUIZZES } from './learningData';
import { getSectorAllocation, detectHighVolatilityExposure } from './learningUtils';

function pageType(path) {
  if (path.includes('simulation')) return 'simulation';
  if (path.includes('portfolio')) return 'portfolio';
  if (path.includes('learn')) return 'learn';
  if (path.includes('leaderboard')) return 'leaderboard';
  return 'landing';
}

function mentionedTicker(message = '') {
  const upper = message.toUpperCase();
  return STOCKS.find((stock) => new RegExp(`\\b${stock.ticker}\\b`).test(upper))?.ticker || null;
}

function summarizeCandles(candles = []) {
  if (!candles.length) return null;
  const first = candles[0];
  const last = candles[candles.length - 1];
  const high = Math.max(...candles.map((candle) => Number(candle.high || candle.close || 0)));
  const low = Math.min(...candles.map((candle) => Number(candle.low || candle.close || 0)));
  const volume = candles.reduce((sum, candle) => sum + Number(candle.volume || 0), 0);
  const start = Number(first.open || first.close || 0);
  const end = Number(last.close || 0);

  return {
    bars: candles.length,
    open: start,
    close: end,
    high,
    low,
    volume,
    rangePercent: start > 0 ? ((high - low) / start) * 100 : 0,
    returnPercent: start > 0 ? ((end - start) / start) * 100 : 0,
  };
}

function buildStockSnapshot(market, prices = {}) {
  return STOCKS.map((stock) => {
    const price = prices[stock.ticker] ?? stock.basePrice;
    const change = market.getChange?.(stock.ticker) || { change: 0, changePercent: 0 };
    const dailyChange = market.getDailyChange?.(stock.ticker) || null;
    return {
      ticker: stock.ticker,
      name: stock.name,
      fullName: stock.fullName,
      sector: stock.sector,
      basePrice: stock.basePrice,
      currentPrice: price,
      volatility: stock.volatility,
      drift: stock.drift,
      change,
      dailyChange,
    };
  });
}

function getTopMovers(stocks = []) {
  return [...stocks]
    .sort((a, b) => Math.abs(b.change?.changePercent || 0) - Math.abs(a.change?.changePercent || 0))
    .slice(0, 5)
    .map((stock) => ({
      ticker: stock.ticker,
      name: stock.name,
      sector: stock.sector,
      currentPrice: stock.currentPrice,
      changePercent: stock.change?.changePercent || 0,
    }));
}

export function buildChatbotContext(message = '') {
  const auth = useAuthStore.getState();
  const market = useMarketStore.getState();
  const news = useNewsStore.getState();
  const orders = useOrderStore.getState();
  const portfolio = usePortfolioStore.getState();
  const learning = useLearningStore.getState();
  const explicitTicker = mentionedTicker(message);
  const ticker = explicitTicker || market.selectedTicker;
  const stock = STOCKS.find((item) => item.ticker === ticker);
  const prices = market.prices || {};
  const change = market.getChange?.(ticker) || { change: 0, changePercent: 0 };
  const ohlcv = market.getOHLCV?.(ticker, '1H')?.slice(-30) || [];
  const stockSnapshot = buildStockSnapshot(market, prices);
  const holdingsArray = portfolio.getHoldingsArray?.(prices) || [];
  const portfolioValue = portfolio.getPortfolioValue?.(prices) || portfolio.cash || 0;
  const sectorAllocation = getSectorAllocation(portfolio.holdings, prices, STOCKS);
  const latestNews = news.newsItems || [];
  const relatedNews = latestNews.filter((item) =>
    item.affectedTickers?.includes(ticker) || item.isMarketWide || item.sector === stock?.sector
  ).slice(0, 3);

  return {
    user: {
      userId: auth.user?.id || null,
      displayName: auth.user?.display_name || auth.user?.email || 'guest',
      isGuest: !auth.user,
    },
    route: {
      path: window.location.pathname,
      pageType: pageType(window.location.pathname),
    },
    market: {
      selectedTicker: market.selectedTicker,
      mentionedTicker: ticker,
      explicitMentionedTicker: explicitTicker,
      stock,
      stocks: stockSnapshot,
      sectorPeers: stockSnapshot.filter((item) => item.sector === stock?.sector && item.ticker !== ticker),
      topMovers: getTopMovers(stockSnapshot),
      highVolatilityStocks: stockSnapshot
        .filter((item) => item.volatility >= 0.03)
        .map((item) => ({ ticker: item.ticker, name: item.name, sector: item.sector, volatility: item.volatility })),
      prices,
      prevPrices: market.prevPrices,
      change,
      ohlcv,
      ohlcvSummary: summarizeCandles(ohlcv),
    },
    news: {
      newsItems: latestNews,
      relatedNews,
      latest: latestNews[0] || null,
    },
    orders: {
      openOrders: orders.openOrders || [],
      openOrderCount: orders.getOpenOrderCount?.() || 0,
    },
    portfolio: {
      cash: portfolio.cash,
      holdings: portfolio.holdings,
      holdingsArray,
      transactions: portfolio.transactions || [],
      portfolioValue,
      unrealizedPL: portfolio.getUnrealizedPL?.(prices) || 0,
      realizedPL: portfolio.getTotalRealizedPL?.() || 0,
      allocation: portfolio.getAllocation?.(prices),
      sectorAllocation,
      highVolatility: detectHighVolatilityExposure(portfolio.holdings, STOCKS),
    },
    learning: {
      lessonProgress: learning.lessonProgress,
      quizResults: learning.quizResults,
      earnedBadges: learning.earnedBadges,
      currentLevel: learning.currentLevel,
      catalog: {
        lessons: LESSONS.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          difficulty: lesson.difficulty,
          category: lesson.category,
          summary: lesson.summary,
          relatedQuizId: lesson.relatedQuizId,
        })),
        quizzes: QUIZZES.map((quiz) => ({
          id: quiz.id,
          title: quiz.title,
          category: quiz.category,
          passingScore: quiz.passingScore || 70,
          relatedLessonIds: quiz.relatedLessonIds || [],
        })),
      },
      recommended: learning.getRecommendedLesson?.(undefined, undefined, {
        holdings: portfolio.holdings,
        transactions: portfolio.transactions,
        prices,
        stocks: STOCKS,
      }),
    },
  };
}
