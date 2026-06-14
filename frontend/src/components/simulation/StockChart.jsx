import { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { useMarketStore } from '../../store/marketStore';
import { TIMEFRAMES } from '../../lib/constants';
import { SMA, EMA, BollingerBands } from '../../lib/indicators';

const INDICATORS = [
  { key: 'ma20',  label: 'MA 20',  color: '#F59E0B' },
  { key: 'ma50',  label: 'MA 50',  color: '#8B5CF6' },
  { key: 'ema12', label: 'EMA 12', color: '#06B6D4' },
  { key: 'ema26', label: 'EMA 26', color: '#EC4899' },
  { key: 'bb',    label: 'BB 20',  color: '#22C55E' },
];

const MAX_BARS = {
  '15m': 500, '1H': 500, '4H': 500, '1D': 365, '1W': 52, '1M': 12,
};

const LONG_TF = new Set(['4H', '1D', '1W', '1M']);

export default function StockChart() {
  const chartContainerRef = useRef(null);
  const chartRef          = useRef(null);
  const candleSeriesRef   = useRef(null);
  const volumeSeriesRef   = useRef(null);
  const indSeriesRef      = useRef({});

  // Refs used for structural-change detection (do not trigger re-renders)
  const prevTickerRef    = useRef(null);
  const prevTimeframeRef = useRef(null);
  const prevBarCountRef  = useRef(0);
  const prevFirstTimeRef = useRef(null);

  const selectedTicker       = useMarketStore((s) => s.selectedTicker);
  const rawTicks             = useMarketStore((s) => s.rawTicks);
  const historicalOHLCV      = useMarketStore((s) => s.historicalOHLCV);
  const getOHLCVWithHistory  = useMarketStore((s) => s.getOHLCVWithHistory);
  const fetchHistoricalOHLCV = useMarketStore((s) => s.fetchHistoricalOHLCV);

  const [timeframe, setTimeframe] = useState('1D');
  const [activeInd, setActiveInd] = useState({});
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  // Fetch REST data when switching to a long timeframe; track loading state
  useEffect(() => {
    if (!LONG_TF.has(timeframe)) {
      setIsFetchingHistory(false);
      return;
    }
    const key = `${selectedTicker}_${timeframe}`;
    if (!historicalOHLCV[key]) {
      setIsFetchingHistory(true);
      fetchHistoricalOHLCV(selectedTicker, timeframe);
    } else {
      setIsFetchingHistory(false);
    }
  }, [selectedTicker, timeframe, historicalOHLCV]);

  const ohlcvBars = useMemo(
    () => getOHLCVWithHistory(selectedTicker, timeframe),
    [selectedTicker, rawTicks, historicalOHLCV, timeframe]
  );

  const displayBars = useMemo(
    () => ohlcvBars.slice(-(MAX_BARS[timeframe] || 500)),
    [ohlcvBars, timeframe]
  );

  // ── Create chart once ─────────────────────────────────────────────
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      autoSize: true,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#6B7280',
        fontFamily: 'DM Sans, sans-serif',
      },
      grid: {
        vertLines: { color: '#F3F4F6' },
        horzLines: { color: '#F3F4F6' },
      },
      crosshair: { mode: 0 },
      rightPriceScale: {
        borderColor: '#E5E7EB',
        scaleMargins: { top: 0.08, bottom: 0.22 },
      },
      timeScale: {
        borderColor: '#E5E7EB',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22C55E', downColor: '#EF4444',
      borderUpColor: '#22C55E', borderDownColor: '#EF4444',
      wickUpColor: '#22C55E', wickDownColor: '#EF4444',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    chartRef.current        = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    return () => { chart.remove(); };
  }, []);

  // ── Unified chart update: structural reload OR incremental tick ───
  //
  // A "structural" change (setData + fitContent + indicator rebuild) happens when:
  //   • ticker changed          • timeframe changed
  //   • bar count changed       • first bar's time changed (REST data replaced rawTick-only data)
  //
  // Everything else is a real-time tick → update() just the last candle.
  // This covers ALL timeframes including 4H/1D/1W/1M so the chart always stays live.
  useEffect(() => {
    const cs = candleSeriesRef.current;
    const vs = volumeSeriesRef.current;
    const ch = chartRef.current;
    if (!cs || !vs || !ch || displayBars.length === 0) return;

    const tickerChanged   = prevTickerRef.current    !== selectedTicker;
    const tfChanged       = prevTimeframeRef.current !== timeframe;
    const countChanged    = displayBars.length       !== prevBarCountRef.current;
    const firstTimeChanged = displayBars[0]?.time   !== prevFirstTimeRef.current;
    const isFirstRender   = prevTickerRef.current === null;

    const structural = isFirstRender || tickerChanged || tfChanged || countChanged || firstTimeChanged;

    if (structural) {
      clearIndicators();

      cs.setData(displayBars.map((b) => ({
        time: b.time, open: b.open, high: b.high, low: b.low, close: b.close,
      })));
      vs.setData(displayBars.map((b) => ({
        time: b.time, value: b.volume,
        color: b.close >= b.open ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
      })));

      ch.timeScale().fitContent();
      applyIndicators(displayBars, activeInd);

      prevTickerRef.current    = selectedTicker;
      prevTimeframeRef.current = timeframe;
      prevBarCountRef.current  = displayBars.length;
      prevFirstTimeRef.current = displayBars[0]?.time ?? null;
    } else {
      // Incremental: update the last (in-progress) candle in real-time
      const last = displayBars[displayBars.length - 1];
      cs.update({ time: last.time, open: last.open, high: last.high, low: last.low, close: last.close });
      vs.update({
        time: last.time, value: last.volume,
        color: last.close >= last.open ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
      });
    }
  }, [selectedTicker, timeframe, displayBars]);

  // ── Rebuild indicators when toggled ──────────────────────────────
  useEffect(() => {
    if (!chartRef.current || displayBars.length === 0) return;
    clearIndicators();
    applyIndicators(displayBars, activeInd);
  }, [activeInd]);

  // ── Indicator helpers ────────────────────────────────────────────
  function clearIndicators() {
    if (!chartRef.current) return;
    for (const s of Object.values(indSeriesRef.current)) {
      if (s) try { chartRef.current.removeSeries(s); } catch {}
    }
    indSeriesRef.current = {};
  }

  function applyIndicators(bars, active) {
    if (!chartRef.current || bars.length === 0) return;
    const closes = bars.map((b) => b.close);
    const toLine  = (vals) =>
      bars.map((b, i) => (vals[i] != null ? { time: b.time, value: vals[i] } : null)).filter(Boolean);

    if (active.ma20) {
      const s = chartRef.current.addSeries(LineSeries, { color: '#F59E0B', lineWidth: 1 });
      s.setData(toLine(SMA(closes, 20)));
      indSeriesRef.current.ma20 = s;
    }
    if (active.ma50) {
      const s = chartRef.current.addSeries(LineSeries, { color: '#8B5CF6', lineWidth: 1 });
      s.setData(toLine(SMA(closes, 50)));
      indSeriesRef.current.ma50 = s;
    }
    if (active.ema12) {
      const s = chartRef.current.addSeries(LineSeries, { color: '#06B6D4', lineWidth: 1 });
      s.setData(toLine(EMA(closes, 12)));
      indSeriesRef.current.ema12 = s;
    }
    if (active.ema26) {
      const s = chartRef.current.addSeries(LineSeries, { color: '#EC4899', lineWidth: 1 });
      s.setData(toLine(EMA(closes, 26)));
      indSeriesRef.current.ema26 = s;
    }
    if (active.bb) {
      const { upper, middle, lower } = BollingerBands(closes, 20, 2);
      const up  = chartRef.current.addSeries(LineSeries, { color: '#22C55E', lineWidth: 1, lineStyle: 1 });
      const mid = chartRef.current.addSeries(LineSeries, { color: '#22C55E', lineWidth: 1 });
      const lo  = chartRef.current.addSeries(LineSeries, { color: '#22C55E', lineWidth: 1, lineStyle: 1 });
      up.setData(toLine(upper));
      mid.setData(toLine(middle));
      lo.setData(toLine(lower));
      indSeriesRef.current.bb_up  = up;
      indSeriesRef.current.bb_mid = mid;
      indSeriesRef.current.bb_lo  = lo;
    }
  }

  const toggleInd = (key) => setActiveInd((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="chart-toolbar">
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {INDICATORS.map((ind) => (
            <button
              key={ind.key}
              onClick={() => toggleInd(ind.key)}
              className={`indicator-btn ${activeInd[ind.key] ? 'active' : ''}`}
              style={{ '--ind-color': ind.color }}
            >
              {ind.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`tf-btn ${timeframe === tf ? 'active' : ''}`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
        {isFetchingHistory && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, borderRadius: '8px', backdropFilter: 'blur(2px)'
          }}>
            <div style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid var(--gray-200)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Loading {timeframe} history…</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
