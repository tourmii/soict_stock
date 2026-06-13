import Watchlist from '../components/simulation/Watchlist';
import StockChart from '../components/simulation/StockChart';
import OrderForm from '../components/simulation/OrderForm';
import NewsPanel from '../components/simulation/NewsPanel';
import TopBar from '../components/simulation/TopBar';
import OrderBookView from '../components/simulation/OrderBook';
import TickerHeader from '../components/simulation/TickerHeader';
import TimeSales from '../components/simulation/TimeSales';
import PositionsPanel from '../components/simulation/PositionsPanel';
import MarketLoadingOverlay from '../components/simulation/MarketLoadingOverlay';
import './Simulation.css';

export default function Simulation() {
  return (
    <div className="exchange">
      <MarketLoadingOverlay />
      <TopBar />
      <div className="exchange__body">

        {/* Left: compact watchlist + news */}
        <aside className="exchange__watchlist">
          <Watchlist />
          <div className="exchange__news-panel">
            <NewsPanel />
          </div>
        </aside>

        {/* Center: ticker header, chart, order book + time & sales */}
        <div className="exchange__main">
          <TickerHeader />
          <div className="exchange__chart-wrap">
            <StockChart />
          </div>
          <div className="exchange__lower">
            <OrderBookView />
            <TimeSales />
          </div>
        </div>

        {/* Right: order entry + positions */}
        <aside className="exchange__sidebar">
          <OrderForm />
          <PositionsPanel />
        </aside>

      </div>
    </div>
  );
}
