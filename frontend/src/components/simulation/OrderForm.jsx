import { useState } from 'react';
import { useMarketStore } from '../../store/marketStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useOrderStore } from '../../store/orderStore';
import { useSettingsStore } from '../../store/settingsStore';
import { STOCKS, ORDER_TYPES } from '../../lib/constants';
import { formatCurrency } from '../../lib/formatters';

export default function OrderForm() {
  const selectedTicker = useMarketStore((s) => s.selectedTicker);
  const prices = useMarketStore((s) => s.prices);
  const cash = usePortfolioStore((s) => s.cash);
  const holdings = usePortfolioStore((s) => s.holdings);
  const buy = usePortfolioStore((s) => s.buy);
  const sell = usePortfolioStore((s) => s.sell);
  const addOrder = useOrderStore((s) => s.addOrder);
  const addToast = useSettingsStore((s) => s.addToast);

  const [side, setSide] = useState('Buy');
  const [ticker, setTicker] = useState(selectedTicker);
  const [orderType, setOrderType] = useState('Market');
  const [quantity, setQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');

  const currentPrice = prices[ticker] || 0;
  const estPrice = orderType === 'Market' ? currentPrice : (parseFloat(limitPrice) || currentPrice);
  const totalValue = quantity * estPrice;
  const holding = holdings[ticker];
  const maxSellQty = holding?.shares || 0;

  const handleSubmit = () => {
    if (quantity <= 0) return;

    if (orderType === 'Market') {
      let result;
      if (side === 'Buy') {
        if (totalValue > cash) { addToast({ type: 'error', title: 'Insufficient funds', message: `Need ${formatCurrency(totalValue)} but only have ${formatCurrency(cash)}` }); return; }
        result = buy(ticker, quantity, currentPrice, orderType);
      } else {
        if (quantity > maxSellQty) { addToast({ type: 'error', title: 'Insufficient shares', message: `You only own ${maxSellQty} shares of ${ticker}` }); return; }
        result = sell(ticker, quantity, currentPrice, orderType);
      }
      if (result) {
        const stock = STOCKS.find((s) => s.ticker === ticker);
        addToast({
          type: 'trade', title: `${side} Order Executed`,
          message: `You ${side.toLowerCase() === 'buy' ? 'bought' : 'sold'} ${quantity} shares of ${stock?.name} at ${formatCurrency(currentPrice)}`,
          lesson: true,
        });
        setQuantity(1);
      }
    } else {
      addOrder({ type: side, ticker, orderType, quantity, price: estPrice });
      addToast({ type: 'info', title: `${orderType} Order Placed`, message: `${side} ${quantity} ${ticker} at ${formatCurrency(estPrice)}. Order will execute when price condition is met.` });
      setQuantity(1);
      setLimitPrice('');
    }
  };

  return (
    <div className="card" style={{padding:'20px'}}>
      <h4 style={{fontSize:'var(--text-md)',fontWeight:700,marginBottom:'16px'}}>Place Order</h4>
      <div style={{display:'flex',gap:'4px',marginBottom:'16px',background:'var(--gray-100)',borderRadius:'var(--radius-md)',padding:'3px'}}>
        <button onClick={()=>setSide('Buy')} style={{flex:1,padding:'8px',borderRadius:'var(--radius-sm)',border:'none',fontWeight:600,fontSize:'var(--text-sm)',cursor:'pointer',background:side==='Buy'?'var(--green)':'transparent',color:side==='Buy'?'white':'var(--gray-600)',transition:'all 0.15s'}}>Buy</button>
        <button onClick={()=>setSide('Sell')} style={{flex:1,padding:'8px',borderRadius:'var(--radius-sm)',border:'none',fontWeight:600,fontSize:'var(--text-sm)',cursor:'pointer',background:side==='Sell'?'var(--red)':'transparent',color:side==='Sell'?'white':'var(--gray-600)',transition:'all 0.15s'}}>Sell</button>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
        <div>
          <label style={{fontSize:'var(--text-xs)',color:'var(--gray-500)',fontWeight:500,display:'block',marginBottom:'4px'}}>Company</label>
          <select value={ticker} onChange={(e)=>setTicker(e.target.value)} className="input select">
            {STOCKS.map((s)=>(<option key={s.ticker} value={s.ticker}>{s.ticker} — {s.name}</option>))}
          </select>
        </div>
        <div>
          <label style={{fontSize:'var(--text-xs)',color:'var(--gray-500)',fontWeight:500,display:'block',marginBottom:'4px'}}>Order Type</label>
          <select value={orderType} onChange={(e)=>setOrderType(e.target.value)} className="input select">
            {ORDER_TYPES.map((t)=>(<option key={t} value={t}>{t}</option>))}
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
        {orderType !== 'Market' && (
          <div>
            <label style={{fontSize:'var(--text-xs)',color:'var(--gray-500)',fontWeight:500,display:'block',marginBottom:'4px'}}>{orderType} Price</label>
            <input type="number" value={limitPrice} onChange={(e)=>setLimitPrice(e.target.value)} className="input" placeholder={currentPrice.toFixed(2)} step="0.01"/>
          </div>
        )}
        <div style={{background:'var(--gray-50)',borderRadius:'var(--radius-md)',padding:'12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:'var(--text-xs)',color:'var(--gray-500)'}}>Est. Market Price</span>
          <span style={{fontWeight:700,fontSize:'var(--text-base)'}}>{formatCurrency(estPrice)}</span>
        </div>
        <div style={{background:'var(--primary-bg)',borderRadius:'var(--radius-md)',padding:'16px',textAlign:'center'}}>
          <p style={{fontSize:'var(--text-xs)',color:'var(--gray-500)',marginBottom:'4px'}}>Estimated Transaction Value</p>
          <p style={{fontSize:'var(--text-2xl)',fontWeight:800,color:'var(--primary)',fontFamily:'var(--font-heading)'}}>{formatCurrency(totalValue)}</p>
        </div>
        <button onClick={handleSubmit} className={`btn ${side==='Buy'?'btn-green':'btn-red'} btn-lg`} style={{width:'100%'}}>
          Confirm {side} Order
        </button>
        <p style={{fontSize:'11px',color:'var(--gray-400)',textAlign:'center'}}>
          {orderType === 'Market' ? 'Market orders executed at best available price' : `${orderType} order will execute when price condition is met`}
        </p>
      </div>
    </div>
  );
}
