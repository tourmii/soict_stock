import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
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
import { setupPriceStream } from './websocket/priceStream.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Middleware
app.use(cors());
app.use(express.json());

// Services (shared state)
const engine = new SimulationEngine();
const orderBook = new OrderBookService(engine);
const gnewsApiKey = process.env.GNEWS_API_KEY || '';
const newsInjector = new NewsInjector(engine, gnewsApiKey);
const riskMetrics = new RiskMetrics();

app.locals.engine = engine;
app.locals.orderBook = orderBook;
app.locals.newsInjector = newsInjector;
app.locals.riskMetrics = riskMetrics;

// Routes
app.use('/api/market', marketRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/news', newsRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// WebSocket price streaming
setupPriceStream(wss, engine);

// Start simulation
engine.start();
newsInjector.start();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 SoictStock backend running on port ${PORT}`);
  console.log(`📊 WebSocket server on ws://localhost:${PORT}/ws`);
  if (gnewsApiKey) {
    console.log(`📰 Real news API enabled (GNews)`);
  } else {
    console.log(`📰 News: using generated fallback (set GNEWS_API_KEY in .env for real news)`);
  }
});
