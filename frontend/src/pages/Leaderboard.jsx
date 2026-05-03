import { useEffect } from 'react';
import { useLeaderboardStore } from '../store/leaderboardStore';
import { useAuthStore } from '../store/authStore';
import { BADGES } from '../lib/constants';
import { formatCurrency, formatPercentRaw } from '../lib/formatters';
import './Leaderboard.css';

export default function Leaderboard() {
  const entries = useLeaderboardStore((s) => s.entries);
  const period = useLeaderboardStore((s) => s.period);
  const setPeriod = useLeaderboardStore((s) => s.setPeriod);
  const userRank = useLeaderboardStore((s) => s.userRank);
  const loaded = useLeaderboardStore((s) => s.loaded);
  const fetchFromSupabase = useLeaderboardStore((s) => s.fetchFromSupabase);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchFromSupabase();
  }, []);

  const isEmpty = loaded && entries.length === 0;

  return (
    <div className="leaderboard-page" id="leaderboard-page">
      <div className="container" style={{paddingTop:'var(--sp-8)',paddingBottom:'var(--sp-8)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'var(--sp-6)',flexWrap:'wrap',gap:'16px'}}>
          <div>
            <h2>Leaderboard</h2>
            <p style={{color:'var(--gray-500)',marginTop:'4px'}}>Top traders ranked by performance</p>
          </div>
          <div style={{display:'flex',gap:'8px'}}>
            <div style={{display:'flex',gap:'4px',background:'var(--gray-100)',borderRadius:'var(--radius-md)',padding:'3px'}}>
              {['weekly','monthly','all-time'].map((p)=>(
                <button key={p} onClick={()=>setPeriod(p)} style={{padding:'6px 14px',borderRadius:'var(--radius-sm)',border:'none',fontSize:'var(--text-sm)',fontWeight:600,background:period===p?'var(--white)':'transparent',color:period===p?'var(--primary)':'var(--gray-500)',cursor:'pointer',boxShadow:period===p?'var(--shadow-xs)':'none',transition:'all 0.15s',textTransform:'capitalize'}}>
                  {p.replace('-',' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {isEmpty && (
          <div className="card" style={{padding:'60px 40px',textAlign:'center'}}>
            <div style={{fontSize:'64px',marginBottom:'16px'}}>🏆</div>
            <h3 style={{fontSize:'var(--text-xl)',fontWeight:700,marginBottom:'8px'}}>No Traders Yet</h3>
            <p style={{color:'var(--gray-500)',maxWidth:'400px',margin:'0 auto 24px',lineHeight:1.6}}>
              {user
                ? 'Start trading in the simulator to appear on the leaderboard! Your portfolio value and returns will be tracked automatically.'
                : 'Sign in and start trading to compete with other traders. Your performance will be tracked and ranked.'}
            </p>
            {!user && (
              <p style={{color:'var(--primary)',fontWeight:600,fontSize:'var(--text-sm)'}}>
                Sign in to get started →
              </p>
            )}
          </div>
        )}

        {/* User Rank Banner */}
        {userRank && (
          <div className="card" style={{padding:'16px 24px',marginBottom:'var(--sp-4)',background:'linear-gradient(135deg, #1B3BFC08, #8B5CF608)',border:'1px solid var(--primary)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
              <span style={{fontSize:'24px'}}>📊</span>
              <div>
                <p style={{fontWeight:700,fontSize:'var(--text-sm)'}}>Your Rank</p>
                <p style={{color:'var(--gray-500)',fontSize:'12px'}}>Keep trading to climb higher!</p>
              </div>
            </div>
            <span style={{fontSize:'var(--text-xl)',fontWeight:800,color:'var(--primary)'}}>#{userRank}</span>
          </div>
        )}

        {/* Top 3 Podium */}
        {entries.length >= 3 && (
          <div className="podium">
            {entries.slice(0, 3).map((e, i) => (
              <div key={e.rank} className={`podium__card podium__card--${i+1} ${e.userId && userRank === e.rank ? 'podium__card--you' : ''}`}>
                <div className="podium__medal">{['🥇','🥈','🥉'][i]}</div>
                <h4 className="podium__name">{e.name}</h4>
                <p className="podium__value">{formatCurrency(e.portfolio)}</p>
                <span className={`badge ${e.return>=0?'badge-green':'badge-red'}`}>{e.return>=0?'+':''}{e.return.toFixed(2)}%</span>
                <p style={{fontSize:'11px',color:'var(--gray-400)',marginTop:'4px'}}>{e.trades} trades</p>
              </div>
            ))}
          </div>
        )}

        {/* Full Table */}
        {entries.length > 0 && (
          <div className="card" style={{padding:0,marginTop:'var(--sp-6)'}}>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Rank</th><th>Trader</th><th>Portfolio Value</th><th>Return</th><th>Trades</th></tr></thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.rank} style={{background: userRank === e.rank ? 'var(--primary-bg)' : undefined}}>
                      <td><span style={{fontWeight:700,color:e.rank<=3?'var(--primary)':'var(--gray-600)'}}>{e.rank<=3?['🥇','🥈','🥉'][e.rank-1]:e.rank}</span></td>
                      <td style={{fontWeight:600}}>
                        {e.name}
                        {userRank === e.rank && <span className="badge badge-primary" style={{marginLeft:'8px',fontSize:'10px'}}>You</span>}
                      </td>
                      <td style={{fontWeight:600}}>{formatCurrency(e.portfolio)}</td>
                      <td><span style={{color:e.return>=0?'var(--green)':'var(--red)',fontWeight:600}}>{e.return>=0?'+':''}{e.return.toFixed(2)}%</span></td>
                      <td>{e.trades}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
