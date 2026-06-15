import { useEffect } from 'react';
import { useContestStore } from '../../store/contestStore';
import { useMarketStore } from '../../store/marketStore';
import { useAuthStore } from '../../store/authStore';
import { useLeverageStore } from '../../store/leverageStore';
import { formatCurrency, formatPercent } from '../../lib/formatters';

export default function ContestPortfolioPanel() {
  const user          = useAuthStore(s => s.user);
  const portfolio     = useContestStore(s => s.portfolio);
  const currentContest = useContestStore(s => s.currentContest);
  const prices        = useMarketStore(s => s.prices);
  const getContestPortfolioValue = useContestStore(s => s.getContestPortfolioValue);
  const { positions, fetchPositions, closePosition, isLoading } = useLeverageStore();

  useEffect(() => {
    if (user && currentContest?._id) {
      fetchPositions(user.id, currentContest._id);
    }
  }, [user?.id, currentContest?._id]);

  // Keep live P&L up to date as prices change
  const livePositions = positions
    .filter(p => p.contestId === currentContest?._id && p.status === 'Open')
    .map(p => {
      const cur = prices[p.ticker] || p.entryPrice;
      const pnl = (cur - p.entryPrice) * p.quantity * (p.side === 'Long' ? 1 : -1);
      return { ...p, currentPrice: cur, unrealizedPnL: pnl, marginRemaining: p.margin + pnl };
    });

  if (!portfolio) {
    return <div className="card" style={{padding:'20px',color:'var(--gray-400)',fontSize:'var(--text-sm)'}}>Not joined.</div>;
  }

  const initialCash   = portfolio.initialCash || 100000;
  const cash          = portfolio.cash || 0;
  const holdings      = portfolio.holdings || [];
  const totalValue    = getContestPortfolioValue(prices);
  const returnAmount  = totalValue - initialCash;
  const returnPercent = (returnAmount / initialCash) * 100;

  const sectionHeader = { fontSize:'10px', color:'var(--gray-500)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'10px' };

  return (
    <div className="card" style={{padding:0,height:'100%',display:'flex',flexDirection:'column'}}>
      {/* Summary header */}
      <div style={{padding:'20px',borderBottom:'var(--border-light)'}}>
        <h4 style={{fontSize:'var(--text-md)',fontWeight:700,marginBottom:'12px'}}>Contest Portfolio</h4>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
          <span style={{fontSize:'var(--text-3xl)',fontWeight:800,fontFamily:'var(--font-heading)',letterSpacing:'-0.02em'}}>{formatCurrency(totalValue)}</span>
          <div style={{textAlign:'right'}}>
            <div className={`badge ${returnPercent>=0?'badge-green':'badge-red'}`} style={{fontSize:'var(--text-sm)'}}>
              {returnPercent>=0?'↑':'↓'} {formatPercent(Math.abs(returnPercent))}
            </div>
            <div style={{fontSize:'11px',color:'var(--gray-500)',marginTop:'4px'}}>
              {returnAmount>=0?'+':''}{formatCurrency(returnAmount)}
            </div>
          </div>
        </div>
        <div style={{marginTop:'12px',fontSize:'var(--text-xs)',color:'var(--gray-500)'}}>
          Cash: <strong style={{color:'var(--text-primary)'}}>{formatCurrency(cash)}</strong>
        </div>
        {(holdings.filter(h=>h.shares>0).length > 0 || livePositions.length > 0) && (() => {
          const stockUnrealized = holdings.filter(h=>h.shares>0).reduce((sum, h) => {
            const cur = prices[h.ticker] || h.avgPrice || 0;
            return sum + (cur - h.avgPrice) * h.shares;
          }, 0);
          const futuresUnrealized = livePositions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
          const totalUnrealized = stockUnrealized + futuresUnrealized;
          return (
            <div style={{marginTop:'4px',fontSize:'var(--text-xs)',color:'var(--gray-500)'}}>
              Unrealized P&L: <strong style={{color: totalUnrealized >= 0 ? 'var(--green)' : 'var(--red)'}}>
                {totalUnrealized >= 0 ? '+' : ''}{formatCurrency(totalUnrealized)}
              </strong>
            </div>
          );
        })()}
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:'20px'}}>
        {/* Positions */}
        <div>
          <div style={sectionHeader}>Positions ({holdings.filter(h=>h.shares>0).length})</div>
          {holdings.filter(h=>h.shares>0).length === 0 ? (
            <p style={{fontSize:'var(--text-xs)',color:'var(--gray-400)',textAlign:'center',padding:'16px 0'}}>No open positions. Start trading!</p>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              {holdings.filter(h=>h.shares>0).map(h => {
                const cur = prices[h.ticker] || h.avgPrice || 0;
                const unrealizedPL = (cur - h.avgPrice) * h.shares;
                const unrealizedPct = h.avgPrice > 0 ? ((cur - h.avgPrice) / h.avgPrice) * 100 : 0;
                const mktValue = h.shares * cur;
                const isProfit = unrealizedPL >= 0;
                return (
                  <div key={h.ticker} style={{
                    background: isProfit ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                    border: `1px solid ${isProfit ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    borderRadius:'var(--radius-md)',
                    padding:'10px 12px'
                  }}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                        <span style={{fontWeight:800,fontSize:'var(--text-sm)',color:'var(--text-primary)'}}>{h.ticker}</span>
                        <span style={{fontSize:'11px',color:'var(--gray-400)'}}>{h.shares} sh</span>
                      </div>
                      <span style={{fontWeight:800,fontSize:'var(--text-sm)',color: isProfit ? 'var(--green)' : 'var(--red)'}}>
                        {isProfit ? '+' : ''}{formatCurrency(unrealizedPL)}
                      </span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'4px',fontSize:'10px'}}>
                      <div>
                        <div style={{color:'var(--gray-400)',fontWeight:600,marginBottom:'1px'}}>ENTRY</div>
                        <div style={{fontWeight:600}}>{formatCurrency(h.avgPrice)}</div>
                      </div>
                      <div>
                        <div style={{color:'var(--gray-400)',fontWeight:600,marginBottom:'1px'}}>MARK</div>
                        <div style={{fontWeight:700,color: isProfit ? 'var(--green)' : 'var(--red)'}}>{formatCurrency(cur)}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{color:'var(--gray-400)',fontWeight:600,marginBottom:'1px'}}>P&L %</div>
                        <div style={{fontWeight:700,color: isProfit ? 'var(--green)' : 'var(--red)'}}>{isProfit ? '+' : ''}{unrealizedPct.toFixed(2)}%</div>
                      </div>
                    </div>
                    <div style={{marginTop:'6px',paddingTop:'6px',borderTop:`1px solid ${isProfit ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,display:'flex',justifyContent:'space-between',fontSize:'10px',color:'var(--gray-400)'}}>
                      <span>MKT VALUE</span>
                      <span style={{fontWeight:700,color:'var(--text-primary)'}}>{formatCurrency(mktValue)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Leveraged positions */}
        <div>
          <div style={sectionHeader}>Leveraged Positions {livePositions.length > 0 && `(${livePositions.length})`}</div>
          {livePositions.length === 0 ? (
            <p style={{fontSize:'var(--text-xs)',color:'var(--gray-400)',textAlign:'center',padding:'12px 0'}}>No open futures positions.</p>
          ) : livePositions.map(p => {
            const pnlColor = p.unrealizedPnL >= 0 ? 'var(--green)' : 'var(--red)';
            const pnlPct   = p.margin > 0 ? (p.unrealizedPnL / p.margin) * 100 : 0;
            return (
              <div key={p._id} style={{padding:'12px',background:'var(--gray-50)',borderRadius:'var(--radius-md)',marginBottom:'8px',border:`1px solid ${p.unrealizedPnL>=0?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.15)'}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <span style={{fontWeight:700,fontSize:'var(--text-sm)'}}>{p.ticker}</span>
                    <span style={{padding:'2px 8px',borderRadius:'var(--radius-sm)',fontSize:'10px',fontWeight:700,background: p.side==='Long'?'rgba(37,99,235,0.12)':'rgba(220,38,38,0.12)',color: p.side==='Long'?'#2563EB':'#DC2626'}}>{p.leverage}× {p.side}</span>
                  </div>
                  <span style={{fontWeight:700,fontSize:'var(--text-sm)',color:pnlColor}}>
                    {p.unrealizedPnL>=0?'+':''}{formatCurrency(p.unrealizedPnL)} ({pnlPct>=0?'+':''}{formatPercent(pnlPct)})
                  </span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'6px',marginBottom:'10px'}}>
                  {[
                    ['Entry', formatCurrency(p.entryPrice)],
                    ['Current', formatCurrency(p.currentPrice)],
                    ['Liq.', formatCurrency(p.liquidationPrice)],
                  ].map(([label, value]) => (
                    <div key={label} style={{textAlign:'center'}}>
                      <div style={{fontSize:'9px',color:'var(--gray-500)',fontWeight:600,textTransform:'uppercase'}}>{label}</div>
                      <div style={{fontSize:'11px',fontWeight:700,color: label==='Liq.' ? 'var(--red)' : 'inherit'}}>{value}</div>
                    </div>
                  ))}
                </div>
                <button
                  disabled={isLoading}
                  onClick={async () => {
                    const res = await closePosition(user?.id, p._id.toString(), currentContest?._id);
                    if (!res.success) alert(res.message);
                  }}
                  style={{width:'100%',padding:'6px',border:'var(--border-light)',borderRadius:'var(--radius-sm)',background:'white',fontSize:'11px',fontWeight:600,cursor:'pointer',color:'var(--gray-600)'}}>
                  Close Position
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
