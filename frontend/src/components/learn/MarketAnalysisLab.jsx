import { useState, useMemo } from 'react';
import { useMarketStore } from '../../store/marketStore';
import { STOCKS } from '../../lib/constants';
import { SMA, EMA, RSI, MACD, BollingerBands } from '../../lib/indicators';
import { formatCurrency } from '../../lib/formatters';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

export default function MarketAnalysisLab() {
  const [ticker, setTicker] = useState('SCT');
  const [activeIndicator, setActiveIndicator] = useState('overview');
  const getHistories = useMarketStore((s) => s.getHistories);
  const prices = useMarketStore((s) => s.prices);
  const histories = useMemo(() => getHistories(), [prices]);
  const history = useMemo(() => histories[ticker] || [], [histories, ticker]);
  const closePrices = useMemo(() => history.map((h) => h.close), [history]);
  const stock = STOCKS.find((s) => s.ticker === ticker);

  const analysis = useMemo(() => {
    if (closePrices.length < 30) return null;
    const sma20 = SMA(closePrices, 20);
    const sma50 = SMA(closePrices, 50);
    const sma200 = SMA(closePrices, 200);
    const rsi = RSI(closePrices);
    const macd = MACD(closePrices);
    const bb = BollingerBands(closePrices);
    const li = closePrices.length - 1;
    const cp = closePrices[li];
    const cRSI = rsi[li];
    const cMACD = macd.macd[li];
    const cSig = macd.signal[li];
    const bU = bb.upper[li], bL = bb.lower[li];
    const s20 = sma20[li], s50 = sma50[li], s200 = sma200[li];

    let trend = 'Sideways', trendColor = '#F59E0B';
    if (s50 && s200) {
      if (cp > s50 && s50 > s200) { trend = 'Uptrend'; trendColor = '#22C55E'; }
      else if (cp < s50 && s50 < s200) { trend = 'Downtrend'; trendColor = '#EF4444'; }
    }
    const r60 = closePrices.slice(-60);
    const support = Math.min(...r60), resistance = Math.max(...r60);
    let rsiSignal = 'Neutral', rsiColor = '#6B7280';
    if (cRSI > 70) { rsiSignal = 'Overbought'; rsiColor = '#EF4444'; }
    else if (cRSI < 30) { rsiSignal = 'Oversold'; rsiColor = '#22C55E'; }
    let macdSignal = 'Neutral', macdColor = '#6B7280';
    if (cMACD && cSig) {
      if (cMACD > cSig) { macdSignal = 'Bullish'; macdColor = '#22C55E'; }
      else { macdSignal = 'Bearish'; macdColor = '#EF4444'; }
    }
    let bbPosition = 'Middle', bbColor = '#6B7280';
    if (bU && bL) {
      const rel = (cp - bL) / (bU - bL);
      if (rel > 0.8) { bbPosition = 'Near Upper'; bbColor = '#EF4444'; }
      else if (rel < 0.2) { bbPosition = 'Near Lower'; bbColor = '#22C55E'; }
    }
    const chartData = history.slice(-90).map((h, i) => {
      const idx = closePrices.length - 90 + i;
      return { time: i, price: h.close, sma20: sma20[idx], sma50: sma50[idx], rsi: rsi[idx], macd: macd.macd[idx], signal: macd.signal[idx], bbUpper: bb.upper[idx], bbLower: bb.lower[idx], bbMiddle: bb.middle[idx], volume: h.volume };
    });
    return { trend, trendColor, cp, support, resistance, cRSI, rsiSignal, rsiColor, cMACD, cSig, macdSignal, macdColor, bU, bL, bbPosition, bbColor, s20, s50, s200, chartData };
  }, [closePrices, history]);

  const indicators = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'sma', label: 'Moving Avg', icon: '📈' },
    { id: 'rsi', label: 'RSI', icon: '⚡' },
    { id: 'macd', label: 'MACD', icon: '📉' },
    { id: 'bb', label: 'Bollinger', icon: '🎯' },
  ];

  if (!analysis) return <div className="lab-empty"><span style={{fontSize:'48px'}}>📊</span><p>Not enough data. Wait for more price history.</p></div>;

  return (
    <div className="market-lab">
      <div className="lab-header">
        <div className="lab-header__left">
          <select value={ticker} onChange={(e) => setTicker(e.target.value)} className="lab-select">
            {STOCKS.map((s) => <option key={s.ticker} value={s.ticker}>{s.ticker} — {s.name}</option>)}
          </select>
          <span className="lab-price__value">{formatCurrency(prices[ticker])}</span>
          <span className="lab-trend-badge" style={{background:`${analysis.trendColor}15`,color:analysis.trendColor}}>
            {analysis.trend === 'Uptrend' ? '↑' : analysis.trend === 'Downtrend' ? '↓' : '→'} {analysis.trend}
          </span>
        </div>
        <div className="lab-indicators-nav">
          {indicators.map((ind) => <button key={ind.id} className={`lab-ind-btn ${activeIndicator===ind.id?'lab-ind-btn--active':''}`} onClick={()=>setActiveIndicator(ind.id)}><span>{ind.icon}</span> {ind.label}</button>)}
        </div>
      </div>

      {activeIndicator === 'overview' && (
        <div className="lab-overview">
          <div className="lab-signals">
            {[
              { label: 'Trend', value: analysis.trend, color: analysis.trendColor, detail: 'SMA-50 vs SMA-200' },
              { label: `RSI (${analysis.cRSI?.toFixed(1)})`, value: analysis.rsiSignal, color: analysis.rsiColor, detail: '14-period' },
              { label: 'MACD', value: analysis.macdSignal, color: analysis.macdColor, detail: '12/26/9' },
              { label: 'Bollinger', value: analysis.bbPosition, color: analysis.bbColor, detail: '20-period, 2 SD' },
              { label: 'Support', value: formatCurrency(analysis.support), color: '#22C55E', detail: '60-day low' },
              { label: 'Resistance', value: formatCurrency(analysis.resistance), color: '#EF4444', detail: '60-day high' },
            ].map((s, i) => (
              <div key={i} className="lab-signal-card">
                <div className="lab-signal-card__label">{s.label}</div>
                <div className="lab-signal-card__value" style={{color:s.color}}>{s.value}</div>
                <div className="lab-signal-card__detail">{s.detail}</div>
              </div>
            ))}
          </div>
          <div className="lab-chart-area">
            <h5 className="lab-chart-title">Price with Support/Resistance</h5>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={analysis.chartData}>
                <defs><linearGradient id="labPG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={stock.color} stopOpacity={0.15}/><stop offset="100%" stopColor={stock.color} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
                <XAxis dataKey="time" hide/>
                <YAxis domain={['auto','auto']} tickFormatter={(v)=>`$${v.toFixed(0)}`} width={55} axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#6B7280'}}/>
                <Tooltip formatter={(v)=>formatCurrency(v)} labelFormatter={()=>''}/>
                <ReferenceLine y={analysis.support} stroke="#22C55E" strokeDasharray="5 5"/>
                <ReferenceLine y={analysis.resistance} stroke="#EF4444" strokeDasharray="5 5"/>
                <Area type="monotone" dataKey="price" stroke={stock.color} strokeWidth={2} fill="url(#labPG)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeIndicator === 'sma' && (
        <div className="lab-chart-area">
          <h5 className="lab-chart-title">Moving Averages</h5>
          <div className="lab-chart-legend">
            <span><span className="legend-dot" style={{background:stock.color}}/> Price</span>
            <span><span className="legend-dot" style={{background:'#F59E0B'}}/> SMA-20</span>
            <span><span className="legend-dot" style={{background:'#8B5CF6'}}/> SMA-50</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analysis.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
              <XAxis dataKey="time" hide/>
              <YAxis domain={['auto','auto']} tickFormatter={(v)=>`$${v.toFixed(0)}`} width={55} axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#6B7280'}}/>
              <Tooltip formatter={(v)=>v!==null?formatCurrency(v):'N/A'} labelFormatter={()=>''}/>
              <Line type="monotone" dataKey="price" stroke={stock.color} strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="sma20" stroke="#F59E0B" strokeWidth={1.5} dot={false} strokeDasharray="4 2"/>
              <Line type="monotone" dataKey="sma50" stroke="#8B5CF6" strokeWidth={1.5} dot={false} strokeDasharray="4 2"/>
            </LineChart>
          </ResponsiveContainer>
          <div className="lab-insight"><strong>📖</strong> {analysis.s50 > analysis.s200 ? 'SMA-50 above SMA-200 — Golden Cross (bullish).' : 'SMA-50 below SMA-200 — Death Cross (bearish).'}</div>
        </div>
      )}

      {activeIndicator === 'rsi' && (
        <div className="lab-chart-area">
          <h5 className="lab-chart-title">RSI (14-Period) — {analysis.rsiSignal}</h5>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analysis.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
              <XAxis dataKey="time" hide/>
              <YAxis domain={[0,100]} ticks={[0,30,50,70,100]} width={35} axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#6B7280'}}/>
              <Tooltip formatter={(v)=>v!==null?v.toFixed(1):'N/A'} labelFormatter={()=>''}/>
              <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="5 5"/>
              <ReferenceLine y={30} stroke="#22C55E" strokeDasharray="5 5"/>
              <Line type="monotone" dataKey="rsi" stroke="#8B5CF6" strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
          <div className="lab-insight"><strong>📖</strong> {analysis.cRSI > 70 ? 'RSI > 70: Overbought — potential pullback.' : analysis.cRSI < 30 ? 'RSI < 30: Oversold — potential bounce.' : 'RSI neutral (30-70).'}</div>
        </div>
      )}

      {activeIndicator === 'macd' && (
        <div className="lab-chart-area">
          <h5 className="lab-chart-title">MACD (12/26/9) — {analysis.macdSignal}</h5>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analysis.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
              <XAxis dataKey="time" hide/>
              <YAxis domain={['auto','auto']} width={55} axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#6B7280'}}/>
              <Tooltip formatter={(v)=>v!==null?v.toFixed(4):'N/A'} labelFormatter={()=>''}/>
              <ReferenceLine y={0} stroke="#6B7280"/>
              <Line type="monotone" dataKey="macd" stroke="#1B3BFC" strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="signal" stroke="#EF4444" strokeWidth={1.5} dot={false} strokeDasharray="4 2"/>
            </LineChart>
          </ResponsiveContainer>
          <div className="lab-insight"><strong>📖</strong> {analysis.macdSignal === 'Bullish' ? 'MACD above signal — bullish momentum.' : 'MACD below signal — bearish momentum.'}</div>
        </div>
      )}

      {activeIndicator === 'bb' && (
        <div className="lab-chart-area">
          <h5 className="lab-chart-title">Bollinger Bands (20, 2) — {analysis.bbPosition}</h5>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analysis.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
              <XAxis dataKey="time" hide/>
              <YAxis domain={['auto','auto']} tickFormatter={(v)=>`$${v.toFixed(0)}`} width={55} axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#6B7280'}}/>
              <Tooltip formatter={(v)=>v!==null?formatCurrency(v):'N/A'} labelFormatter={()=>''}/>
              <Area type="monotone" dataKey="bbUpper" stroke="rgba(107,114,128,0.3)" fill="rgba(107,114,128,0.08)" dot={false}/>
              <Area type="monotone" dataKey="bbLower" stroke="rgba(107,114,128,0.3)" fill="#fff" dot={false}/>
              <Line type="monotone" dataKey="bbMiddle" stroke="#6B7280" strokeWidth={1} dot={false} strokeDasharray="4 2"/>
              <Line type="monotone" dataKey="price" stroke={stock.color} strokeWidth={2} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
          <div className="lab-insight"><strong>📖</strong> {analysis.bbPosition === 'Near Upper' ? 'Price near upper band — may be overextended.' : analysis.bbPosition === 'Near Lower' ? 'Price near lower band — potential bounce.' : 'Price in middle — no strong BB signal.'}</div>
        </div>
      )}
    </div>
  );
}
