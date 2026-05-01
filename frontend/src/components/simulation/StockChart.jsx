import { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { useMarketStore } from '../../store/marketStore';
import { STOCKS, TIMEFRAMES } from '../../lib/constants';
import { formatCurrency, formatPercentRaw } from '../../lib/formatters';

export default function StockChart() {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  const selectedTicker = useMarketStore((s) => s.selectedTicker);
  const histories = useMarketStore((s) => s.histories);
  const prices = useMarketStore((s) => s.prices);
  const getChange = useMarketStore((s) => s.getChange);
  const setSelectedTicker = useMarketStore((s) => s.setSelectedTicker);

  const [timeframe, setTimeframe] = useState('1Y');
  const stock = STOCKS.find((s) => s.ticker === selectedTicker);
  const { change, changePercent } = getChange(selectedTicker);

  const filteredHistory = useMemo(() => {
    const all = histories[selectedTicker] || [];
    const now = Math.floor(Date.now() / 1000);
    const ranges = { '1D': 86400, '1W': 604800, '1M': 2592000, '3M': 7776000, '1Y': 31536000, 'All': Infinity };
    const cutoff = now - (ranges[timeframe] || Infinity);
    return all.filter((bar) => bar.time >= cutoff);
  }, [selectedTicker, histories, timeframe]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 380,
      layout: { background: { color: '#ffffff' }, textColor: '#6B7280', fontFamily: 'DM Sans' },
      grid: { vertLines: { color: '#F3F4F6' }, horzLines: { color: '#F3F4F6' } },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: '#E5E7EB', scaleMargins: { top: 0.1, bottom: 0.25 } },
      timeScale: { borderColor: '#E5E7EB', timeVisible: true },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22C55E', downColor: '#EF4444', borderUpColor: '#22C55E', borderDownColor: '#EF4444',
      wickUpColor: '#22C55E', wickDownColor: '#EF4444',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

    const candles = filteredHistory.map((bar) => ({
      time: bar.time, open: bar.open, high: bar.high, low: bar.low, close: bar.close,
    }));

    const volumes = filteredHistory.map((bar) => ({
      time: bar.time, value: bar.volume,
      color: bar.close >= bar.open ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
    }));

    candleSeriesRef.current.setData(candles);
    volumeSeriesRef.current.setData(volumes);

    if (chartRef.current) chartRef.current.timeScale().fitContent();
  }, [filteredHistory]);

  return (
    <div className="card" style={{padding:0,overflow:'hidden'}}>
      <div style={{padding:'16px 20px',borderBottom:'var(--border-light)',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'12px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <select value={selectedTicker} onChange={(e)=>setSelectedTicker(e.target.value)} className="input select" style={{width:'auto',padding:'6px 30px 6px 10px',fontWeight:600,fontSize:'var(--text-sm)'}}>
            {STOCKS.map((s)=>(<option key={s.ticker} value={s.ticker}>{s.ticker} — {s.name}</option>))}
          </select>
          <div>
            <span style={{fontSize:'var(--text-xl)',fontWeight:700}}>{formatCurrency(prices[selectedTicker])}</span>
            <span className={`badge ${changePercent>=0?'badge-green':'badge-red'}`} style={{marginLeft:'8px',fontSize:'11px'}}>
              {changePercent>=0?'↑':'↓'} {formatPercentRaw(Math.abs(changePercent))}
            </span>
          </div>
        </div>
        <div style={{display:'flex',gap:'4px',background:'var(--gray-100)',borderRadius:'var(--radius-md)',padding:'3px'}}>
          {TIMEFRAMES.map((tf)=>(
            <button key={tf} onClick={()=>setTimeframe(tf)} style={{padding:'4px 10px',fontSize:'12px',fontWeight:600,borderRadius:'var(--radius-sm)',border:'none',background:timeframe===tf?'var(--white)':'transparent',color:timeframe===tf?'var(--primary)':'var(--gray-500)',cursor:'pointer',boxShadow:timeframe===tf?'var(--shadow-xs)':'none',transition:'all 0.15s'}}>
              {tf}
            </button>
          ))}
        </div>
      </div>
      <div ref={chartContainerRef} style={{width:'100%'}}/>
    </div>
  );
}
