import { useNewsStore } from '../../store/newsStore';
import { formatRelativeTime } from '../../lib/formatters';
import NewsModal from '../shared/NewsModal';

export default function NewsPanel() {
  const newsItems = useNewsStore((s) => s.newsItems);
  const selectedNews = useNewsStore((s) => s.selectedNews);
  const setSelectedNews = useNewsStore((s) => s.setSelectedNews);
  const clearSelectedNews = useNewsStore((s) => s.clearSelectedNews);
  const display = newsItems.slice(0, 8);

  return (
    <>
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div style={{padding:'14px 16px',borderBottom:'var(--border-light)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <h5 style={{fontSize:'var(--text-sm)',fontWeight:700}}>📰 Market News</h5>
          <span className="badge badge-primary" style={{fontSize:'10px'}}>Live</span>
        </div>
        <div style={{maxHeight:'320px',overflowY:'auto'}}>
          {display.length === 0 ? (
            <p style={{padding:'20px',textAlign:'center',fontSize:'var(--text-sm)',color:'var(--gray-400)'}}>No news yet</p>
          ) : display.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedNews(item)}
              style={{padding:'10px 16px',borderBottom:'1px solid var(--gray-50)',cursor:'pointer',transition:'background 0.15s'}}
              onMouseEnter={(e)=>e.currentTarget.style.background='var(--gray-50)'}
              onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}
            >
              <div style={{display:'flex',alignItems:'flex-start',gap:'8px'}}>
                <span style={{fontSize:'14px',flexShrink:0,marginTop:'2px'}}>
                  {item.sentiment === 'positive' ? '📈' : item.sentiment === 'negative' ? '📉' : '📊'}
                </span>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:'12px',fontWeight:500,color:'var(--gray-800)',lineHeight:1.4,marginBottom:'4px'}}>{item.headline}</p>
                  <div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'11px',flexWrap:'wrap'}}>
                    {item.affectedTickers && item.affectedTickers.length > 0 && !item.isMarketWide && (
                      item.affectedTickers.slice(0, 3).map((t) => (
                        <span key={t} className={`badge ${item.sentiment==='positive'?'badge-green':'badge-red'}`} style={{fontSize:'10px'}}>{t}</span>
                      ))
                    )}
                    {item.isMarketWide && (
                      <span className="badge badge-gray" style={{fontSize:'10px'}}>Market-Wide</span>
                    )}
                    {item.source && item.source !== 'SoictStock Simulation' && (
                      <span style={{color:'var(--gray-500)',fontWeight:500}}>{item.source}</span>
                    )}
                    <span style={{color:'var(--gray-400)'}}>{formatRelativeTime(item.timestamp)}</span>
                  </div>
                </div>
                <span style={{fontSize:'10px',color:'var(--gray-300)',marginTop:'4px',flexShrink:0}}>▸</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* News Detail Modal */}
      <NewsModal item={selectedNews} onClose={clearSelectedNews} />
    </>
  );
}
