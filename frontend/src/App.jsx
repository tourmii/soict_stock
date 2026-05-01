import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Landing from './pages/Landing';
import Simulation from './pages/Simulation';
import Portfolio from './pages/Portfolio';
import Leaderboard from './pages/Leaderboard';
import Backtest from './pages/Backtest';
import Toast from './components/shared/Toast';
import { useMarketStore } from './store/marketStore';
import { useNewsStore } from './store/newsStore';
import { useOrderStore } from './store/orderStore';
import { usePortfolioStore } from './store/portfolioStore';

function App() {
  const simulateTick = useMarketStore((s) => s.simulateTick);
  const prices = useMarketStore((s) => s.prices);
  const generateInitialNews = useNewsStore((s) => s.generateInitialNews);
  const injectNews = useNewsStore((s) => s.injectNews);
  const checkOrders = useOrderStore((s) => s.checkOrders);
  const buy = usePortfolioStore((s) => s.buy);
  const sell = usePortfolioStore((s) => s.sell);
  const recordSnapshot = usePortfolioStore((s) => s.recordSnapshot);

  const updatePrices = useMarketStore((s) => s.updatePrices);
  const isConnected = useMarketStore((s) => s.isConnected);
  const setConnected = useMarketStore((s) => s.setConnected);

  useEffect(() => {
    generateInitialNews();
  }, []);

  // WebSocket connection for live market data
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to market data stream');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'prices' || msg.type === 'tick') {
        updatePrices(msg.data);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from market data stream');
      setConnected(false);
    };

    return () => ws.close();
  }, [setConnected, updatePrices]);

  // Price simulation loop (fallback when disconnected)
  useEffect(() => {
    if (isConnected) return;
    const interval = setInterval(() => {
      simulateTick();
    }, 3000);
    return () => clearInterval(interval);
  }, [simulateTick, isConnected]);

  // Check pending orders on price changes
  useEffect(() => {
    const executeTrade = (type, ticker, quantity, price, orderType) => {
      if (type === 'Buy') return buy(ticker, quantity, price, orderType);
      if (type === 'Sell') return sell(ticker, quantity, price, orderType);
      return false;
    };
    checkOrders(prices, executeTrade);
  }, [prices]);

  // Record portfolio snapshot every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      recordSnapshot(prices);
    }, 30000);
    recordSnapshot(prices);
    return () => clearInterval(interval);
  }, []);

  // Inject random news (fallback when disconnected)
  useEffect(() => {
    if (isConnected) return;
    const scheduleNext = () => {
      const delay = 30000 + Math.random() * 60000;
      return setTimeout(() => {
        injectNews();
        timerRef = scheduleNext();
      }, delay);
    };
    let timerRef = scheduleNext();
    return () => clearTimeout(timerRef);
  }, [isConnected]);

  return (
    <Router>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/backtest" element={<Backtest />} />
        </Routes>
      </main>
      <Footer />
      <Toast />
    </Router>
  );
}

export default App;
