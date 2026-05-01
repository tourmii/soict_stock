import { useMemo } from 'react';
import { useMarketStore } from '../../store/marketStore';
import { formatCurrency } from '../../lib/formatters';

export default function OrderBookView() {
  const selectedTicker = useMarketStore((s) => s.selectedTicker);
  const prices = useMarketStore((s) => s.prices);
  const currentPrice = prices[selectedTicker] || 100;

  // Generate synthetic order book around current price
  const { bids, asks } = useMemo(() => {
    const spread = currentPrice * 0.002; // 0.2% spread
    const bids = [];
    const asks = [];

    for (let i = 0; i < 10; i++) {
      const bidPrice = currentPrice - spread * (i + 1) * 0.5;
      const askPrice = currentPrice + spread * (i + 1) * 0.5;
      const bidQty = Math.floor(50 + Math.random() * 500 * (1 - i * 0.08));
      const askQty = Math.floor(50 + Math.random() * 500 * (1 - i * 0.08));
      bids.push({ price: bidPrice, quantity: bidQty, total: bidPrice * bidQty });
      asks.push({ price: askPrice, quantity: askQty, total: askPrice * askQty });
    }

    return { bids, asks: asks.reverse() };
  }, [selectedTicker, Math.floor(currentPrice * 10)]);

  const maxQty = Math.max(...bids.map((b) => b.quantity), ...asks.map((a) => a.quantity));

  return (
    <div className="card" style={{padding:'20px'}}>
      <h4 style={{fontSize:'var(--text-md)',fontWeight:700,marginBottom:'16px'}}>Order Book — {selectedTicker}</h4>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2px',fontSize:'12px'}}>
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',padding:'6px 8px',fontSize:'11px',color:'var(--gray-500)',fontWeight:600}}>
            <span>Bid Price</span><span style={{textAlign:'right'}}>Qty</span>
          </div>
          {bids.map((bid, i) => (
            <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr',padding:'4px 8px',position:'relative'}}>
              <div style={{position:'absolute',right:0,top:0,bottom:0,width:`${(bid.quantity/maxQty)*100}%`,background:'rgba(34,197,94,0.08)',borderRadius:'2px'}}/>
              <span style={{color:'var(--green)',fontWeight:500,position:'relative'}}>{formatCurrency(bid.price)}</span>
              <span style={{textAlign:'right',position:'relative'}}>{bid.quantity}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',padding:'6px 8px',fontSize:'11px',color:'var(--gray-500)',fontWeight:600}}>
            <span>Ask Price</span><span style={{textAlign:'right'}}>Qty</span>
          </div>
          {asks.map((ask, i) => (
            <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr',padding:'4px 8px',position:'relative'}}>
              <div style={{position:'absolute',left:0,top:0,bottom:0,width:`${(ask.quantity/maxQty)*100}%`,background:'rgba(239,68,68,0.08)',borderRadius:'2px'}}/>
              <span style={{color:'var(--red)',fontWeight:500,position:'relative'}}>{formatCurrency(ask.price)}</span>
              <span style={{textAlign:'right',position:'relative'}}>{ask.quantity}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{marginTop:'12px',textAlign:'center',padding:'8px',background:'var(--gray-50)',borderRadius:'var(--radius-md)'}}>
        <span style={{fontSize:'11px',color:'var(--gray-500)'}}>Spread: </span>
        <span style={{fontSize:'var(--text-sm)',fontWeight:700,color:'var(--primary)'}}>{formatCurrency(currentPrice * 0.002)}</span>
        <span style={{fontSize:'11px',color:'var(--gray-400)',marginLeft:'4px'}}>(0.20%)</span>
      </div>
    </div>
  );
}
