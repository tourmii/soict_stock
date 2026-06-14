import { useState, useEffect } from 'react';
import { useMarketStore } from '../../store/marketStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useOrderStore } from '../../store/orderStore';
import { useSettingsStore } from '../../store/settingsStore';
import { STOCKS } from '../../lib/constants';
import { formatCurrency } from '../../lib/formatters';

const ORDER_TYPES = ['Market', 'Limit', 'Stop-Loss', 'Stop-Limit', 'Take-Profit'];

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
  const [orderType, setOrderType] = useState('Market');
  const [quantity, setQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');

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

  return (
    <div className="order-form">
      <div className="order-form__header">
        <span className="order-ticker" style={{ color: stock?.color }}>{ticker}</span>
        <span className="order-price">{formatCurrency(currentPrice)}</span>
      </div>

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
    </div>
  );
}
