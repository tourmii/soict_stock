import { useState, useMemo } from 'react';
import { useMarketStore } from '../../store/marketStore';
import { STOCKS } from '../../lib/constants';
import { formatCurrency, formatPercentRaw } from '../../lib/formatters';
import SparklineChart from '../shared/SparklineChart';

export default function Watchlist() {
  const [tab, setTab] = useState('watchlist');
  const prices = useMarketStore((s) => s.prices);
  const histories = useMarketStore((s) => s.histories);
  const watchlist = useMarketStore((s) => s.watchlist);
  const getChange = useMarketStore((s) => s.getChange);
  const setSelectedTicker = useMarketStore((s) => s.setSelectedTicker);
  const selectedTicker = useMarketStore((s) => s.selectedTicker);
  const addToWatchlist = useMarketStore((s) => s.addToWatchlist);

  const displayStocks = useMemo(() => {
    const tickers = tab === 'watchlist' ? watchlist : STOCKS.map((s) => s.ticker);
    return tickers.map((t) => {
      const stock = STOCKS.find((s) => s.ticker === t);
      const { change, changePercent } = getChange(t);
      const spark = (histories[t] || []).slice(-20).map((h) => h.close);
      return { ...stock, price: prices[t], change, changePercent, sparkline: spark };
    });
  }, [tab, watchlist, prices, histories]);

  const otherStocks = STOCKS.filter((s) => !watchlist.includes(s.ticker));

  return (
    <div className="card" style={{padding:0,overflow:'hidden'}}>
      <div style={{display:'flex',borderBottom:'var(--border-light)'}}>
        <button onClick={()=>setTab('watchlist')} style={{flex:1,padding:'10px',fontSize:'var(--text-sm)',fontWeight:600,color:tab==='watchlist'?'var(--primary)':'var(--gray-500)',borderBottom:tab==='watchlist'?'2px solid var(--primary)':'2px solid transparent',background:'transparent',cursor:'pointer',transition:'all 0.15s'}}>My Watchlist</button>
        <button onClick={()=>setTab('movers')} style={{flex:1,padding:'10px',fontSize:'var(--text-sm)',fontWeight:600,color:tab==='movers'?'var(--primary)':'var(--gray-500)',borderBottom:tab==='movers'?'2px solid var(--primary)':'2px solid transparent',background:'transparent',cursor:'pointer',transition:'all 0.15s'}}>Top Movers</button>
      </div>
      <div style={{maxHeight:'360px',overflowY:'auto'}}>
        {displayStocks.map((s) => (
          <div key={s.ticker} onClick={()=>setSelectedTicker(s.ticker)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',cursor:'pointer',background:selectedTicker===s.ticker?'var(--primary-bg)':'transparent',borderLeft:selectedTicker===s.ticker?'3px solid var(--primary)':'3px solid transparent',transition:'all 0.15s',borderBottom:'1px solid var(--gray-50)'}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                <span style={{fontWeight:700,fontSize:'var(--text-sm)',color:s.color}}>{s.ticker}</span>
                <span style={{fontSize:'11px',color:'var(--gray-400)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</span>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <SparklineChart data={s.sparkline} color={s.changePercent>=0?'#22C55E':'#EF4444'} width={44} height={20}/>
              <div style={{textAlign:'right',minWidth:'70px'}}>
                <div style={{fontSize:'var(--text-sm)',fontWeight:600}}>{formatCurrency(s.price)}</div>
                <div style={{fontSize:'11px',fontWeight:600,color:s.changePercent>=0?'var(--green)':'var(--red)'}}>
                  {s.changePercent>=0?'+':''}{s.changePercent.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {tab === 'watchlist' && otherStocks.length > 0 && (
        <div style={{padding:'8px 14px',borderTop:'var(--border-light)'}}>
          <select onChange={(e)=>{if(e.target.value)addToWatchlist(e.target.value);e.target.value='';}} className="input select" style={{padding:'6px 10px',fontSize:'var(--text-xs)'}}>
            <option value="">+ Add to Watchlist</option>
            {otherStocks.map((s)=>(<option key={s.ticker} value={s.ticker}>{s.ticker} — {s.name}</option>))}
          </select>
        </div>
      )}
    </div>
  );
}
