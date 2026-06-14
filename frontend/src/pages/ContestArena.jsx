import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useContestStore } from '../store/contestStore';
import { useAuthStore } from '../store/authStore';
import ContestStockChart from '../components/simulation/ContestStockChart';
import ContestOrderForm from '../components/simulation/ContestOrderForm';
import ContestPortfolioPanel from '../components/simulation/ContestPortfolioPanel';
import OrderBookView from '../components/simulation/OrderBook';
import TimeSales from '../components/simulation/TimeSales';
import './Simulation.css';
import Modal from '../components/shared/Modal';

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
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [previewReward, setPreviewReward] = useState(null);

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
    <div className="exchange animate-fade-in">
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
        flexShrink: 0,
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

      <div className="exchange__body">
        {/* Left: Leaderboard / Prizes */}
        <aside className="exchange__watchlist">
          <div className="watchlist" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>
            <div style={{ 
              display: 'flex', 
              borderBottom: '1px solid var(--gray-200)', 
              background: 'var(--white)', 
              flexShrink: 0 
            }}>
              <button 
                onClick={() => setActiveTab('leaderboard')}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  border: 'none',
                  background: activeTab === 'leaderboard' ? 'var(--gray-50)' : 'transparent',
                  borderBottom: activeTab === 'leaderboard' ? '2px solid var(--primary)' : '2px solid transparent',
                  fontWeight: activeTab === 'leaderboard' ? 'bold' : 'normal',
                  color: activeTab === 'leaderboard' ? 'var(--primary)' : 'var(--gray-500)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                Leaderboard
              </button>
              <button 
                onClick={() => setActiveTab('prizes')}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  border: 'none',
                  background: activeTab === 'prizes' ? 'var(--gray-50)' : 'transparent',
                  borderBottom: activeTab === 'prizes' ? '2px solid var(--primary)' : '2px solid transparent',
                  fontWeight: activeTab === 'prizes' ? 'bold' : 'normal',
                  color: activeTab === 'prizes' ? 'var(--primary)' : 'var(--gray-500)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                Prizes
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '12px' }}>
              {activeTab === 'leaderboard' ? (
                leaderboard.length === 0 ? (
                  <p className="text-muted text-sm text-center" style={{ padding: '2rem 0' }}>Waiting for traders...</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {leaderboard.map((lb, index) => {
                      const isYou = lb.userId === user?.id;
                      const rankColor = index === 0 ? '#F59E0B' : index === 1 ? '#9CA3AF' : index === 2 ? '#B45309' : 'var(--gray-400)';
                      
                      return (
                        <div key={lb.userId} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: isYou ? 'var(--primary-bg)' : 'transparent', borderRadius: 'var(--radius-md)', border: isYou ? '1px solid rgba(27,59,252,0.2)' : '1px solid transparent', transition: 'all 0.2s' }}>
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
                )
              ) : (
                /* Prizes Tab */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {(!currentContest.rewards || currentContest.rewards.length === 0) ? (
                    <p style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: 'var(--text-sm)', padding: '2rem 0' }}>No rewards configured for this contest.</p>
                  ) : (
                    currentContest.rewards.map((reward) => (
                      <div 
                        key={reward.rank} 
                        onClick={() => setPreviewReward(reward)}
                        style={{ 
                          background: 'var(--white)',
                          borderRadius: 'var(--radius-lg)',
                          border: '1px solid var(--gray-200)',
                          overflow: 'hidden',
                          boxShadow: 'var(--shadow-xs)',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                        }}
                      >
                        {reward.image && (
                          <div style={{ width: '100%', height: '120px', background: '#f5f5f7', overflow: 'hidden', position: 'relative' }}>
                            <img src={reward.image} alt={reward.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {reward.rank === '1' && (
                              <div style={{ position: 'absolute', bottom: '6px', right: '6px', display: 'flex', gap: '4px' }}>
                                <span style={{ background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '9px', padding: '2px 4px', borderRadius: '3px' }}>👕 Tee</span>
                                <span style={{ background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '9px', padding: '2px 4px', borderRadius: '3px' }}>🍼 Flask</span>
                                <span style={{ background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '9px', padding: '2px 4px', borderRadius: '3px' }}>🧢 Cap</span>
                              </div>
                            )}
                            {reward.rank === '2 - 5' && (
                              <div style={{ position: 'absolute', bottom: '6px', right: '6px', display: 'flex', gap: '4px' }}>
                                <span style={{ background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '9px', padding: '2px 4px', borderRadius: '3px' }}>👕 Tee</span>
                                <span style={{ background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '9px', padding: '2px 4px', borderRadius: '3px' }}>🧢 Cap</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ 
                              background: reward.rank === '1' ? 'var(--primary-bg)' : reward.rank === '2 - 5' ? 'var(--green-bg)' : 'var(--gray-100)',
                              color: reward.rank === '1' ? 'var(--primary)' : reward.rank === '2 - 5' ? 'var(--green-dark)' : 'var(--gray-600)',
                              fontWeight: 'bold',
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Rank #{reward.rank}
                            </span>
                            <span style={{ fontSize: '9px', color: 'var(--gray-400)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                              {reward.type}
                            </span>
                          </div>
                          <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--gray-800)', margin: '0 0 2px 0' }}>{reward.name}</h4>
                          <p style={{ fontSize: '11px', color: 'var(--gray-500)', margin: 0, lineHeight: '1.3' }}>{reward.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Center: Chart & Order Book / Time Sales */}
        <main className="exchange__main">
          <div className="exchange__chart-wrap">
            <ContestStockChart />
          </div>
          <div className="exchange__lower">
            <OrderBookView />
            <TimeSales />
          </div>
        </main>

        {/* Right: Order Form & Portfolio */}
        <aside className="exchange__sidebar">
          <ContestOrderForm />
          <ContestPortfolioPanel />
        </aside>
      </div>

      {/* Reward Preview Modal */}
      <Modal 
        isOpen={!!previewReward} 
        onClose={() => setPreviewReward(null)} 
        title={previewReward?.name || 'Contest Reward Details'}
        maxWidth={650}
      >
        {previewReward && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
              {/* Left: Image Carousel / Main Image */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ background: '#f5f5f7', borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img 
                    src={previewReward.image} 
                    alt={previewReward.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
                {previewReward.rank === '1' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    <div style={{ height: '50px', background: '#f5f5f7', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
                      <img src="/soict_stock_tshirt.png" alt="Tee" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ height: '50px', background: '#f5f5f7', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
                      <img src="/soict_stock_bottle.png" alt="Thermos" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ height: '50px', background: '#f5f5f7', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
                      <img src="/soict_stock_cap.png" alt="Cap" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                )}
                {previewReward.rank === '2 - 5' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                    <div style={{ height: '50px', background: '#f5f5f7', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
                      <img src="/soict_stock_tshirt.png" alt="Tee" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ height: '50px', background: '#f5f5f7', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
                      <img src="/soict_stock_cap.png" alt="Cap" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Specs & Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <span style={{ 
                    background: previewReward.rank === '1' ? 'var(--primary-bg)' : 'var(--green-bg)',
                    color: previewReward.rank === '1' ? 'var(--primary)' : 'var(--green-dark)',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginBottom: '0.5rem'
                  }}>
                    Rank #{previewReward.rank} Winner
                  </span>
                  <p style={{ color: 'var(--gray-600)', fontSize: '13px', lineHeight: '1.4', margin: 0 }}>
                    {previewReward.description}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--gray-800)', margin: '0 0 4px 0' }}>Bundle Items:</h4>
                  <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '12px', color: 'var(--gray-500)', lineHeight: '1.6' }}>
                    {previewReward.rank === '1' ? (
                      <>
                        <li><strong>SOICT Stock Premium Tee</strong> - Heavyweight 100% cotton, neon-accented stock chart graphic.</li>
                        <li><strong>SOICT Stock Insulated Flask</strong> - 750ml vacuum thermos, matte black, laser-engraved.</li>
                        <li><strong>SOICT Stock Classic Cap</strong> - Embroidered low-profile curve cap with adjustable buckle.</li>
                      </>
                    ) : (
                      <>
                        <li><strong>SOICT Stock Premium Tee</strong> - Heavyweight 100% cotton, neon-accented stock chart graphic.</li>
                        <li><strong>SOICT Stock Classic Cap</strong> - Embroidered low-profile curve cap with adjustable buckle.</li>
                      </>
                    )}
                  </ul>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--gray-400)', fontWeight: 'bold' }}>ELIGIBILITY</span>
                  <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>Top {previewReward.rank === '1' ? '1 Trader' : '2-5 Traders'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
