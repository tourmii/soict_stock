import { useState, useMemo, useRef, useEffect } from 'react';
import { useMarketStore } from '../../store/marketStore';
import { STOCKS } from '../../lib/constants';
import { formatCurrency } from '../../lib/formatters';

const SECTORS = ['All', 'Technology', 'Healthcare', 'Energy', 'Finance', 'Consumer', 'Industrial'];

export default function Watchlist() {
  const [tab, setTab]               = useState('watch');
  const [sectorFilter, setSector]   = useState('All');
  const [search, setSearch]         = useState('');
  const [flashMap, setFlashMap]     = useState({});
  const prevPricesRef               = useRef({});

  const prices           = useMarketStore((s) => s.prices);
  const getDailyChange   = useMarketStore((s) => s.getDailyChange);
  const setSelectedTicker = useMarketStore((s) => s.setSelectedTicker);
  const selectedTicker   = useMarketStore((s) => s.selectedTicker);
  const watchlist        = useMarketStore((s) => s.watchlist);
  const addToWatchlist   = useMarketStore((s) => s.addToWatchlist);

  // Detect price changes and trigger flash
  useEffect(() => {
    const newFlash = {};
    for (const [ticker, price] of Object.entries(prices)) {
      const prev = prevPricesRef.current[ticker];
      if (prev !== undefined && prev !== price) {
        newFlash[ticker] = price > prev ? 'up' : 'down';
      }
      prevPricesRef.current[ticker] = price;
    }
    if (Object.keys(newFlash).length === 0) return;
    setFlashMap(newFlash);
    const t = setTimeout(() => setFlashMap({}), 500);
    return () => clearTimeout(t);
  }, [prices]);

  const displayStocks = useMemo(() => {
    let source = tab === 'watch'
      ? STOCKS.filter((s) => watchlist.includes(s.ticker))
      : STOCKS;
    if (sectorFilter !== 'All') source = source.filter((s) => s.sector === sectorFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      source = source.filter((s) =>
        s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
    }
    return source.map((s) => ({
      ...s,
      price: prices[s.ticker] || s.basePrice,
      ...getDailyChange(s.ticker),
    }));
  }, [tab, sectorFilter, search, prices, watchlist]);

  const notInWatchlist = STOCKS.filter((s) => !watchlist.includes(s.ticker));

  return (
    <div className="watchlist">
      <div className="watchlist__header">
        <div className="watchlist__tabs">
          <button className={tab === 'watch' ? 'active' : ''} onClick={() => setTab('watch')}>Watch</button>
          <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>All</button>
        </div>
        <input
          className="watchlist__search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
        />
      </div>

      <div className="watchlist__sectors">
        {SECTORS.map((s) => (
          <button
            key={s}
            className={`sector-btn ${sectorFilter === s ? 'active' : ''}`}
            onClick={() => setSector(s)}
          >
            {s === 'All' ? 'All' : s.slice(0, 4)}
          </button>
        ))}
      </div>

      <div className="watchlist__cols">
        <span>Symbol</span>
        <span style={{ textAlign: 'right' }}>Price</span>
        <span style={{ textAlign: 'right' }}>Day%</span>
      </div>

      <div className="watchlist__list">
        {displayStocks.map((s) => {
          const flash = flashMap[s.ticker];
          return (
            <div
              key={s.ticker}
              className={`watchlist-row ${selectedTicker === s.ticker ? 'active' : ''} ${flash ? `flash-${flash}` : ''}`}
              onClick={() => setSelectedTicker(s.ticker)}
            >
              <div className="watchlist-row__symbol">
                <span className="wl-dot" style={{ background: s.color }} />
                <div className="wl-text">
                  <span className="wl-ticker">{s.ticker}</span>
                  <span className="wl-name">{s.name.split(' ')[0]}</span>
                </div>
              </div>
              <span className={`wl-price ${flash === 'up' ? 'flash-text-up' : flash === 'down' ? 'flash-text-down' : ''}`}>
                {formatCurrency(s.price)}
              </span>
              <span className={`wl-change ${s.changePercent >= 0 ? 'up' : 'down'}`}>
                {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
        {displayStocks.length === 0 && (
          <div className="watchlist-empty">
            {tab === 'watch' ? 'No stocks in watchlist' : 'No results'}
          </div>
        )}
      </div>

      {tab === 'watch' && notInWatchlist.length > 0 && (
        <div className="watchlist__add">
          <select
            onChange={(e) => { if (e.target.value) { addToWatchlist(e.target.value); e.target.value = ''; } }}
            className="watchlist__add-select"
          >
            <option value="">+ Add symbol</option>
            {notInWatchlist.map((s) => (
              <option key={s.ticker} value={s.ticker}>{s.ticker} — {s.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
