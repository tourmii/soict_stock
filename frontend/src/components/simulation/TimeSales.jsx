import { useEffect, useRef, useState } from 'react';
import { useMarketStore } from '../../store/marketStore';
import { formatCurrency } from '../../lib/formatters';

function fmtTime(d) {
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function TimeSales() {
  const selectedTicker = useMarketStore((s) => s.selectedTicker);
  const prices = useMarketStore((s) => s.prices);
  const [trades, setTrades] = useState([]);
  const prevPriceRef = useRef({});

  useEffect(() => {
    setTrades([]);
    prevPriceRef.current = {};
  }, [selectedTicker]);

  useEffect(() => {
    const price = prices[selectedTicker];
    if (!price) return;
    const prev = prevPriceRef.current[selectedTicker];
    if (prev === undefined) {
      prevPriceRef.current[selectedTicker] = price;
      return;
    }
    const direction = price >= prev ? 'buy' : 'sell';
    prevPriceRef.current[selectedTicker] = price;

    setTrades((p) => [{
      id: Date.now() + Math.random(),
      time: new Date(),
      price,
      qty: Math.floor(10 + Math.random() * 490),
      direction,
    }, ...p].slice(0, 100));
  }, [prices[selectedTicker]]);

  return (
    <div className="time-sales">
      <div className="panel-header">Time &amp; Sales — {selectedTicker}</div>
      <div className="time-sales__cols">
        <span>Time</span>
        <span>Price</span>
        <span>Size</span>
      </div>
      <div className="time-sales__list">
        {trades.length === 0 && (
          <div className="ts-empty">Waiting for trades...</div>
        )}
        {trades.map((t) => (
          <div key={t.id} className={`ts-row ${t.direction}`}>
            <span className="ts-time">{fmtTime(t.time)}</span>
            <span className={t.direction === 'buy' ? 'price-up' : 'price-down'}>
              {formatCurrency(t.price)}
            </span>
            <span className="ts-qty">{t.qty}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
