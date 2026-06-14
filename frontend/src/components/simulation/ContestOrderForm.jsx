import { useState, useEffect } from 'react';
import { useMarketStore } from '../../store/marketStore';
import { useContestStore } from '../../store/contestStore';
import { useAuthStore } from '../../store/authStore';
import { STOCKS } from '../../lib/constants';
import { formatCurrency } from '../../lib/formatters';

export default function ContestOrderForm() {
  const user = useAuthStore((s) => s.user);
  const selectedTicker = useMarketStore((s) => s.selectedTicker);
  const prices = useMarketStore((s) => s.prices);
  
  const portfolio = useContestStore((s) => s.portfolio);
  const trade = useContestStore((s) => s.trade);
  const currentContest = useContestStore((s) => s.currentContest);

  const [side, setSide] = useState('Buy');
  const [quantity, setQuantity] = useState(1);

  // Unified selection
  const ticker = selectedTicker;
  const stock = STOCKS.find((s) => s.ticker === ticker) || currentContest?.customStocks?.find(s => s.ticker === ticker);

  const currentPrice = prices[ticker] || 0;
  const totalValue = quantity * currentPrice;
  
  const cash = portfolio?.cash || 0;
  const holding = (portfolio?.holdings || []).find(h => h.ticker === ticker);
  const maxSellQty = holding?.shares || 0;

  const handleSubmit = async () => {
    if (quantity <= 0) return;
    if (!user) return alert("Please sign in");

    if (side === 'Buy') {
      if (totalValue > cash) { 
        alert(`Need ${formatCurrency(totalValue)} but only have ${formatCurrency(cash)}`); 
        return; 
      }
    } else {
      if (quantity > maxSellQty) { 
        alert(`You only own ${maxSellQty} shares of ${ticker}`); 
        return; 
      }
    }

    const res = await trade(user.id, currentContest._id, side, ticker, quantity);
    if (res.success) {
      setQuantity(1);
      // Could show a toast here
    } else {
      alert(res.message || 'Trade failed');
    }
  };

  return (
    <div className="card" style={{padding:'20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <h4 style={{fontSize:'var(--text-md)',fontWeight:700,margin:0}}>Contest Trade</h4>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <span style={{width:'10px',height:'10px',borderRadius:'50%',background: stock?.color || 'var(--primary)',display:'inline-block'}}></span>
          <span style={{fontWeight:700,fontSize:'var(--text-sm)',color: stock?.color || 'var(--primary)'}}>{ticker}</span>
          <span style={{fontSize:'11px',color:'var(--gray-400)'}}>{stock?.name}</span>
        </div>
      </div>
      <div style={{display:'flex',gap:'4px',marginBottom:'16px',background:'var(--gray-100)',borderRadius:'var(--radius-md)',padding:'3px'}}>
        <button onClick={()=>setSide('Buy')} style={{flex:1,padding:'8px',borderRadius:'var(--radius-sm)',border:'none',fontWeight:600,fontSize:'var(--text-sm)',cursor:'pointer',background:side==='Buy'?'var(--green)':'transparent',color:side==='Buy'?'white':'var(--gray-600)',transition:'all 0.15s'}}>Buy</button>
        <button onClick={()=>setSide('Sell')} style={{flex:1,padding:'8px',borderRadius:'var(--radius-sm)',border:'none',fontWeight:600,fontSize:'var(--text-sm)',cursor:'pointer',background:side==='Sell'?'var(--red)':'transparent',color:side==='Sell'?'white':'var(--gray-600)',transition:'all 0.15s'}}>Sell</button>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
        <div>
          <label style={{fontSize:'var(--text-xs)',color:'var(--gray-500)',fontWeight:500,display:'block',marginBottom:'4px'}}>Order Type</label>
          <select value="Market" disabled className="input select" style={{opacity: 0.7}}>
            <option value="Market">Market Order</option>
          </select>
        </div>
        <div>
          <label style={{fontSize:'var(--text-xs)',color:'var(--gray-500)',fontWeight:500,display:'block',marginBottom:'4px'}}>Quantity</label>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <button onClick={()=>setQuantity(Math.max(1,quantity-1))} className="btn btn-ghost btn-icon" style={{border:'var(--border-light)'}}>−</button>
            <input type="number" value={quantity} onChange={(e)=>setQuantity(Math.max(1,parseInt(e.target.value)||1))} className="input" style={{textAlign:'center',width:'80px'}} min="1"/>
            <button onClick={()=>setQuantity(quantity+1)} className="btn btn-ghost btn-icon" style={{border:'var(--border-light)'}}>+</button>
          </div>
        </div>
        {side === 'Sell' && maxSellQty > 0 && (
          <div style={{background:'var(--gray-50)',borderRadius:'var(--radius-md)',padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:'var(--text-xs)',color:'var(--gray-500)'}}>Available to sell</span>
            <span style={{fontWeight:600,fontSize:'var(--text-sm)'}}>{maxSellQty} shares</span>
          </div>
        )}
        <div style={{background:'var(--gray-50)',borderRadius:'var(--radius-md)',padding:'12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:'var(--text-xs)',color:'var(--gray-500)'}}>Est. Market Price</span>
          <span style={{fontWeight:700,fontSize:'var(--text-base)'}}>{formatCurrency(currentPrice)}</span>
        </div>
        <div style={{background:'var(--primary-bg)',borderRadius:'var(--radius-md)',padding:'16px',textAlign:'center'}}>
          <p style={{fontSize:'var(--text-xs)',color:'var(--gray-500)',marginBottom:'4px'}}>Estimated Transaction Value</p>
          <p style={{fontSize:'var(--text-2xl)',fontWeight:800,color:'var(--primary)',fontFamily:'var(--font-heading)'}}>{formatCurrency(totalValue)}</p>
        </div>
        <button onClick={handleSubmit} className={`btn ${side==='Buy'?'btn-green':'btn-red'} btn-lg`} style={{width:'100%'}}>
          Confirm {side} · {ticker}
        </button>
        <p style={{fontSize:'11px',color:'var(--gray-400)',textAlign:'center'}}>
          Market orders executed at best available price.
        </p>
      </div>
    </div>
  );
}
