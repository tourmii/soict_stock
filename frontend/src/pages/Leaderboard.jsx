import { useState } from 'react';
import { useLeaderboardStore } from '../store/leaderboardStore';
import { BADGES } from '../lib/constants';
import { formatCurrency, formatPercentRaw } from '../lib/formatters';
import './Leaderboard.css';

export default function Leaderboard() {
  const entries = useLeaderboardStore((s) => s.entries);
  const period = useLeaderboardStore((s) => s.period);
  const setPeriod = useLeaderboardStore((s) => s.setPeriod);

  const [showBadges, setShowBadges] = useState(false);

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
            <button onClick={()=>setShowBadges(!showBadges)} className="btn btn-outline btn-sm">🏅 Badges</button>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="podium">
          {entries.slice(0, 3).map((e, i) => (
            <div key={e.rank} className={`podium__card podium__card--${i+1}`}>
              <div className="podium__medal">{['🥇','🥈','🥉'][i]}</div>
              <h4 className="podium__name">{e.name}</h4>
              <p className="podium__value">{formatCurrency(e.portfolio)}</p>
              <span className={`badge ${e.return>=0?'badge-green':'badge-red'}`}>{e.return>=0?'+':''}{e.return.toFixed(2)}%</span>
              <p style={{fontSize:'11px',color:'var(--gray-400)',marginTop:'4px'}}>Sharpe: {e.sharpe.toFixed(2)}</p>
            </div>
          ))}
        </div>

        {/* Full Table */}
        <div className="card" style={{padding:0,marginTop:'var(--sp-6)'}}>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Rank</th><th>Trader</th><th>Portfolio Value</th><th>Return</th><th>Sharpe Ratio</th><th>Trades</th><th>Badge</th></tr></thead>
              <tbody>
                {entries.map((e) => {
                  const badge = BADGES.find((b) => b.id === e.badge);
                  return (
                    <tr key={e.rank}>
                      <td><span style={{fontWeight:700,color:e.rank<=3?'var(--primary)':'var(--gray-600)'}}>{e.rank<=3?['🥇','🥈','🥉'][e.rank-1]:e.rank}</span></td>
                      <td style={{fontWeight:600}}>{e.name}</td>
                      <td style={{fontWeight:600}}>{formatCurrency(e.portfolio)}</td>
                      <td><span style={{color:e.return>=0?'var(--green)':'var(--red)',fontWeight:600}}>{e.return>=0?'+':''}{e.return.toFixed(2)}%</span></td>
                      <td>{e.sharpe.toFixed(2)}</td>
                      <td>{e.trades}</td>
                      <td>{badge ? <span title={badge.description}>{badge.icon} {badge.name}</span> : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Badges Section */}
        {showBadges && (
          <div style={{marginTop:'var(--sp-8)'}}>
            <h3 style={{marginBottom:'var(--sp-4)'}}>🏅 Achievement Badges</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'var(--sp-4)'}}>
              {BADGES.map((badge)=>(
                <div key={badge.id} className="card" style={{padding:'20px',textAlign:'center',opacity:0.6}}>
                  <div style={{fontSize:'36px',marginBottom:'8px'}}>{badge.icon}</div>
                  <h5 style={{fontSize:'var(--text-base)',fontWeight:700,marginBottom:'4px'}}>{badge.name}</h5>
                  <p style={{fontSize:'var(--text-xs)',color:'var(--gray-500)'}}>{badge.description}</p>
                  <span className="badge badge-gray" style={{marginTop:'8px',fontSize:'10px'}}>🔒 Locked</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
