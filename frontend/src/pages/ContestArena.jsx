import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useContestStore } from '../store/contestStore';
import { useAuthStore } from '../store/authStore';
import ContestStockChart from '../components/simulation/ContestStockChart';
import ContestOrderForm from '../components/simulation/ContestOrderForm';
import ContestPortfolioPanel from '../components/simulation/ContestPortfolioPanel';

export default function ContestArena() {
  const navigate = useNavigate();
  const { contestId } = useParams();
  const { user } = useAuthStore();
  
  const currentContest = useContestStore(s => s.currentContest);
  const isJoined = useContestStore(s => s.isJoined);
  const fetchActiveContests = useContestStore(s => s.fetchActiveContests);
  const selectContest = useContestStore(s => s.selectContest);
  const leaderboard = useContestStore(s => s.leaderboard);
  const fetchLeaderboard = useContestStore(s => s.fetchLeaderboard);

  const [timeLeft, setTimeLeft] = useState('');

  // Initial load
  useEffect(() => {
    const init = async () => {
      await fetchActiveContests();
      await selectContest(contestId, user?.id);
    };
    init();
  }, [contestId, user, fetchActiveContests, selectContest]);

  // Periodic Leaderboard refresh
  useEffect(() => {
    if (isJoined && contestId) {
      const interval = setInterval(() => {
        fetchLeaderboard(contestId);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isJoined, contestId, fetchLeaderboard]);

  // Countdown timer
  useEffect(() => {
    if (!currentContest?.endTime) return;
    
    const updateTimer = () => {
      const end = new Date(currentContest.endTime).getTime();
      const now = new Date().getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft('EXPIRED');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [currentContest]);



  if (!currentContest || !user) {
    return <div className="container" style={{padding: '40px', textAlign: 'center'}}>Loading Arena...</div>;
  }

  if (isJoined === false) {
    return (
      <div className="container animate-fade-in" style={{padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto'}}>
        <div style={{ background: 'white', padding: '3rem', borderRadius: 'var(--radius-xl)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--primary-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--primary)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1rem' }}>Join {currentContest.name}</h2>
          <p style={{ color: 'var(--gray-500)', marginBottom: '2rem', fontSize: 'var(--text-lg)' }}>
            Get a simulated $100,000 portfolio and compete against other traders in this exclusive arena!
          </p>
          <button 
            className="btn btn-primary btn-lg" 
            onClick={() => useContestStore.getState().joinContest(user.id, currentContest._id)}
            style={{ width: '100%', fontSize: 'var(--text-lg)', padding: '1rem' }}
          >
            Join Contest Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="simulation animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', background: 'var(--bg-page)' }}>
      {/* Premium Arena Top Bar */}
      <div style={{ 
        height: '70px', 
        background: 'rgba(17, 24, 39, 0.95)', 
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)', 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 2rem', 
        justifyContent: 'space-between', 
        zIndex: 10,
        color: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(27,59,252,0.4)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </div>
          <div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: '800', margin: 0, letterSpacing: '0.5px', color: 'white' }}>{currentContest.name}</h2>
            <div style={{ fontSize: '11px', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ width: '6px', height: '6px', background: 'var(--green)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
              Live Arena
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <div style={{ fontWeight: '800', fontSize: 'var(--text-md)', color: timeLeft === 'EXPIRED' ? 'var(--red)' : 'white', fontFamily: 'monospace', letterSpacing: '1px' }}>
            {timeLeft}
          </div>
        </div>
      </div>

      <div className="simulation__layout container" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
        {/* Left: Leaderboard */}
        <aside className="simulation__left" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ height: '100%', overflowY: 'auto', padding: '1.25rem', borderTop: '4px solid var(--primary)' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: '800', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              Live Leaderboard
            </h3>
            {leaderboard.length === 0 ? (
              <p className="text-muted text-sm text-center" style={{ padding: '2rem 0' }}>Waiting for traders...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {leaderboard.map((lb, index) => {
                  const isYou = lb.userId === user?.id;
                  const rankColor = index === 0 ? '#F59E0B' : index === 1 ? '#9CA3AF' : index === 2 ? '#B45309' : 'var(--gray-400)';
                  
                  return (
                    <div key={lb.userId} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: isYou ? 'var(--primary-bg)' : 'transparent', borderRadius: 'var(--radius-md)', border: isYou ? '1px solid rgba(27,59,252,0.2)' : '1px solid transparent', transition: 'all 0.2s', ':hover': { background: 'var(--gray-50)' } }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: '800', color: rankColor, width: '16px', textAlign: 'center', fontSize: '13px' }}>{index + 1}</span>
                        <div style={{ fontWeight: isYou ? 'bold' : '600', fontSize: '13px', color: isYou ? 'var(--primary)' : 'var(--gray-700)' }}>
                          {isYou ? 'You' : `Trader_${lb.userId.substring(0, 4)}`}
                        </div>
                      </div>
                      <div className={lb.returnPct >= 0 ? 'text-green' : 'text-red'} style={{ fontWeight: '800', fontSize: '14px', fontFamily: 'monospace' }}>
                        ${(lb.portfolioValue / 1000).toFixed(1)}k
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Center: Chart & Order */}
        <main className="simulation__center" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <ContestStockChart />
          <ContestOrderForm />
        </main>

        {/* Right: Portfolio */}
        <aside className="simulation__right">
          <ContestPortfolioPanel />
        </aside>
      </div>
    </div>
  );
}
