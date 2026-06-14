import { useContestStore } from '../../store/contestStore';
import { useMarketStore } from '../../store/marketStore';
import { formatCurrency, formatPercent } from '../../lib/formatters';

export default function ContestPortfolioPanel() {
  const portfolio = useContestStore((s) => s.portfolio);
  const prices = useMarketStore((s) => s.prices);
  const getContestPortfolioValue = useContestStore((s) => s.getContestPortfolioValue);

  if (!portfolio) {
    return <div className="card" style={{padding:'20px'}}>Not joined.</div>;
  }

  const initialCash = portfolio.initialCash || 100000;
  const cash = portfolio.cash || 0;
  const holdings = portfolio.holdings || [];
  
  const totalValue = getContestPortfolioValue(prices);
  const returnAmount = totalValue - initialCash;
  const returnPercent = (returnAmount / initialCash) * 100;

  return (
    <div className="card" style={{padding:0,height:'100%',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'20px',borderBottom:'var(--border-light)'}}>
        <h4 style={{fontSize:'var(--text-md)',fontWeight:700,marginBottom:'12px'}}>Contest Portfolio</h4>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
          <div>
            <span style={{fontSize:'var(--text-3xl)',fontWeight:800,fontFamily:'var(--font-heading)',letterSpacing:'-0.02em'}}>{formatCurrency(totalValue)}</span>
          </div>
          <div style={{textAlign:'right'}}>
            <div className={`badge ${returnPercent >= 0 ? 'badge-green' : 'badge-red'}`} style={{fontSize:'var(--text-sm)'}}>
              {returnPercent >= 0 ? '↑' : '↓'} {formatPercent(Math.abs(returnPercent))}
            </div>
            <div style={{fontSize:'var(--text-xs)',color:'var(--gray-500)',marginTop:'4px',fontWeight:500}}>
              {returnAmount >= 0 ? '+' : ''}{formatCurrency(returnAmount)} All Time
            </div>
          </div>
        </div>
        <div style={{marginTop:'16px',display:'flex',gap:'16px'}}>
          <div>
            <div style={{fontSize:'var(--text-xs)',color:'var(--gray-500)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>Buying Power</div>
            <div style={{fontSize:'var(--text-base)',fontWeight:700}}>{formatCurrency(cash)}</div>
          </div>
        </div>
      </div>

      <div style={{padding:'20px',flex:1,overflowY:'auto'}}>
        <h5 style={{fontSize:'var(--text-xs)',color:'var(--gray-500)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'12px'}}>Current Holdings</h5>
        
        {holdings.length === 0 || !holdings.some(h => h.shares > 0) ? (
          <div style={{textAlign:'center',padding:'30px 0',color:'var(--gray-400)'}}>
            <p style={{fontSize:'var(--text-sm)'}}>No positions yet.</p>
            <p style={{fontSize:'var(--text-xs)',marginTop:'4px'}}>Trade to see your positions here.</p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {holdings.filter(h => h.shares > 0).map((h) => {
              const currentPrice = prices[h.ticker] || h.avgPrice || 0;
              const marketValue = h.shares * currentPrice;
              const unrealizedPL = (currentPrice - h.avgPrice) * h.shares;
              const plPercent = h.avgPrice > 0 ? ((currentPrice - h.avgPrice) / h.avgPrice) * 100 : 0;
              
              return (
                <div key={h.ticker} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px',background:'var(--gray-50)',borderRadius:'var(--radius-md)'}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:'var(--text-sm)'}}>{h.ticker}</div>
                    <div style={{fontSize:'var(--text-xs)',color:'var(--gray-500)'}}>{h.shares} shares @ {formatCurrency(h.avgPrice)}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontWeight:700,fontSize:'var(--text-sm)'}}>{formatCurrency(marketValue)}</div>
                    <div style={{fontSize:'var(--text-xs)',fontWeight:600,color:unrealizedPL >= 0 ? 'var(--green)' : 'var(--red)'}}>
                      {unrealizedPL >= 0 ? '+' : ''}{formatCurrency(unrealizedPL)} ({formatPercent(plPercent)})
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
