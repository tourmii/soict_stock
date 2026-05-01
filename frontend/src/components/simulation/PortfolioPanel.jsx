import { useMarketStore } from '../../store/marketStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useOrderStore } from '../../store/orderStore';
import { formatCurrency, formatPercentRaw, formatDateTime } from '../../lib/formatters';
import DonutChart from '../shared/DonutChart';
import SparklineChart from '../shared/SparklineChart';

export default function PortfolioPanel() {
  const prices = useMarketStore((s) => s.prices);
  const cash = usePortfolioStore((s) => s.cash);
  const getPortfolioValue = usePortfolioStore((s) => s.getPortfolioValue);
  const getTotalReturn = usePortfolioStore((s) => s.getTotalReturn);
  const getAllocation = usePortfolioStore((s) => s.getAllocation);
  const transactions = usePortfolioStore((s) => s.transactions);
  const portfolioHistory = usePortfolioStore((s) => s.portfolioHistory);
  const openOrders = useOrderStore((s) => s.openOrders);
  const cancelOrder = useOrderStore((s) => s.cancelOrder);

  const portfolioValue = getPortfolioValue(prices);
  const totalReturn = getTotalReturn(prices);
  const allocation = getAllocation(prices);
  const sparkData = portfolioHistory.slice(-20).map((p) => p.value);
  const recentTx = transactions.slice(0, 5);
  const pendingOrders = openOrders.filter((o) => o.status === 'Pending').slice(0, 5);

  const donutData = [
    { name: 'Stocks', value: Math.max(0, allocation.stocks) },
    { name: 'ETFs', value: 0 },
    { name: 'Cash', value: Math.max(0, allocation.cash) },
    { name: 'Other', value: 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="card" style={{padding:0,overflow:'hidden'}}>
      <div style={{padding:'16px 20px',borderBottom:'var(--border-light)'}}>
        <h4 style={{fontSize:'var(--text-md)',fontWeight:700}}>Portfolio Summary</h4>
      </div>

      {/* Stats */}
      <div style={{padding:'16px 20px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',borderBottom:'var(--border-light)'}}>
        <div>
          <p style={{fontSize:'11px',color:'var(--gray-500)',fontWeight:500}}>Available Cash</p>
          <p style={{fontSize:'var(--text-base)',fontWeight:700}}>{formatCurrency(cash)}</p>
        </div>
        <div>
          <p style={{fontSize:'11px',color:'var(--gray-500)',fontWeight:500}}>Buying Power</p>
          <p style={{fontSize:'var(--text-base)',fontWeight:700}}>{formatCurrency(cash)}</p>
        </div>
        <div>
          <p style={{fontSize:'11px',color:'var(--gray-500)',fontWeight:500}}>Portfolio Value</p>
          <p style={{fontSize:'var(--text-base)',fontWeight:700}}>{formatCurrency(portfolioValue)}</p>
        </div>
        <div>
          <p style={{fontSize:'11px',color:'var(--gray-500)',fontWeight:500}}>Total Return</p>
          <p style={{fontSize:'var(--text-base)',fontWeight:700,color:totalReturn>=0?'var(--green)':'var(--red)'}}>
            {totalReturn>=0?'+':''}{formatCurrency(totalReturn)}
          </p>
        </div>
      </div>

      {/* Sparkline */}
      {sparkData.length > 2 && (
        <div style={{padding:'12px 20px',borderBottom:'var(--border-light)'}}>
          <p style={{fontSize:'11px',color:'var(--gray-500)',fontWeight:500,marginBottom:'8px'}}>Daily P&L</p>
          <SparklineChart data={sparkData} color="auto" width={240} height={32}/>
        </div>
      )}

      {/* Donut */}
      <div style={{padding:'16px 20px',borderBottom:'var(--border-light)'}}>
        <DonutChart data={donutData} size={140} innerRadius={42} outerRadius={60} showLegend={true}/>
      </div>

      {/* Open Orders */}
      {pendingOrders.length > 0 && (
        <div style={{borderBottom:'var(--border-light)'}}>
          <div style={{padding:'12px 20px 8px'}}>
            <h5 style={{fontSize:'var(--text-sm)',fontWeight:600,color:'var(--gray-500)'}}>Open Orders</h5>
          </div>
          <div style={{maxHeight:'160px',overflowY:'auto'}}>
            {pendingOrders.map((o) => (
              <div key={o.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 20px',fontSize:'12px',borderBottom:'1px solid var(--gray-50)'}}>
                <span className={`badge ${o.type==='Buy'?'badge-green':'badge-red'}`} style={{fontSize:'10px'}}>{o.type}</span>
                <span style={{fontWeight:600}}>{o.ticker}</span>
                <span style={{color:'var(--gray-500)'}}>{o.orderType}</span>
                <span>{o.quantity}</span>
                <span>{formatCurrency(o.price)}</span>
                <button onClick={()=>cancelOrder(o.id)} style={{color:'var(--red)',fontSize:'11px',fontWeight:600,background:'none',border:'none',cursor:'pointer'}}>Cancel</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <div style={{padding:'12px 20px 8px'}}>
          <h5 style={{fontSize:'var(--text-sm)',fontWeight:600,color:'var(--gray-500)'}}>Recent Transactions</h5>
        </div>
        <div style={{maxHeight:'200px',overflowY:'auto'}}>
          {recentTx.length === 0 ? (
            <p style={{padding:'20px',textAlign:'center',fontSize:'var(--text-sm)',color:'var(--gray-400)'}}>No transactions yet</p>
          ) : recentTx.map((tx) => (
            <div key={tx.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 20px',fontSize:'12px',borderBottom:'1px solid var(--gray-50)'}}>
              <span className={`badge ${tx.type==='Buy'?'badge-green':'badge-red'}`} style={{fontSize:'10px'}}>{tx.type}</span>
              <span style={{fontWeight:600}}>{tx.ticker}</span>
              <span>{tx.quantity}</span>
              <span>{formatCurrency(tx.price)}</span>
              <span style={{color:'var(--gray-400)',fontSize:'11px'}}>{formatDateTime(tx.time)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
