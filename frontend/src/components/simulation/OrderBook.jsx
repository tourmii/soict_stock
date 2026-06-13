import { useMemo } from 'react';
import { useMarketStore } from '../../store/marketStore';
import { formatCurrency } from '../../lib/formatters';

export default function OrderBookView() {
  const selectedTicker = useMarketStore((s) => s.selectedTicker);
  const prices = useMarketStore((s) => s.prices);
  const currentPrice = prices[selectedTicker] || 100;

  const { bids, asks, spread } = useMemo(() => {
    const spread = currentPrice * 0.001;
    const rawBids = [];
    const rawAsks = [];

    for (let i = 0; i < 10; i++) {
      const bidPrice = currentPrice - spread * (i + 1) * 0.5;
      const askPrice = currentPrice + spread * (i + 1) * 0.5;
      const bidQty = Math.floor(50 + Math.random() * 500 * (1 - i * 0.08));
      const askQty = Math.floor(50 + Math.random() * 500 * (1 - i * 0.08));
      rawBids.push({ price: bidPrice, qty: bidQty });
      rawAsks.push({ price: askPrice, qty: askQty });
    }

    // Compute cumulative totals
    let cumBid = 0;
    let cumAsk = 0;
    const bids = rawBids.map((b) => { cumBid += b.qty; return { ...b, cum: cumBid }; });
    const asks = rawAsks.map((a) => { cumAsk += a.qty; return { ...a, cum: cumAsk }; });

    const maxCum = Math.max(cumBid, cumAsk);
    bids.forEach((b) => { b.pct = (b.cum / maxCum) * 100; });
    asks.forEach((a) => { a.pct = (a.cum / maxCum) * 100; });

    return { bids, asks: asks.reverse(), spread };
  }, [selectedTicker, Math.floor(currentPrice * 10)]);

  return (
    <div className="order-book">
      <div className="panel-header">Order Book — {selectedTicker}</div>
      <div className="ob-cols">
        <span>Price</span>
        <span>Size</span>
        <span>Total</span>
      </div>

      <div className="ob-asks">
        {asks.map((ask, i) => (
          <div key={i} className="ob-row ask">
            <div className="ob-depth ask-depth" style={{ width: `${ask.pct}%` }} />
            <span className="ob-price red">{formatCurrency(ask.price)}</span>
            <span className="ob-qty">{ask.qty}</span>
            <span className="ob-cum">{ask.cum}</span>
          </div>
        ))}
      </div>

      <div className="ob-mid">
        <span className="ob-mid-price">{formatCurrency(currentPrice)}</span>
        <span className="ob-spread-label">
          Spread: {formatCurrency(spread)} ({(spread / currentPrice * 100).toFixed(3)}%)
        </span>
      </div>

      <div className="ob-bids">
        {bids.map((bid, i) => (
          <div key={i} className="ob-row bid">
            <div className="ob-depth bid-depth" style={{ width: `${bid.pct}%` }} />
            <span className="ob-price green">{formatCurrency(bid.price)}</span>
            <span className="ob-qty">{bid.qty}</span>
            <span className="ob-cum">{bid.cum}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
