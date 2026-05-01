import { useState } from 'react';
import Watchlist from '../components/simulation/Watchlist';
import StockChart from '../components/simulation/StockChart';
import OrderForm from '../components/simulation/OrderForm';
import PortfolioPanel from '../components/simulation/PortfolioPanel';
import NewsPanel from '../components/simulation/NewsPanel';
import TopBar from '../components/simulation/TopBar';
import OrderBookView from '../components/simulation/OrderBook';
import AIChatPanel from '../components/simulation/AIChatPanel';
import './Simulation.css';

export default function Simulation() {
  const [activeTab, setActiveTab] = useState('chart'); // 'chart' | 'orderbook'

  return (
    <div className="simulation" id="simulation-page">
      <TopBar />
      <div className="simulation__layout container">
        <aside className="simulation__left">
          <Watchlist />
          <NewsPanel />
        </aside>
        <main className="simulation__center">
          <div className="sim-tabs">
            <button className={`sim-tab ${activeTab==='chart'?'sim-tab--active':''}`} onClick={()=>setActiveTab('chart')}>Chart</button>
            <button className={`sim-tab ${activeTab==='orderbook'?'sim-tab--active':''}`} onClick={()=>setActiveTab('orderbook')}>Order Book</button>
          </div>
          {activeTab === 'chart' ? <StockChart /> : <OrderBookView />}
          <OrderForm />
        </main>
        <aside className="simulation__right">
          <PortfolioPanel />
        </aside>
      </div>
      <AIChatPanel />
    </div>
  );
}
