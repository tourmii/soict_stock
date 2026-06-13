import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { connectDB } from './services/db.js';
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
import { setupPriceStream } from './websocket/priceStream.js';

async function main() {
  await connectDB();

  const app    = express();
  const server = createServer(app);
  const wss    = new WebSocketServer({ server, path: '/ws' });

  app.use(cors());
  app.use(express.json());

  // Services
  const engine      = new SimulationEngine();
  const orderBook   = new OrderBookService(engine);
  const gnewsApiKey = process.env.GNEWS_API_KEY || '';
  const newsInjector = new NewsInjector(engine, gnewsApiKey);
  const riskMetrics  = new RiskMetrics();

  app.locals.engine      = engine;
  app.locals.orderBook   = orderBook;
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
  app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  // Set up WebSocket BEFORE starting the HTTP server so priceStream is wired
  // before any client connects (clients connecting during init see 'loading').
  const { broadcastProgress, broadcastReady } = setupPriceStream(wss, engine);

  // Start listening BEFORE initialize() so clients can connect and see the
  // loading screen while the 1-year history is being generated / gap-filled.
  const PORT = process.env.PORT || 3001;
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`🚀 SoictStock backend on port ${PORT}`);
  console.log(`📊 WebSocket at ws://localhost:${PORT}/ws`);
  if (gnewsApiKey) {
    console.log(`📰 Real news API enabled (GNews)`);
  } else {
    console.log(`📰 News: generated fallback (set GNEWS_API_KEY for real news)`);
  }

  // Initialize engine — may take several minutes on first boot while it
  // generates 1 calendar year of 5-min bars for all 30 tickers.
  await engine.initialize((progress) => broadcastProgress(progress));

  // Now tell every connected client that data is ready
  await broadcastReady();

  // Start real-time simulation (3-second tick loop)
  engine.start();
  newsInjector.start();
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
