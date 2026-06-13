import { useMarketStore } from '../../store/marketStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useOrderStore } from '../../store/orderStore';
import { STOCKS } from '../../lib/constants';
import { formatCurrency } from '../../lib/formatters';

export default function PositionsPanel() {
  const prices = useMarketStore((s) => s.prices);
  const setSelectedTicker = useMarketStore((s) => s.setSelectedTicker);
  const cash = usePortfolioStore((s) => s.cash);
  const getHoldingsArray = usePortfolioStore((s) => s.getHoldingsArray);
  const getPortfolioValue = usePortfolioStore((s) => s.getPortfolioValue);
  const getTotalReturn = usePortfolioStore((s) => s.getTotalReturn);
  const transactions = usePortfolioStore((s) => s.transactions);
  const openOrders = useOrderStore((s) => s.openOrders);
  const cancelOrder = useOrderStore((s) => s.cancelOrder);

  const holdings = getHoldingsArray(prices);
  const portfolioValue = getPortfolioValue(prices);
  const totalReturn = getTotalReturn(prices);
  const stockValue = portfolioValue - cash;
  const returnPct = portfolioValue > 0 ? (totalReturn / (portfolioValue - totalReturn)) * 100 : 0;
  const recentTx = transactions.slice(0, 8);
  const pendingOrders = openOrders.filter((o) => o.status === 'Pending');

  return (
    <div className="positions-panel">
      {/* Summary */}
      <div className="positions-summary">
        <div className="pos-sum-row">
          <span>Portfolio Value</span>
          <strong>{formatCurrency(portfolioValue)}</strong>
        </div>
        <div className="pos-sum-row">
          <span>Cash</span>
          <strong>{formatCurrency(cash)}</strong>
        </div>
        <div className="pos-sum-row">
          <span>Invested</span>
          <strong>{formatCurrency(stockValue)}</strong>
        </div>
        <div className="pos-sum-row">
          <span>Total P&amp;L</span>
          <strong className={totalReturn >= 0 ? 'price-up' : 'price-down'}>
            {totalReturn >= 0 ? '+' : ''}{formatCurrency(totalReturn)}
            <span className="pct-small"> ({returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%)</span>
          </strong>
        </div>
      </div>

      {/* Open positions */}
      <div className="positions-section-header">Open Positions</div>
      {holdings.length === 0 ? (
        <div className="positions-empty">No open positions</div>
      ) : (
        <div className="positions-table">
          <div className="pos-table-header">
            <span>Sym</span>
            <span>Qty</span>
            <span>Avg</span>
            <span>P&amp;L</span>
          </div>
          {holdings.map((h) => {
            const stock = STOCKS.find((s) => s.ticker === h.ticker);
            return (
              <div
                key={h.ticker}
                className="pos-table-row"
                onClick={() => setSelectedTicker(h.ticker)}
                title={`${h.ticker}: ${h.shares} shares @ avg ${formatCurrency(h.avgPrice)} | Value: ${formatCurrency(h.marketValue)}`}
              >
                <span style={{ color: stock?.color, fontWeight: 700 }}>{h.ticker}</span>
                <span>{h.shares}</span>
                <span>{formatCurrency(h.avgPrice)}</span>
                <div>
                  <div className={h.unrealizedPL >= 0 ? 'price-up' : 'price-down'}>
                    {h.unrealizedPL >= 0 ? '+' : ''}{formatCurrency(h.unrealizedPL)}
                  </div>
                  <div className={`pct-small ${h.unrealizedPLPercent >= 0 ? 'price-up' : 'price-down'}`}>
                    {h.unrealizedPLPercent >= 0 ? '+' : ''}{h.unrealizedPLPercent.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Open orders */}
      {pendingOrders.length > 0 && (
        <>
          <div className="positions-section-header">Open Orders</div>
          <div className="open-orders-list">
            {pendingOrders.map((o) => (
              <div key={o.id} className="open-order-row">
                <span className={`trade-badge ${o.type === 'Buy' ? 'buy' : 'sell'}`}>{o.type[0]}</span>
                <span className="trade-ticker">{o.ticker}</span>
                <span className="trade-qty">{o.orderType}</span>
                <span className="trade-qty">{o.quantity}@{formatCurrency(o.price)}</span>
                <button
                  onClick={() => cancelOrder(o.id)}
                  className="cancel-order-btn"
                  title="Cancel order"
                >✕</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Recent trades */}
      <div className="positions-section-header">Recent Trades</div>
      <div className="recent-trades">
        {recentTx.length === 0 ? (
          <div className="positions-empty">No transactions yet</div>
        ) : (
          recentTx.map((tx) => (
            <div key={tx.id} className="recent-trade-row">
              <span className={`trade-badge ${tx.type === 'Buy' ? 'buy' : 'sell'}`}>{tx.type[0]}</span>
              <span className="trade-ticker">{tx.ticker}</span>
              <span className="trade-qty">{tx.quantity}@{formatCurrency(tx.price)}</span>
              <span className="trade-total">{formatCurrency(tx.total)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
