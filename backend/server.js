import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { connectDB, getDb } from './services/db.js';
import { SimulationEngine } from './services/simulationEngine.js';
import { OrderBookService } from './services/orderBook.js';
import { NewsInjector } from './services/newsInjector.js';
import { RiskMetrics } from './services/riskMetrics.js';
import marketRoutes from './routes/market.js';
import orderRoutes from './routes/orders.js';
import portfolioRoutes from './routes/portfolio.js';
import leaderboardRoutes from './routes/leaderboard.js';
import advisorRoutes from './routes/advisor.js';
import scenarioRoutes from './routes/scenarios.js';
import newsRoutes from './routes/news.js';
import authRoutes from './routes/auth.js';
import contestRoutes from './routes/contest.js';
import blogRoutes from './routes/blogs.js';
import learningRoutes from './routes/learning.js';
import chatbotRoutes from './routes/chatbot.js';
import { setupPriceStream } from './websocket/priceStream.js';

async function main() {
  await connectDB();

  const app    = express();
  const server = createServer(app);
  const wss    = new WebSocketServer({ server, path: '/ws' });

  app.use(cors());
  app.use(express.json());

  const engine       = new SimulationEngine();
  const orderBook    = new OrderBookService(engine);
  const gnewsApiKey  = process.env.GNEWS_API_KEY || '';
  const newsInjector = new NewsInjector(engine, gnewsApiKey);
  const riskMetrics  = new RiskMetrics();

  app.locals.engine       = engine;
  app.locals.orderBook    = orderBook;
  app.locals.newsInjector = newsInjector;
  app.locals.riskMetrics  = riskMetrics;

  // Routes
  app.use('/api/market',      marketRoutes);
  app.use('/api/orders',      orderRoutes);
  app.use('/api/portfolio',   portfolioRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/advisor',     advisorRoutes);
  app.use('/api/scenarios',   scenarioRoutes);
  app.use('/api/news',        newsRoutes);
  app.use('/api/auth',        authRoutes);
  app.use('/api/contest',     contestRoutes);
  app.use('/api/blogs',       blogRoutes);
  app.use('/api/learning',    learningRoutes);
  app.use('/api/chatbot',     chatbotRoutes);

  app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  // Wire WebSocket before the server starts listening so early clients see the
  // loading screen while history is being generated / gap-filled.
  const { broadcastProgress, broadcastReady } = setupPriceStream(wss, engine);

  const PORT = process.env.PORT || 3001;
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`🚀 SoictStock backend on port ${PORT}`);
  console.log(`📊 WebSocket at ws://localhost:${PORT}/ws`);
  console.log(gnewsApiKey
    ? '📰 Real news enabled (GNews' + (process.env.MARKETAUX_API_KEY ? ' + Marketaux' : '') + ')'
    : '📰 News: no API key set — inject real news by setting GNEWS_API_KEY or MARKETAUX_API_KEY');

  // Initialize engine — may take several minutes on first boot while it
  // generates 1 calendar year of 5-min bars for all tickers.
  await engine.initialize((progress) => broadcastProgress(progress));

  // Inject custom contest stocks if any active contest exists
  const db = getDb();
  const activeContests = await db.collection('contests').find({ status: 'active' }).toArray();
  for (const contest of activeContests) {
    if (!contest.customStocks?.length) continue;
    const existingTickers = new Set(engine.stocks.map((s) => s.ticker));
    const stocksToAdd = contest.customStocks.filter((s) => !existingTickers.has(s.ticker));
    if (stocksToAdd.length === 0) continue;

    engine.stocks = [...engine.stocks, ...stocksToAdd];
    console.log(`📈 Injected ${stocksToAdd.length} custom stocks from contest '${contest.name}'`);

    for (const stock of stocksToAdd) {
      const latestTick = await db.collection('ticks').findOne(
        { ticker: stock.ticker },
        { sort: { time: -1 } },
      );
      engine.prices[stock.ticker] = latestTick ? latestTick.price : stock.basePrice;
    }
  }

  await broadcastReady();

  // Start real-time simulation (3-second tick loop) and news injection
  engine.start();
  newsInjector.start();
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
