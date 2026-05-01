import { useNewsStore } from '../../store/newsStore';
import { formatRelativeTime } from '../../lib/formatters';

export default function NewsPanel() {
  const newsItems = useNewsStore((s) => s.newsItems);
  const display = newsItems.slice(0, 6);

  return (
    <div className="card" style={{padding:0,overflow:'hidden'}}>
      <div style={{padding:'14px 16px',borderBottom:'var(--border-light)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <h5 style={{fontSize:'var(--text-sm)',fontWeight:700}}>📰 Market News</h5>
        <span className="badge badge-primary" style={{fontSize:'10px'}}>Live</span>
      </div>
      <div style={{maxHeight:'280px',overflowY:'auto'}}>
        {display.length === 0 ? (
          <p style={{padding:'20px',textAlign:'center',fontSize:'var(--text-sm)',color:'var(--gray-400)'}}>No news yet</p>
        ) : display.map((item) => (
          <div key={item.id} style={{padding:'10px 16px',borderBottom:'1px solid var(--gray-50)',cursor:'pointer',transition:'background 0.15s'}} onMouseEnter={(e)=>e.currentTarget.style.background='var(--gray-50)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
            <div style={{display:'flex',alignItems:'flex-start',gap:'8px'}}>
              <span style={{fontSize:'14px',flexShrink:0,marginTop:'2px'}}>
                {item.sentiment === 'positive' ? '📈' : item.sentiment === 'negative' ? '📉' : '📊'}
              </span>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:'12px',fontWeight:500,color:'var(--gray-800)',lineHeight:1.4,marginBottom:'4px'}}>{item.headline}</p>
                <div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'11px'}}>
                  {item.ticker && <span className={`badge ${item.sentiment==='positive'?'badge-green':'badge-red'}`} style={{fontSize:'10px'}}>{item.ticker}</span>}
                  <span style={{color:'var(--gray-400)'}}>{formatRelativeTime(item.timestamp)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
