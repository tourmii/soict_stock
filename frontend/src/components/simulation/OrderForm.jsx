import { useState, useEffect } from 'react';
import { useMarketStore } from '../../store/marketStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useOrderStore } from '../../store/orderStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useLeverageStore } from '../../store/leverageStore';
import { useAuthStore } from '../../store/authStore';
import { STOCKS } from '../../lib/constants';
import { formatCurrency } from '../../lib/formatters';

const ORDER_TYPES = ['Market', 'Limit', 'Stop-Loss', 'Stop-Limit', 'Take-Profit'];
const LEVERAGE_OPTIONS = [2, 5, 10];

export default function OrderForm() {
  const selectedTicker = useMarketStore((s) => s.selectedTicker);
  const prices = useMarketStore((s) => s.prices);
  const cash = usePortfolioStore((s) => s.cash);
  const holdings = usePortfolioStore((s) => s.holdings);
  const buy = usePortfolioStore((s) => s.buy);
  const sell = usePortfolioStore((s) => s.sell);
  const addOrder = useOrderStore((s) => s.addOrder);
  const addToast = useSettingsStore((s) => s.addToast);
  const user = useAuthStore((s) => s.user);
  const openPosition = useLeverageStore((s) => s.openPosition);

  const [mode, setMode] = useState('regular');
  const [side, setSide] = useState('Buy');
  const [orderType, setOrderType] = useState('Market');
  const [quantity, setQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [direction, setDir] = useState('Long');
  const [leverage, setLev] = useState(5);

  const ticker = selectedTicker;
  const stock = STOCKS.find((s) => s.ticker === ticker);
  const currentPrice = prices[ticker] || 0;
  const holding = holdings[ticker];
  const ownedShares = holding?.shares || 0;

  const needsLimitPrice = orderType === 'Limit' || orderType === 'Take-Profit';
  const needsStopPrice = orderType === 'Stop-Loss' || orderType === 'Stop-Limit';
  const needsLimitAfterStop = orderType === 'Stop-Limit';

  const estPrice = orderType === 'Market'
    ? currentPrice
    : (parseFloat(needsLimitPrice ? limitPrice : stopPrice) || currentPrice);
  const totalValue = quantity * estPrice;

  useEffect(() => {
    setLimitPrice('');
    setStopPrice('');
  }, [ticker]);

  const setMaxQty = () => {
    if (side === 'Buy') {
      setQuantity(Math.max(1, Math.floor(cash / (currentPrice || 1))));
    } else {
      setQuantity(Math.max(1, ownedShares));
    }
  };

  const handleSubmit = () => {
    if (quantity <= 0) return;

    if (orderType === 'Market') {
      if (side === 'Buy') {
        if (totalValue > cash) {
          addToast({ type: 'error', title: 'Insufficient funds', message: `Need ${formatCurrency(totalValue)} but have ${formatCurrency(cash)}` });
          return;
        }
        buy(ticker, quantity, currentPrice, orderType, prices);
        addToast({ type: 'trade', title: 'Buy Executed', message: `${quantity} ${ticker} @ ${formatCurrency(currentPrice)}` });
      } else {
        if (quantity > ownedShares) {
          addToast({ type: 'error', title: 'Insufficient shares', message: `You own ${ownedShares} shares of ${ticker}` });
          return;
        }
        sell(ticker, quantity, currentPrice, orderType, prices);
        addToast({ type: 'trade', title: 'Sell Executed', message: `${quantity} ${ticker} @ ${formatCurrency(currentPrice)}` });
      }
      setQuantity(1);
    } else {
      const triggerPrice = parseFloat(needsLimitPrice ? limitPrice : stopPrice);
      if (!triggerPrice || triggerPrice <= 0) {
        addToast({ type: 'error', title: 'Invalid price', message: 'Please enter a valid price.' });
        return;
      }
      addOrder({ type: side, ticker, orderType, quantity, price: triggerPrice });
      addToast({ type: 'info', title: `${orderType} Order Placed`, message: `${side} ${quantity} ${ticker} @ ${formatCurrency(triggerPrice)}` });
      setQuantity(1);
      setLimitPrice('');
      setStopPrice('');
    }
  };

  const futuresNotional = quantity * currentPrice;
  const futuresMargin   = futuresNotional / leverage;
  const futuresLiqPrice = direction === 'Long'
    ? currentPrice * (1 - 0.8 / leverage)
    : currentPrice * (1 + 0.8 / leverage);

  const handleFuturesSubmit = async () => {
    if (!user) { addToast({ type: 'error', title: 'Sign in required', message: 'Please sign in first' }); return; }
    if (futuresMargin > cash) { addToast({ type: 'error', title: 'Insufficient margin', message: `Need ${formatCurrency(futuresMargin)}` }); return; }
    const res = await openPosition(user.id, ticker, direction, leverage, quantity, null);
    if (res.success) {
      addToast({ type: 'trade', title: 'Position Opened', message: `${leverage}× ${direction} ${quantity} ${ticker}` });
      setQuantity(1);
    } else {
      addToast({ type: 'error', title: 'Failed', message: res.message });
    }
  };

  return (
    <div className="order-form">
      <div className="order-form__header">
        <span className="order-ticker" style={{ color: stock?.color }}>{ticker}</span>
        <span className="order-price">{formatCurrency(currentPrice)}</span>
      </div>

      {/* Mode toggle */}
      <div style={{display:'flex',gap:'4px',marginBottom:'10px',background:'var(--gray-100)',borderRadius:'var(--radius-md)',padding:'3px'}}>
        <button onClick={()=>setMode('regular')} style={{flex:1,padding:'6px',borderRadius:'var(--radius-sm)',border:'none',fontWeight:600,fontSize:'11px',cursor:'pointer',background:mode==='regular'?'white':'transparent',color:mode==='regular'?'var(--primary)':'var(--gray-500)',transition:'all 0.15s'}}>Regular</button>
        <button onClick={()=>setMode('futures')} style={{flex:1,padding:'6px',borderRadius:'var(--radius-sm)',border:'none',fontWeight:600,fontSize:'11px',cursor:'pointer',background:mode==='futures'?'white':'transparent',color:mode==='futures'?'var(--primary)':'var(--gray-500)',transition:'all 0.15s'}}>Futures</button>
      </div>

      {mode === 'futures' ? (
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          {/* Long / Short */}
          <div style={{display:'flex',gap:'4px',background:'var(--gray-100)',borderRadius:'var(--radius-md)',padding:'3px'}}>
            <button onClick={()=>setDir('Long')} style={{flex:1,padding:'7px',borderRadius:'var(--radius-sm)',border:'none',fontWeight:600,fontSize:'var(--text-sm)',cursor:'pointer',background:direction==='Long'?'#2563EB':'transparent',color:direction==='Long'?'white':'var(--gray-600)',transition:'all 0.15s'}}>Long</button>
            <button onClick={()=>setDir('Short')} style={{flex:1,padding:'7px',borderRadius:'var(--radius-sm)',border:'none',fontWeight:600,fontSize:'var(--text-sm)',cursor:'pointer',background:direction==='Short'?'#DC2626':'transparent',color:direction==='Short'?'white':'var(--gray-600)',transition:'all 0.15s'}}>Short</button>
          </div>
          {/* Leverage */}
          <div>
            <label style={{fontSize:'11px',color:'var(--gray-500)',fontWeight:600,display:'block',marginBottom:'5px'}}>Leverage</label>
            <div style={{display:'flex',gap:'5px'}}>
              {LEVERAGE_OPTIONS.map(lev => (
                <button key={lev} onClick={()=>setLev(lev)} style={{flex:1,padding:'7px',borderRadius:'var(--radius-sm)',border: leverage===lev ? '1.5px solid var(--primary)' : '1px solid var(--gray-200)',fontWeight:700,fontSize:'var(--text-sm)',cursor:'pointer',background: leverage===lev ? 'var(--primary-bg)' : 'white',color: leverage===lev ? 'var(--primary)' : 'var(--gray-600)'}}>
                  {lev}×
                </button>
              ))}
            </div>
          </div>
          {/* Quantity */}
          <div className="order-form__field">
            <div className="field-label-row"><label>Contracts</label></div>
            <div className="qty-input">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
              <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} min="1"/>
              <button onClick={() => setQuantity((q) => q + 1)}>+</button>
            </div>
          </div>
          {/* Stats */}
          <div className="order-form__summary">
            <div className="sum-row"><span>Notional</span><span>{formatCurrency(futuresNotional)}</span></div>
            <div className="sum-row"><span>Margin</span><strong>{formatCurrency(futuresMargin)}</strong></div>
            <div className="sum-row"><span>Liq. Price</span><span style={{color:'var(--red)'}}>{formatCurrency(futuresLiqPrice)}</span></div>
            <div className="sum-row"><span>Buying Power</span><span>{formatCurrency(cash)}</span></div>
          </div>
          <button onClick={handleFuturesSubmit} disabled={futuresMargin > cash} className={`order-submit ${direction === 'Long' ? 'buy' : 'sell'}`} style={{opacity: futuresMargin > cash ? 0.5 : 1, cursor: futuresMargin > cash ? 'not-allowed' : 'pointer'}}>
            {futuresMargin > cash ? 'Insufficient margin' : `Open ${leverage}× ${direction} · ${ticker}`}
          </button>
        </div>
      ) : (
        <>

      <div className="order-form__sides">
        <button
          className={`side-btn buy ${side === 'Buy' ? 'active' : ''}`}
          onClick={() => setSide('Buy')}
        >Buy</button>
        <button
          className={`side-btn sell ${side === 'Sell' ? 'active' : ''}`}
          onClick={() => setSide('Sell')}
        >Sell</button>
      </div>

      <div className="order-form__field">
        <label>Order Type</label>
        <select
          value={orderType}
          onChange={(e) => setOrderType(e.target.value)}
          className="order-select"
        >
          {ORDER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="order-form__field">
        <div className="field-label-row">
          <label>Quantity</label>
          <button className="max-btn" onClick={setMaxQty}>Max</button>
        </div>
        <div className="qty-input">
          <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
          />
          <button onClick={() => setQuantity((q) => q + 1)}>+</button>
        </div>
      </div>

      {needsStopPrice && (
        <div className="order-form__field">
          <label>Stop Price</label>
          <input
            type="number"
            value={stopPrice}
            onChange={(e) => setStopPrice(e.target.value)}
            placeholder={currentPrice.toFixed(2)}
            step="0.01"
            className="order-input"
          />
        </div>
      )}

      {(needsLimitPrice || needsLimitAfterStop) && (
        <div className="order-form__field">
          <label>{needsLimitAfterStop ? 'Limit Price' : orderType === 'Take-Profit' ? 'Target Price' : 'Limit Price'}</label>
          <input
            type="number"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder={currentPrice.toFixed(2)}
            step="0.01"
            className="order-input"
          />
        </div>
      )}

      <div className="order-form__summary">
        <div className="sum-row">
          <span>Est. Price</span>
          <span>{formatCurrency(estPrice)}</span>
        </div>
        <div className="sum-row">
          <span>Total Value</span>
          <strong style={{ color: side === 'Buy' ? 'var(--green)' : 'var(--red)' }}>
            {formatCurrency(totalValue)}
          </strong>
        </div>
        <div className="sum-row">
          <span>{side === 'Buy' ? 'Buying Power' : 'Shares Owned'}</span>
          <span>{side === 'Buy' ? formatCurrency(cash) : `${ownedShares} shares`}</span>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className={`order-submit ${side === 'Buy' ? 'buy' : 'sell'}`}
      >
        {orderType === 'Market' ? `${side} ${quantity} ${ticker}` : `Place ${orderType}`}
      </button>

      <p className="order-form__hint">
        {orderType === 'Market'
          ? 'Executes immediately at best available price'
          : orderType === 'Stop-Limit'
          ? 'Triggers at stop price, executes at limit price'
          : orderType === 'Take-Profit'
          ? 'Sells automatically when target price is reached'
          : `Executes when price reaches your ${orderType.toLowerCase()} level`}
      </p>
        </>
      )}
    </div>
  );
}
