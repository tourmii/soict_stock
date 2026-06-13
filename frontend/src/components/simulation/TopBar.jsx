import { useMarketStore } from '../../store/marketStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { formatCurrency } from '../../lib/formatters';
import SparklineChart from '../shared/SparklineChart';

export default function TopBar() {
  const prices           = useMarketStore((s) => s.prices);
  const cash             = usePortfolioStore((s) => s.cash);
  const getPortfolioValue = usePortfolioStore((s) => s.getPortfolioValue);
  const getTotalReturn   = usePortfolioStore((s) => s.getTotalReturn);
  const portfolioHistory = usePortfolioStore((s) => s.portfolioHistory);

  const portfolioValue = getPortfolioValue(prices);
  const totalReturn    = getTotalReturn(prices);
  const returnPct      = portfolioValue > 0 ? (totalReturn / (portfolioValue - totalReturn)) * 100 : 0;
  const sparkData      = portfolioHistory.slice(-20).map((p) => p.value);

  return (
    <div className="topbar">
      <div className="topbar__inner">
        <div className="topbar__stats">

          <div className="topbar-stat">
            <span className="topbar-stat__label">Available Cash</span>
            <span className="topbar-stat__value">{formatCurrency(cash)}</span>
          </div>

          <div className="topbar-divider" />

          <div className="topbar-stat">
            <span className="topbar-stat__label">Total P&amp;L</span>
            <div className="topbar-stat__row">
              <span className={`topbar-stat__value ${totalReturn >= 0 ? 'green' : 'red'}`}>
                {totalReturn >= 0 ? '+' : ''}{formatCurrency(totalReturn)}
              </span>
              <SparklineChart data={sparkData} color="auto" width={60} height={24} />
            </div>
          </div>

          <div className="topbar-divider" />

          <div className="topbar-stat">
            <span className="topbar-stat__label">Portfolio Value</span>
            <div className="topbar-stat__row">
              <span className="topbar-stat__value">{formatCurrency(portfolioValue)}</span>
              <span className={`topbar-badge ${returnPct >= 0 ? 'green' : 'red'}`}>
                {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
