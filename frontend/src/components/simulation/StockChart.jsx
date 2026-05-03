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
  const prevTickerRef = useRef(null);
  const prevTimeframeRef = useRef(null);
  const lastBarCountRef = useRef(0);

  const selectedTicker = useMarketStore((s) => s.selectedTicker);
  const rawTicks = useMarketStore((s) => s.rawTicks);
  const prices = useMarketStore((s) => s.prices);
  const getChange = useMarketStore((s) => s.getChange);
  const setSelectedTicker = useMarketStore((s) => s.setSelectedTicker);
  const getOHLCV = useMarketStore((s) => s.getOHLCV);

  const [timeframe, setTimeframe] = useState('1D');
  const stock = STOCKS.find((s) => s.ticker === selectedTicker);
  const { change, changePercent } = getChange(selectedTicker);

  // Aggregate raw ticks into OHLCV bars for the selected timeframe
  const ohlcvBars = useMemo(() => {
    return getOHLCV(selectedTicker, timeframe);
  }, [selectedTicker, rawTicks, timeframe, getOHLCV]);

  // Determine how many bars to display based on timeframe
  const displayBars = useMemo(() => {
    // Show a reasonable number of bars for each timeframe
    const maxBars = {
      '15m': 200,  // ~2 days of 15m candles
      '1H': 200,   // ~8 days of hourly candles
      '4H': 200,   // ~33 days of 4H candles
      '1D': 365,   // 1 year of daily candles
      '1W': 104,   // 2 years of weekly candles
      '1M': 60,    // 5 years of monthly candles
    };
    const max = maxBars[timeframe] || 200;
    return ohlcvBars.slice(-max);
  }, [ohlcvBars, timeframe]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 380,
      layout: { background: { color: '#ffffff' }, textColor: '#6B7280', fontFamily: 'DM Sans' },
      grid: { vertLines: { color: '#F3F4F6' }, horzLines: { color: '#F3F4F6' } },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: '#E5E7EB', scaleMargins: { top: 0.1, bottom: 0.25 } },
      timeScale: { borderColor: '#E5E7EB', timeVisible: true, secondsVisible: false },
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

  /* Full data reset — only when ticker or timeframe changes */
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

    const tickerChanged = prevTickerRef.current !== selectedTicker;
    const timeframeChanged = prevTimeframeRef.current !== timeframe;

    if (tickerChanged || timeframeChanged || prevTickerRef.current === null) {
      const candles = displayBars.map((bar) => ({
        time: bar.time, open: bar.open, high: bar.high, low: bar.low, close: bar.close,
      }));
      const volumes = displayBars.map((bar) => ({
        time: bar.time, value: bar.volume,
        color: bar.close >= bar.open ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
      }));

      candleSeriesRef.current.setData(candles);
      volumeSeriesRef.current.setData(volumes);
      lastBarCountRef.current = displayBars.length;

      if (chartRef.current) chartRef.current.timeScale().fitContent();

      prevTickerRef.current = selectedTicker;
      prevTimeframeRef.current = timeframe;
    }
  }, [selectedTicker, timeframe, displayBars]);

  /* Incremental update — preserves zoom when only price data changes */
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;
    if (prevTickerRef.current !== selectedTicker) return;

    const len = displayBars.length;
    if (len === 0) return;

    const lastBar = displayBars[len - 1];

    // Update the latest candle in-place (no zoom reset)
    candleSeriesRef.current.update({
      time: lastBar.time, open: lastBar.open, high: lastBar.high, low: lastBar.low, close: lastBar.close,
    });
    volumeSeriesRef.current.update({
      time: lastBar.time, value: lastBar.volume,
      color: lastBar.close >= lastBar.open ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
    });

    // If a brand-new bar was added, update full data
    if (len > lastBarCountRef.current) {
      const candles = displayBars.map((bar) => ({
        time: bar.time, open: bar.open, high: bar.high, low: bar.low, close: bar.close,
      }));
      const volumes = displayBars.map((bar) => ({
        time: bar.time, value: bar.volume,
        color: bar.close >= bar.open ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
      }));
      candleSeriesRef.current.setData(candles);
      volumeSeriesRef.current.setData(volumes);
      lastBarCountRef.current = len;
    }
  }, [displayBars]);

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
