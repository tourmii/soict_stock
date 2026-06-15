import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarketStore } from '../store/marketStore';
import { usePortfolioStore } from '../store/portfolioStore';
import { useLeverageStore } from '../store/leverageStore';
import { useAuthStore } from '../store/authStore';
import { STOCKS } from '../lib/constants';
import { formatCurrency, formatPercentRaw, formatDateTime } from '../lib/formatters';
import StatCard from '../components/shared/StatCard';
import DonutChart from '../components/shared/DonutChart';
import SparklineChart from '../components/shared/SparklineChart';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import './Portfolio.css';

export default function Portfolio() {
  const navigate = useNavigate();
  const prices = useMarketStore((s) => s.prices);
  const rawTicks = useMarketStore((s) => s.rawTicks);
  const setSelectedTicker = useMarketStore((s) => s.setSelectedTicker);
  // histories not needed here — Portfolio uses portfolioStore
  const cash = usePortfolioStore((s) => s.cash);
  const getPortfolioValue = usePortfolioStore((s) => s.getPortfolioValue);
  const getUnrealizedPL = usePortfolioStore((s) => s.getUnrealizedPL);
  const getTotalRealizedPL = usePortfolioStore((s) => s.getTotalRealizedPL);
  const getTotalReturn = usePortfolioStore((s) => s.getTotalReturn);
  const getHoldingsArray = usePortfolioStore((s) => s.getHoldingsArray);
  const getAllocation = usePortfolioStore((s) => s.getAllocation);
  const transactions = usePortfolioStore((s) => s.transactions);
  const portfolioHistory = usePortfolioStore((s) => s.portfolioHistory);
  const getFuturesPositions = usePortfolioStore((s) => s.getFuturesPositions);
  const loadPortfolio = usePortfolioStore((s) => s.loadFromBackend);
  const user = useAuthStore((s) => s.user);
  const closePosition = useLeverageStore((s) => s.closePosition);
  const isClosingPosition = useLeverageStore((s) => s.isLoading);

  const [showAllTx, setShowAllTx] = useState(false);

  const portfolioValue = getPortfolioValue(prices);
  const unrealizedPL = getUnrealizedPL(prices);
  const realizedPL = getTotalRealizedPL();
  const totalReturn = getTotalReturn(prices);
  const holdingsArr = getHoldingsArray(prices);
  const allocation = getAllocation(prices);
  const futuresPositions = getFuturesPositions(prices);

  const handleClosePosition = async (p) => {
    const res = await closePosition(user?.id, p._id.toString(), null);
    if (res.success) await loadPortfolio(prices);
    else alert(res.message);
  };
  const sparkData = portfolioHistory.slice(-30).map((p) => p.value);

  const totalStockValue = holdingsArr.reduce((s, h) => s + h.marketValue, 0);

  const bestPerformer = useMemo(() => {
    if (holdingsArr.length === 0) return null;
    return holdingsArr.reduce((best, h) => h.unrealizedPLPercent > (best?.unrealizedPLPercent || -Infinity) ? h : best, null);
  }, [holdingsArr]);

  const worstPerformer = useMemo(() => {
    if (holdingsArr.length === 0) return null;
    return holdingsArr.reduce((worst, h) => h.unrealizedPLPercent < (worst?.unrealizedPLPercent || Infinity) ? h : worst, null);
  }, [holdingsArr]);

  const winRate = useMemo(() => {
    const sells = transactions.filter((t) => t.type === 'Sell');
    if (sells.length === 0) return 0;
    const wins = sells.filter((t) => {
      const h = holdingsArr.find((ho) => ho.ticker === t.ticker);
      return h ? t.price > h.avgPrice : true;
    });
    return (wins.length / sells.length) * 100;
  }, [transactions, holdingsArr]);

  const donutData = [
    { name: 'Stocks', value: Math.max(0, allocation.stocks) },
    { name: 'Futures', value: Math.max(0, allocation.futures || 0) },
    { name: 'Cash', value: Math.max(0, allocation.cash) },
  ].filter((d) => d.value > 0);

  const perfChartData = portfolioHistory.map((p, i) => ({ time: i, value: p.value }));

  const downloadCSV = () => {
    const header = 'Date,Type,Ticker,Order Type,Quantity,Price,Total,Status\n';
    const rows = transactions.map((t) => `${t.time},${t.type},${t.ticker},${t.orderType},${t.quantity},${t.price},${t.total},${t.status}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'transactions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="portfolio-page" id="portfolio-page">
      <div className="container" style={{paddingTop:'var(--sp-8)',paddingBottom:'var(--sp-8)'}}>
        <div style={{marginBottom:'var(--sp-6)'}}>
          <h2 style={{margin:0}}>Portfolio Overview</h2>
          <p style={{color:'var(--gray-500)',fontSize:'var(--text-sm)',marginTop:'4px'}}>Track your simulated holdings and performance</p>
        </div>

        {/* Stat Cards */}
        <div className="portfolio-stats">
          <StatCard title="Total Portfolio Value" value={formatCurrency(portfolioValue)} change={formatPercentRaw(portfolioValue > 0 ? (totalReturn/portfolioValue)*100 : 0)} subtitle={`Total Return ${totalReturn>=0?'+':''}${formatCurrency(totalReturn)}`} accentColor="var(--primary)"/>
          <StatCard title="Unrealized P&L" value={`${unrealizedPL>=0?'+':''}${formatCurrency(unrealizedPL)}`} change={formatPercentRaw(portfolioValue>0?(unrealizedPL/portfolioValue)*100:0)} accentColor={unrealizedPL>=0?'var(--green)':'var(--red)'}/>
          <StatCard title="Realized P&L" value={`${realizedPL>=0?'+':''}${formatCurrency(realizedPL)}`} accentColor={realizedPL>=0?'var(--green)':'var(--red)'}/>
          <StatCard title="Total Return" value={`${totalReturn>=0?'+':''}${formatCurrency(totalReturn)}`} sparklineData={sparkData}/>
        </div>

        <div className="portfolio-main">
          {/* Left: Tables */}
          <div className="portfolio-tables">
            {/* Holdings */}
            <div className="card" style={{padding:0}}>
              <div style={{padding:'16px 20px',borderBottom:'var(--border-light)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h4 style={{fontSize:'var(--text-md)',fontWeight:700}}>Current Holdings</h4>
                <span className="badge badge-gray">{holdingsArr.length} stocks</span>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Company</th><th>Ticker</th><th>Shares</th><th>Avg Price</th><th>Current</th><th>Market Value</th><th>Unrealized P&L</th><th>Allocation</th><th>Trend</th></tr></thead>
                  <tbody>
                    {holdingsArr.length === 0 ? (
                      <tr><td colSpan={9} style={{textAlign:'center',padding:'32px',color:'var(--gray-400)'}}>No holdings yet. Start trading!</td></tr>
                    ) : holdingsArr.map((h) => {
                      const stock = STOCKS.find((s) => s.ticker === h.ticker);
                      const alloc = totalStockValue > 0 ? (h.marketValue / portfolioValue) * 100 : 0;
                      const sparkPrices = (rawTicks[h.ticker] || []).slice(-30).map((t) => t.price);
                      return (
                        <tr
                          key={h.ticker}
                          className="portfolio-holding-row"
                          onClick={() => { setSelectedTicker(h.ticker); navigate('/simulation'); }}
                        >
                          <td><div style={{display:'flex',alignItems:'center',gap:'8px'}}><div style={{width:28,height:28,borderRadius:'var(--radius-md)',background:`${stock?.color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:700,color:stock?.color}}>{h.ticker[0]}</div><span style={{fontWeight:500}}>{stock?.name}</span></div></td>
                          <td><span className="badge" style={{background:`${stock?.color}15`,color:stock?.color,fontSize:'11px'}}>{h.ticker}</span></td>
                          <td style={{fontWeight:600}}>{h.shares}</td>
                          <td>{formatCurrency(h.avgPrice)}</td>
                          <td style={{fontWeight:600}}>{formatCurrency(h.currentPrice)}</td>
                          <td style={{fontWeight:600}}>{formatCurrency(h.marketValue)}</td>
                          <td><span style={{color:h.unrealizedPL>=0?'var(--green)':'var(--red)',fontWeight:600}}>{h.unrealizedPL>=0?'+':''}{formatCurrency(h.unrealizedPL)} <span style={{fontSize:'11px'}}>({formatPercentRaw(h.unrealizedPLPercent)})</span></span></td>
                          <td>{alloc.toFixed(1)}%</td>
                          <td><SparklineChart data={sparkPrices} width={60} height={28} color={h.unrealizedPL >= 0 ? '#22C55E' : '#EF4444'} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Futures Positions */}
            {futuresPositions.length > 0 && (
              <div className="card" style={{padding:0}}>
                <div style={{padding:'16px 20px',borderBottom:'var(--border-light)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <h4 style={{fontSize:'var(--text-md)',fontWeight:700}}>Futures Positions</h4>
                  <span className="badge badge-gray">{futuresPositions.length} open</span>
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead><tr><th>Ticker</th><th>Side</th><th>Lev</th><th>Qty</th><th>Entry</th><th>Mark</th><th>Liq.</th><th>Margin</th><th>Unrealized P&L</th><th>Value</th><th></th></tr></thead>
                    <tbody>
                      {futuresPositions.map((p) => {
                        const stock = STOCKS.find((s) => s.ticker === p.ticker);
                        const pnlPct = p.margin > 0 ? (p.unrealizedPnL / p.margin) * 100 : 0;
                        return (
                          <tr key={p._id}>
                            <td><span className="badge" style={{background:`${stock?.color||'#888'}15`,color:stock?.color||'#888',fontSize:'11px'}}>{p.ticker}</span></td>
                            <td><span className={`badge ${p.side==='Long'?'badge-green':'badge-red'}`} style={{fontSize:'11px'}}>{p.side}</span></td>
                            <td style={{fontWeight:600}}>{p.leverage}×</td>
                            <td style={{fontWeight:600}}>{p.quantity}</td>
                            <td>{formatCurrency(p.entryPrice)}</td>
                            <td style={{fontWeight:600}}>{formatCurrency(p.currentPrice)}</td>
                            <td style={{color:'var(--red)'}}>{formatCurrency(p.liquidationPrice)}</td>
                            <td>{formatCurrency(p.margin)}</td>
                            <td><span style={{color:p.unrealizedPnL>=0?'var(--green)':'var(--red)',fontWeight:600}}>{p.unrealizedPnL>=0?'+':''}{formatCurrency(p.unrealizedPnL)} <span style={{fontSize:'11px'}}>({formatPercentRaw(pnlPct)})</span></span></td>
                            <td style={{fontWeight:600}}>{formatCurrency(p.equity)}</td>
                            <td><button onClick={() => handleClosePosition(p)} disabled={isClosingPosition} className="btn btn-outline btn-sm">Close</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Transactions */}
            <div className="card" style={{padding:0}}>
              <div style={{padding:'16px 20px',borderBottom:'var(--border-light)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h4 style={{fontSize:'var(--text-md)',fontWeight:700}}>Transaction History</h4>
                {transactions.length > 0 && <button onClick={downloadCSV} className="btn btn-outline btn-sm">Export CSV</button>}
              </div>
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Date/Time</th><th>Type</th><th>Company</th><th>Order Type</th><th>Qty</th><th>Price</th><th>Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr><td colSpan={8} style={{textAlign:'center',padding:'32px',color:'var(--gray-400)'}}>No transactions yet</td></tr>
                    ) : transactions.slice(0, showAllTx ? transactions.length : 20).map((tx) => {
                      const stock = STOCKS.find((s) => s.ticker === tx.ticker);
                      return (
                        <tr key={tx.id}>
                          <td style={{color:'var(--gray-500)'}}>{formatDateTime(tx.time)}</td>
                          <td><span className={`badge ${tx.type==='Buy'?'badge-green':'badge-red'}`} style={{fontSize:'11px'}}>{tx.type}</span></td>
                          <td><span style={{fontWeight:500}}>{stock?.name || tx.ticker}</span></td>
                          <td>{tx.orderType}</td>
                          <td style={{fontWeight:600}}>{tx.quantity}</td>
                          <td>{formatCurrency(tx.price)}</td>
                          <td style={{fontWeight:600}}>{formatCurrency(tx.total)}</td>
                          <td><span className="badge badge-green" style={{fontSize:'10px'}}>Filled</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!showAllTx && transactions.length > 20 && (
                  <div style={{textAlign:'center',padding:'12px',borderTop:'1px solid var(--gray-100)'}}>
                    <button onClick={() => setShowAllTx(true)} className="btn btn-outline btn-sm">
                      Show all {transactions.length} transactions
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="portfolio-sidebar">
            {/* Allocation */}
            <div className="card" style={{padding:'20px'}}>
              <h5 style={{fontSize:'var(--text-sm)',fontWeight:700,marginBottom:'16px'}}>Portfolio Allocation</h5>
              <DonutChart data={donutData} size={160} innerRadius={48} outerRadius={68}/>
            </div>

            {/* Performance Chart */}
            <div className="card" style={{padding:'20px'}}>
              <h5 style={{fontSize:'var(--text-sm)',fontWeight:700,marginBottom:'16px'}}>Portfolio Performance</h5>
              {perfChartData.length > 1 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={perfChartData}>
                    <defs><linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1B3BFC" stopOpacity={0.15}/><stop offset="100%" stopColor="#1B3BFC" stopOpacity={0}/></linearGradient></defs>
                    <XAxis dataKey="time" hide/><YAxis hide domain={['auto','auto']}/>
                    <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{background:'white',border:'1px solid #E5E7EB',borderRadius:'8px',fontSize:'12px'}}/>
                    <Area type="monotone" dataKey="value" stroke="#1B3BFC" strokeWidth={2} fill="url(#perfGrad)" dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p style={{textAlign:'center',color:'var(--gray-400)',fontSize:'var(--text-sm)',padding:'32px 0'}}>Data collecting...</p>}
            </div>

            {/* Performance Summary */}
            <div className="card" style={{padding:'20px'}}>
              <h5 style={{fontSize:'var(--text-sm)',fontWeight:700,marginBottom:'16px'}}>Performance Summary</h5>
              <div style={{display:'flex',flexDirection:'column',gap:'10px',fontSize:'var(--text-sm)'}}>
                <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--gray-500)'}}>Best Performer</span><span style={{fontWeight:600,color:'var(--green)'}}>{bestPerformer ? `${bestPerformer.ticker} +${bestPerformer.unrealizedPLPercent.toFixed(1)}%` : '—'}</span></div>
                <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--gray-500)'}}>Worst Performer</span><span style={{fontWeight:600,color:'var(--red)'}}>{worstPerformer ? `${worstPerformer.ticker} ${worstPerformer.unrealizedPLPercent.toFixed(1)}%` : '—'}</span></div>
                <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--gray-500)'}}>Win Rate</span><span style={{fontWeight:600}}>{winRate.toFixed(0)}%</span></div>
                <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--gray-500)'}}>Holdings</span><span style={{fontWeight:600}}>{holdingsArr.length}</span></div>
                <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--gray-500)'}}>Cash Available</span><span style={{fontWeight:600}}>{formatCurrency(cash)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
