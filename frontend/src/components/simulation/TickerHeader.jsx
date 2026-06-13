import { useMemo, useRef, useState, useEffect } from 'react';
import { useMarketStore } from '../../store/marketStore';
import { STOCKS } from '../../lib/constants';
import { formatCurrency } from '../../lib/formatters';

function fmtVol(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

export default function TickerHeader() {
  const selectedTicker    = useMarketStore((s) => s.selectedTicker);
  const setSelectedTicker = useMarketStore((s) => s.setSelectedTicker);
  const prices            = useMarketStore((s) => s.prices);
  const getDailyChange    = useMarketStore((s) => s.getDailyChange);
  const rawTicks          = useMarketStore((s) => s.rawTicks);

  const [priceFlash, setPriceFlash] = useState('');
  const prevPriceRef = useRef(null);

  const stock = STOCKS.find((s) => s.ticker === selectedTicker);
  const price = prices[selectedTicker] || 0;
  const { change, changePercent, open: dailyOpen } = getDailyChange(selectedTicker);
  const isUp   = changePercent >= 0;
  const spread = price * 0.001;

  // Flash the price whenever it changes
  useEffect(() => {
    const prev = prevPriceRef.current;
    if (prev !== null && prev !== price) {
      const dir = price > prev ? 'up' : 'down';
      setPriceFlash(dir);
      const t = setTimeout(() => setPriceFlash(''), 500);
      prevPriceRef.current = price;
      return () => clearTimeout(t);
    }
    prevPriceRef.current = price;
  }, [price]);

  const todayStats = useMemo(() => {
    const ticks = rawTicks[selectedTicker] || [];
    const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;
    const dayTicks  = ticks.filter((t) => t.time >= oneDayAgo);
    if (dayTicks.length === 0) return { high: price, low: price, volume: 0 };
    return {
      high:   Math.max(...dayTicks.map((t) => t.price)),
      low:    Math.min(...dayTicks.map((t) => t.price)),
      volume: dayTicks.reduce((s, t) => s + (t.volume || 0), 0),
    };
  }, [selectedTicker, rawTicks, price]);

  return (
    <div className="ticker-header">
      <div className="ticker-header__left">
        <select
          value={selectedTicker}
          onChange={(e) => setSelectedTicker(e.target.value)}
          className="ticker-select"
        >
          {STOCKS.map((s) => (
            <option key={s.ticker} value={s.ticker}>{s.ticker}</option>
          ))}
        </select>
        <span className="ticker-fullname">{stock?.name}</span>
        <span className="ticker-sector-badge">{stock?.sector}</span>
      </div>

      <div className="ticker-header__price">
        <span className={`ticker-price ${priceFlash === 'up' ? 'flash-text-up' : priceFlash === 'down' ? 'flash-text-down' : ''}`}>
          {formatCurrency(price)}
        </span>
        <span className={`ticker-change ${isUp ? 'up' : 'down'}`}>
          {isUp ? '▲' : '▼'} {formatCurrency(Math.abs(change))} ({isUp ? '+' : ''}{changePercent.toFixed(2)}%)
        </span>
      </div>

      <div className="ticker-header__stats">
        <div className="ticker-stat">
          <span className="ts-label">Bid</span>
          <span className="ts-value green">{formatCurrency(price - spread / 2)}</span>
        </div>
        <div className="ticker-stat">
          <span className="ts-label">Ask</span>
          <span className="ts-value red">{formatCurrency(price + spread / 2)}</span>
        </div>
        <div className="ts-divider" />
        <div className="ticker-stat">
          <span className="ts-label">Open</span>
          <span className="ts-value">{formatCurrency(dailyOpen || price)}</span>
        </div>
        <div className="ticker-stat">
          <span className="ts-label">High</span>
          <span className="ts-value green">{formatCurrency(todayStats.high)}</span>
        </div>
        <div className="ticker-stat">
          <span className="ts-label">Low</span>
          <span className="ts-value red">{formatCurrency(todayStats.low)}</span>
        </div>
        <div className="ticker-stat">
          <span className="ts-label">Volume</span>
          <span className="ts-value">{fmtVol(todayStats.volume)}</span>
        </div>
      </div>
    </div>
  );
}
