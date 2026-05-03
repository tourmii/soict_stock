import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useMarketStore } from '../store/marketStore';
import { formatCurrency, formatPercentRaw } from '../lib/formatters';
import { STOCKS } from '../lib/constants';
import SparklineChart from '../components/shared/SparklineChart';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import './Landing.css';

function generateWaveData(points = 60) {
  const data = [];
  let val = 100;
  for (let i = 0; i < points; i++) {
    val += (Math.random() - 0.48) * 3;
    data.push({ x: i, y: val });
  }
  return data;
}

export default function Landing() {
  const prices = useMarketStore((s) => s.prices);
  const getHistories = useMarketStore((s) => s.getHistories);
  const histories = useMemo(() => getHistories(), [prices]);
  const getChange = useMarketStore((s) => s.getChange);
  const waveData = useMemo(() => generateWaveData(), []);
  const waveData2 = useMemo(() => generateWaveData(), []);

  const watchlist = useMemo(() =>
    ['SCT', 'INNO', 'NXTG', 'HEAL', 'GRN'].map((t) => {
      const s = STOCKS.find((x) => x.ticker === t);
      const { change, changePercent } = getChange(t);
      const spark = (histories[t] || []).slice(-20).map((h) => h.close);
      return { ...s, price: prices[t], change, changePercent, sparkline: spark };
    }), [prices, histories]
  );

  const features = [
    { icon: '📊', title: 'Virtual Trading', desc: 'Execute trades with virtual money in a realistic market environment.' },
    { icon: '⚙️', title: 'Realistic Pricing Engine', desc: 'Powered by Geometric Brownian Motion with configurable drift and volatility.' },
    { icon: '📰', title: 'Market News Impact', desc: 'See how breaking news and earnings reports affect stock prices in real-time.' },
    { icon: '💼', title: 'Portfolio Tracking', desc: 'Monitor holdings, P&L, allocation, and performance with professional analytics.' },
    { icon: '🎓', title: 'Financial Learning', desc: 'Learn trading concepts through interactive lessons and post-trade explanations.' },
    { icon: '🛡️', title: 'Risk-Free Practice', desc: 'Build confidence and test strategies in a zero-risk environment.' },
  ];

  const pillars = [
    { num: '01', title: 'Market Fundamentals', desc: 'Understand how markets work, price discovery, and supply & demand.', icon: '📈' },
    { num: '02', title: 'Technical Analysis', desc: 'Learn chart patterns, indicators (RSI, MACD, SMA), and candlesticks.', icon: '🔍' },
    { num: '03', title: 'Risk Management', desc: 'Master position sizing, stop-losses, and portfolio diversification.', icon: '🛡️' },
    { num: '04', title: 'Trading Psychology', desc: 'Develop emotional discipline and build a winning trading mindset.', icon: '🧠' },
  ];

  const advisors = [
    { name: 'Arjun Mehta', title: 'CFA, Senior Market Analyst', avatar: '👨‍💼', specialty: 'Equity Research & Technical Analysis' },
    { name: 'Sneha Kapoor', title: 'CFA, Portfolio Strategist', avatar: '👩‍💼', specialty: 'Portfolio Construction & Risk Management' },
    { name: 'Rohan Desai', title: 'Quantitative Trader', avatar: '👨‍💻', specialty: 'Algorithmic Trading & Derivatives' },
  ];

  const services = [
    { icon: '📊', title: 'Market Analysis', desc: 'Daily market commentary, sector analysis, and data-driven trade ideas.' },
    { icon: '🎯', title: 'Strategy Guidance', desc: 'Personalized strategy recommendations based on your risk profile.' },
    { icon: '🤝', title: 'Advisory Services', desc: 'One-on-one mentoring and portfolio review with experienced pros.' },
  ];

  const steps = [
    { step: 1, title: 'Learn the Basics', desc: 'Start with market fundamentals and key concepts', icon: '📚' },
    { step: 2, title: 'Practice with Simulation', desc: 'Apply knowledge in our risk-free trading environment', icon: '🎮' },
    { step: 3, title: 'Analyze & Improve', desc: 'Review performance, learn from mistakes, refine strategy', icon: '📈' },
    { step: 4, title: 'Trade with Confidence', desc: 'Graduate to real markets with proven skills', icon: '🏆' },
  ];

  return (
    <div className="landing" id="landing-page">
      {/* Hero */}
      <section className="hero" id="hero-section">
        <div className="hero__bg">
          <div className="hero__wave hero__wave--1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={waveData}>
                <defs><linearGradient id="hg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1B3BFC" stopOpacity={0.15}/><stop offset="100%" stopColor="#1B3BFC" stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="y" stroke="#1B3BFC" strokeWidth={2} fill="url(#hg1)" dot={false} isAnimationActive={true} animationDuration={2000}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="hero__wave hero__wave--2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={waveData2}>
                <defs><linearGradient id="hg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22C55E" stopOpacity={0.1}/><stop offset="100%" stopColor="#22C55E" stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="y" stroke="#22C55E" strokeWidth={1.5} fill="url(#hg2)" dot={false} isAnimationActive={true} animationDuration={2500}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="container hero__content">
          <div className="hero__text animate-fade-in-up">
            <div className="hero__badge"><span className="badge badge-primary">🚀 #1 Trading Simulator</span></div>
            <h1 className="hero__title">Learn Stock Trading Through <span className="hero__title-accent">Realistic Simulation</span></h1>
            <p className="hero__subtitle">Master the art of trading with our risk-free simulation platform. Experience real market dynamics, practice strategies, and build confidence.</p>
            <div className="hero__ctas">
              <Link to="/simulation" className="btn btn-primary btn-lg" id="hero-cta-primary">▶ Start Simulating</Link>
              <a href="#features" className="btn btn-outline btn-lg" id="hero-cta-secondary">View Insights</a>
            </div>
            <div className="hero__badges-row">
              {['🛡️ Risk-Free Environment', '📊 Real Market Dynamics', '🎓 Learn & Grow'].map((b,i) => (
                <div key={i} className={`hero__feature-badge animate-fade-in-up delay-${i+2}`}>{b}</div>
              ))}
            </div>
          </div>
          <div className="hero__preview animate-fade-in-up delay-2">
            <div className="preview-widget">
              <div className="preview-widget__chart-area">
                <div className="preview-widget__header">
                  <div>
                    <h4 style={{fontSize:'var(--text-base)',fontWeight:600}}>SCTech Ltd.</h4>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'4px'}}>
                      <span style={{fontSize:'var(--text-xl)',fontWeight:700}}>{formatCurrency(prices['SCT'])}</span>
                      <span className={`badge ${getChange('SCT').changePercent>=0?'badge-green':'badge-red'}`}>
                        {getChange('SCT').changePercent>=0?'↑':'↓'} {formatPercentRaw(Math.abs(getChange('SCT').changePercent))}
                      </span>
                    </div>
                  </div>
                  <span className="badge badge-primary" style={{fontSize:'10px'}}>LIVE</span>
                </div>
                <div className="preview-widget__chart">
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={(histories['SCT']||[]).slice(-60).map((h,i)=>({x:i,y:h.close}))}>
                      <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1B3BFC" stopOpacity={0.2}/><stop offset="100%" stopColor="#1B3BFC" stopOpacity={0}/></linearGradient></defs>
                      <Area type="monotone" dataKey="y" stroke="#1B3BFC" strokeWidth={2} fill="url(#pg)" dot={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="preview-widget__sidebar">
                <h5 style={{fontSize:'var(--text-sm)',fontWeight:600,marginBottom:'8px',color:'var(--gray-500)'}}>Watchlist</h5>
                {watchlist.map((s) => (
                  <div key={s.ticker} className="preview-watchlist-row">
                    <div><span className="preview-ticker" style={{color:s.color}}>{s.ticker}</span><span className="preview-price">{formatCurrency(s.price)}</span></div>
                    <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                      <SparklineChart data={s.sparkline} color={s.changePercent>=0?'#22C55E':'#EF4444'} width={40} height={18}/>
                      <span className={s.changePercent>=0?'text-green':'text-red'} style={{fontSize:'11px',fontWeight:600}}>{s.changePercent>=0?'+':''}{s.changePercent.toFixed(2)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section features-section" id="features">
        <div className="container">
          <div className="section__header"><span className="badge badge-primary">Features</span><h2 className="section__title">Everything You Need to Master Trading</h2><p className="section__subtitle">Comprehensive tools and simulations to become a confident trader.</p></div>
          <div className="feature-grid">
            {features.map((f,i)=>(<div key={i} className={`feature-card card animate-fade-in-up delay-${i+1}`}><div className="feature-card__icon">{f.icon}</div><h4 className="feature-card__title">{f.title}</h4><p className="feature-card__desc">{f.desc}</p></div>))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="section pillars-section" id="learning-pillars">
        <div className="container">
          <div className="section__header"><span className="badge badge-primary">Education</span><h2 className="section__title">Learn. Understand. Grow.</h2><p className="section__subtitle">Four-pillar approach to comprehensive financial education.</p></div>
          <div className="pillars-grid">
            {pillars.map((p,i)=>(<div key={i} className={`pillar-card animate-fade-in-up delay-${i+1}`}><div className="pillar-card__number">{p.num}</div><div className="pillar-card__icon">{p.icon}</div><h4 className="pillar-card__title">{p.title}</h4><p className="pillar-card__desc">{p.desc}</p></div>))}
          </div>
        </div>
      </section>

      {/* Advisory */}
      <section className="section advisory-section" id="insights-advisory">
        <div className="container">
          <div className="section__header"><span className="badge badge-primary">Insights & Advisory</span><h2 className="section__title">Expert Guidance at Every Step</h2><p className="section__subtitle">Learn from seasoned professionals and AI-powered analysis.</p></div>
          <div className="advisory-grid">
            <div className="advisors-row">
              {advisors.map((a,i)=>(<div key={i} className="advisor-card card"><div className="advisor-card__avatar">{a.avatar}</div><h5 className="advisor-card__name">{a.name}</h5><p className="advisor-card__title-text">{a.title}</p><p className="advisor-card__specialty">{a.specialty}</p></div>))}
            </div>
            <div className="services-row">
              {services.map((s,i)=>(<div key={i} className="service-card card"><div className="service-card__icon">{s.icon}</div><h5 className="service-card__title">{s.title}</h5><p className="service-card__desc">{s.desc}</p></div>))}
            </div>
          </div>
        </div>
      </section>

      {/* Expertise Flow */}
      <section className="section flow-section" id="expertise-flow">
        <div className="container">
          <div className="section__header"><span className="badge badge-primary">Journey</span><h2 className="section__title">Bridging Learning to Professional Expertise</h2><p className="section__subtitle">Follow our proven 4-step path from beginner to confident trader.</p></div>
          <div className="flow-steps">
            {steps.map((item,i)=>(<div key={i} className="flow-step"><div className="flow-step__circle"><span className="flow-step__icon">{item.icon}</span></div>{i<3&&<div className="flow-step__connector"/>}<h5 className="flow-step__title">{item.title}</h5><p className="flow-step__desc">{item.desc}</p></div>))}
          </div>
          <div style={{textAlign:'center',marginTop:'var(--sp-12)'}}>
            <Link to="/simulation" className="btn btn-primary btn-lg" id="flow-cta">Begin Your Journey →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
