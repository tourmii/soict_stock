import { useMarketStore } from '../../store/marketStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { formatCurrency, formatPercentRaw } from '../../lib/formatters';
import SparklineChart from '../shared/SparklineChart';
import ScenarioSelector from './ScenarioSelector';

export default function TopBar() {
  const prices = useMarketStore((s) => s.prices);
  const cash = usePortfolioStore((s) => s.cash);
  const getPortfolioValue = usePortfolioStore((s) => s.getPortfolioValue);
  const getTotalReturn = usePortfolioStore((s) => s.getTotalReturn);
  const portfolioHistory = usePortfolioStore((s) => s.portfolioHistory);

  const portfolioValue = getPortfolioValue(prices);
  const totalReturn = getTotalReturn(prices);
  const returnPct = portfolioValue > 0 ? (totalReturn / (portfolioValue - totalReturn)) * 100 : 0;
  const sparkData = portfolioHistory.slice(-20).map((p) => p.value);

  return (
    <div className="topbar" style={{background:'var(--white)',borderBottom:'var(--border-light)',padding:'12px 0', zIndex: 50, position: 'relative'}}>
      <div className="container" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px',maxWidth:'1600px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'24px',flex:1}}>
          <div className="topbar-stat">
            <span style={{fontSize:'var(--text-xs)',color:'var(--gray-500)',fontWeight:500}}>Available Cash</span>
            <span style={{fontSize:'var(--text-md)',fontWeight:700,color:'var(--gray-900)'}}>{formatCurrency(cash)}</span>
          </div>
          <div style={{width:'1px',height:'32px',background:'var(--gray-200)'}}/>
          <div className="topbar-stat">
            <span style={{fontSize:'var(--text-xs)',color:'var(--gray-500)',fontWeight:500}}>Daily P&L</span>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <span style={{fontSize:'var(--text-md)',fontWeight:700,color:totalReturn>=0?'var(--green)':'var(--red)'}}>
                {totalReturn>=0?'+':''}{formatCurrency(totalReturn)}
              </span>
              <SparklineChart data={sparkData} color="auto" width={60} height={24}/>
            </div>
          </div>
          <div style={{width:'1px',height:'32px',background:'var(--gray-200)'}}/>
          <div className="topbar-stat">
            <span style={{fontSize:'var(--text-xs)',color:'var(--gray-500)',fontWeight:500}}>Portfolio Value</span>
            <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
              <span style={{fontSize:'var(--text-md)',fontWeight:700,color:'var(--gray-900)'}}>{formatCurrency(portfolioValue)}</span>
              <span className={`badge ${returnPct>=0?'badge-green':'badge-red'}`} style={{fontSize:'10px'}}>
                {returnPct>=0?'+':''}{returnPct.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <ScenarioSelector />
        </div>
      </div>
    </div>
  );
}
