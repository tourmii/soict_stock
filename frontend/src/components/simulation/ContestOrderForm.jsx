import { useState } from 'react';
import { useMarketStore } from '../../store/marketStore';
import { useContestStore } from '../../store/contestStore';
import { useAuthStore } from '../../store/authStore';
import { useLeverageStore } from '../../store/leverageStore';
import { STOCKS } from '../../lib/constants';
import { formatCurrency } from '../../lib/formatters';

const LEVERAGE_OPTIONS = [2, 5, 10];

export default function ContestOrderForm() {
  const user           = useAuthStore(s => s.user);
  const selectedTicker = useMarketStore(s => s.selectedTicker);
  const prices         = useMarketStore(s => s.prices);
  const portfolio      = useContestStore(s => s.portfolio);
  const trade          = useContestStore(s => s.trade);
  const currentContest = useContestStore(s => s.currentContest);
  const openPosition   = useLeverageStore(s => s.openPosition);

  const [mode, setMode]         = useState('regular'); // 'regular' | 'futures'
  const [side, setSide]         = useState('Buy');
  const [direction, setDir]     = useState('Long');
  const [quantity, setQuantity] = useState(1);
  const [leverage, setLeverage] = useState(5);

  const ticker       = selectedTicker;
  const stock        = STOCKS.find(s => s.ticker === ticker) || currentContest?.customStocks?.find(s => s.ticker === ticker);
  const currentPrice = prices[ticker] || 0;
  const cash         = portfolio?.cash || 0;
  const holding      = (portfolio?.holdings || []).find(h => h.ticker === ticker);
  const maxSellQty   = holding?.shares || 0;

  // Futures calculations
  const notional      = quantity * currentPrice;
  const margin        = notional / leverage;
  const liqPrice      = direction === 'Long'
    ? currentPrice * (1 - 0.8 / leverage)
    : currentPrice * (1 + 0.8 / leverage);

  const handleRegularSubmit = async () => {
    if (!user) return alert('Please sign in');
    if (quantity <= 0) return;
    const total = quantity * currentPrice;
    if (side === 'Buy' && total > cash) { alert(`Insufficient funds`); return; }
    if (side === 'Sell' && quantity > maxSellQty) { alert(`Only own ${maxSellQty} shares`); return; }
    const res = await trade(user.id, currentContest._id, side, ticker, quantity);
    if (res.success) setQuantity(1);
    else alert(res.message || 'Trade failed');
  };

  const handleFuturesSubmit = async () => {
    if (!user) return alert('Please sign in');
    if (margin > cash) { alert(`Need ${formatCurrency(margin)} margin, have ${formatCurrency(cash)}`); return; }
    const res = await openPosition(user.id, ticker, direction, leverage, quantity, currentContest._id);
    if (res.success) setQuantity(1);
    else alert(res.message || 'Failed to open position');
  };

  const inputStyle = { padding:'10px 12px',border:'var(--border-light)',borderRadius:'var(--radius-md)',background:'var(--gray-50)',fontSize:'var(--text-sm)',width:'100%',boxSizing:'border-box',outline:'none' };
  const tagStyle   = (active, color) => ({ flex:1, padding:'8px', borderRadius:'var(--radius-sm)', border:'none', fontWeight:600, fontSize:'var(--text-sm)', cursor:'pointer', background: active ? color : 'transparent', color: active ? 'white' : 'var(--gray-600)', transition:'all 0.15s' });
  const modeTag    = (active) => ({ padding:'6px 14px', borderRadius:'var(--radius-sm)', border: active ? '1.5px solid var(--primary)' : '1.5px solid transparent', fontWeight:600, fontSize:'11px', cursor:'pointer', background: active ? 'var(--primary-bg)' : 'var(--gray-100)', color: active ? 'var(--primary)' : 'var(--gray-500)', transition:'all 0.15s' });

  return (
    <div className="card" style={{padding:'20px'}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
        <h4 style={{fontSize:'var(--text-md)',fontWeight:700,margin:0}}>Trade</h4>
        <div style={{display:'flex',gap:'6px'}}>
          <button style={modeTag(mode==='regular')} onClick={()=>setMode('regular')}>Regular</button>
          <button style={modeTag(mode==='futures')} onClick={()=>setMode('futures')}>Futures</button>
        </div>
      </div>

      {/* Ticker badge */}
      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px'}}>
        <span style={{width:'8px',height:'8px',borderRadius:'50%',background: stock?.color||'var(--primary)',display:'inline-block'}}/>
        <span style={{fontWeight:700,fontSize:'var(--text-sm)',color: stock?.color||'var(--primary)'}}>{ticker}</span>
        <span style={{fontSize:'11px',color:'var(--gray-400)'}}>{stock?.name}</span>
        <span style={{marginLeft:'auto',fontWeight:700,fontSize:'var(--text-sm)'}}>{formatCurrency(currentPrice)}</span>
      </div>

      {mode === 'regular' ? (
        <>
          {/* Buy / Sell toggle */}
          <div style={{display:'flex',gap:'4px',marginBottom:'14px',background:'var(--gray-100)',borderRadius:'var(--radius-md)',padding:'3px'}}>
            <button style={tagStyle(side==='Buy','var(--green)')} onClick={()=>setSide('Buy')}>Buy</button>
            <button style={tagStyle(side==='Sell','var(--red)')} onClick={()=>setSide('Sell')}>Sell</button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            <div>
              <label style={{fontSize:'11px',color:'var(--gray-500)',fontWeight:600,display:'block',marginBottom:'4px'}}>Quantity</label>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <button onClick={()=>setQuantity(q=>Math.max(1,q-1))} className="btn btn-ghost btn-icon" style={{border:'var(--border-light)'}}>−</button>
                <input type="number" value={quantity} onChange={e=>setQuantity(Math.max(1,parseInt(e.target.value)||1))} style={{...inputStyle,textAlign:'center',width:'80px'}} min="1"/>
                <button onClick={()=>setQuantity(q=>q+1)} className="btn btn-ghost btn-icon" style={{border:'var(--border-light)'}}>+</button>
              </div>
            </div>
            <div style={{background:'var(--primary-bg)',borderRadius:'var(--radius-md)',padding:'14px',textAlign:'center'}}>
              <p style={{fontSize:'11px',color:'var(--gray-500)',margin:'0 0 4px'}}>Transaction Value</p>
              <p style={{fontSize:'var(--text-2xl)',fontWeight:800,color:'var(--primary)',fontFamily:'var(--font-heading)',margin:0}}>{formatCurrency(quantity*currentPrice)}</p>
            </div>
            <button onClick={handleRegularSubmit} className={`btn ${side==='Buy'?'btn-green':'btn-red'} btn-lg`} style={{width:'100%'}}>
              {side} {quantity} {ticker}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Long / Short toggle */}
          <div style={{display:'flex',gap:'4px',marginBottom:'14px',background:'var(--gray-100)',borderRadius:'var(--radius-md)',padding:'3px'}}>
            <button style={tagStyle(direction==='Long','#2563EB')} onClick={()=>setDir('Long')}>Long</button>
            <button style={tagStyle(direction==='Short','#DC2626')} onClick={()=>setDir('Short')}>Short</button>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {/* Leverage selector */}
            <div>
              <label style={{fontSize:'11px',color:'var(--gray-500)',fontWeight:600,display:'block',marginBottom:'6px'}}>Leverage</label>
              <div style={{display:'flex',gap:'6px'}}>
                {LEVERAGE_OPTIONS.map(lev => (
                  <button key={lev} onClick={()=>setLeverage(lev)}
                    style={{flex:1,padding:'8px',borderRadius:'var(--radius-sm)',border: leverage===lev ? '1.5px solid var(--primary)' : 'var(--border-light)',fontWeight:700,fontSize:'var(--text-sm)',cursor:'pointer',background: leverage===lev ? 'var(--primary-bg)' : 'white',color: leverage===lev ? 'var(--primary)' : 'var(--gray-600)'}}>
                    {lev}×
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label style={{fontSize:'11px',color:'var(--gray-500)',fontWeight:600,display:'block',marginBottom:'4px'}}>Contracts (shares)</label>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <button onClick={()=>setQuantity(q=>Math.max(1,q-1))} className="btn btn-ghost btn-icon" style={{border:'var(--border-light)'}}>−</button>
                <input type="number" value={quantity} onChange={e=>setQuantity(Math.max(1,parseInt(e.target.value)||1))} style={{...inputStyle,textAlign:'center',width:'80px'}} min="1"/>
                <button onClick={()=>setQuantity(q=>q+1)} className="btn btn-ghost btn-icon" style={{border:'var(--border-light)'}}>+</button>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              {[
                ['Notional Value', formatCurrency(notional)],
                ['Margin Required', formatCurrency(margin)],
                ['Liquidation Price', formatCurrency(liqPrice)],
                ['Available Cash', formatCurrency(cash)],
              ].map(([label, value]) => (
                <div key={label} style={{background:'var(--gray-50)',padding:'10px 12px',borderRadius:'var(--radius-md)'}}>
                  <div style={{fontSize:'10px',color:'var(--gray-500)',fontWeight:600,marginBottom:'2px'}}>{label}</div>
                  <div style={{fontWeight:700,fontSize:'var(--text-sm)',color: label==='Liquidation Price' ? 'var(--red)' : 'inherit'}}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{background: margin > cash ? 'rgba(239,68,68,0.08)' : direction==='Long' ? 'rgba(37,99,235,0.07)' : 'rgba(220,38,38,0.07)', borderRadius:'var(--radius-md)',padding:'10px 14px',fontSize:'12px',color:'var(--gray-600)',lineHeight:1.5}}>
              {direction==='Long'
                ? `Opens a ${leverage}× leveraged long. You profit when ${ticker} rises. Liquidated if price falls below ${formatCurrency(liqPrice)}.`
                : `Opens a ${leverage}× leveraged short. You profit when ${ticker} falls. Liquidated if price rises above ${formatCurrency(liqPrice)}.`}
            </div>

            <button onClick={handleFuturesSubmit} disabled={margin > cash}
              style={{width:'100%',padding:'12px',borderRadius:'var(--radius-md)',border:'none',fontWeight:700,fontSize:'var(--text-sm)',cursor: margin>cash ? 'not-allowed' : 'pointer',background: margin>cash ? 'var(--gray-300)' : direction==='Long' ? '#2563EB' : '#DC2626',color:'white',transition:'all 0.15s'}}>
              {margin > cash ? 'Insufficient margin' : `Open ${leverage}× ${direction} · ${ticker}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
