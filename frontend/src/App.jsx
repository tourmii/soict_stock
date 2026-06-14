import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Landing from './pages/Landing';
import Simulation from './pages/Simulation';
import Portfolio from './pages/Portfolio';
import Leaderboard from './pages/Leaderboard';
import Contest from './pages/Contest';
import ContestArena from './pages/ContestArena';
import Blogs from './pages/Blogs';
import BlogDetail from './pages/BlogDetail';
import BlogEditor from './pages/BlogEditor';
import UserProfile from './pages/UserProfile';

import Learn from './pages/Learn';
import Toast from './components/shared/Toast';
import ChatbotWidget from './components/chatbot/ChatbotWidget';
import { useMarketStore } from './store/marketStore';
import { useNewsStore } from './store/newsStore';
import { useOrderStore } from './store/orderStore';
import { usePortfolioStore } from './store/portfolioStore';
import { useLeaderboardStore } from './store/leaderboardStore';
import { useAuthStore } from './store/authStore';

function App() {
  const simulateTick = useMarketStore((s) => s.simulateTick);
  const prices = useMarketStore((s) => s.prices);
  const generateInitialNews = useNewsStore((s) => s.generateInitialNews);
  const injectNews = useNewsStore((s) => s.injectNews);
  const fetchFromBackend = useNewsStore((s) => s.fetchFromBackend);
  const checkOrders = useOrderStore((s) => s.checkOrders);
  const loadOpenOrders = useOrderStore((s) => s.loadFromBackend);
  const buy = usePortfolioStore((s) => s.buy);
  const sell = usePortfolioStore((s) => s.sell);
  const recordSnapshot = usePortfolioStore((s) => s.recordSnapshot);
  const loadPortfolio = usePortfolioStore((s) => s.loadFromBackend);
  const fetchLeaderboard = useLeaderboardStore((s) => s.fetchFromBackend);

  const updatePrices   = useMarketStore((s) => s.updatePrices);
  const initFromServer = useMarketStore((s) => s.initFromServer);
  const setLoading     = useMarketStore((s) => s.setLoading);
  const setInitProgress = useMarketStore((s) => s.setInitProgress);
  const isConnected    = useMarketStore((s) => s.isConnected);
  const setConnected   = useMarketStore((s) => s.setConnected);

  const initializeAuth = useAuthStore((s) => s.initialize);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    generateInitialNews();
    initializeAuth();
  }, []);

  // Load user data when auth state changes
  useEffect(() => {
    fetchLeaderboard();
    if (user) {
      loadPortfolio(prices);
      loadOpenOrders();
    }
  }, [user]);

  // WebSocket connection for live market data
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl    = `${protocol}//${window.location.host}/ws`;
    const ws       = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to market data stream');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'init') {
        initFromServer(msg.data);
      } else if (msg.type === 'tick') {
        updatePrices(msg.data);
      } else if (msg.type === 'loading') {
        setLoading(true);
      } else if (msg.type === 'init_progress') {
        setInitProgress(msg.data);
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
    const executeTrade = (type, ticker, quantity, price, orderType, orderId) => {
      if (type === 'Buy') return buy(ticker, quantity, price, orderType, prices, orderId);
      if (type === 'Sell') return sell(ticker, quantity, price, orderType, prices, orderId);
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

  // Fetch news from backend API or inject locally
  useEffect(() => {
    if (isConnected) {
      // Connected to backend — fetch real news periodically
      fetchFromBackend();
      const interval = setInterval(() => {
        fetchFromBackend();
      }, 30000); // refresh every 30s
      return () => clearInterval(interval);
    } else {
      // Disconnected — inject local simulated news
      const scheduleNext = () => {
        const delay = 30000 + Math.random() * 60000;
        return setTimeout(() => {
          injectNews();
          timerRef = scheduleNext();
        }, delay);
      };
      let timerRef = scheduleNext();
      return () => clearTimeout(timerRef);
    }
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
          <Route path="/contest" element={<Contest />} />
          <Route path="/contest/arena/:contestId" element={<ContestArena />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/:slug" element={<BlogDetail />} />
          <Route path="/profiles/:userId" element={<UserProfile />} />
          <Route path="/my-blogs" element={user ? <Navigate to={`/profiles/${user.id}`} replace /> : <Navigate to="/blogs" replace />} />
          <Route path="/my-blogs/new" element={<BlogEditor />} />
          <Route path="/my-blogs/:id/edit" element={<BlogEditor />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/index.html" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <ChatbotWidget />
      <Toast />
    </Router>
  );
}

export default App;
