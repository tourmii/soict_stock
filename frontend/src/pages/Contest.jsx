import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContestStore } from '../store/contestStore';
import { useAuthStore } from '../store/authStore';

const Contest = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const contests = useContestStore(s => s.contests);
  const fetchActiveContests = useContestStore(s => s.fetchActiveContests);

  useEffect(() => {
    fetchActiveContests();
  }, [fetchActiveContests]);

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem' }}>
      
      {/* Premium Hero Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', 
        borderRadius: 'var(--radius-xl)', 
        padding: '3rem 2rem', 
        color: 'white', 
        marginBottom: '2rem',
        boxShadow: '0 10px 30px rgba(27, 59, 252, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', left: '10%', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(30px)' }}></div>
        
        <h1 style={{ color: 'white', marginBottom: '0.5rem', fontSize: 'var(--text-4xl)', position: 'relative', zIndex: 1 }}>Global Trading Arena</h1>
        <p style={{ fontSize: 'var(--text-lg)', opacity: 0.9, maxWidth: '600px', position: 'relative', zIndex: 1 }}>
          Choose a contest, compete against other traders with a simulated $100k portfolio, and climb the leaderboard.
        </p>
      </div>
      
      {!contests || contests.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div className="animate-pulse" style={{ width: '40px', height: '40px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--gray-500)' }}>Loading active contests...</p>
        </div>
      ) : (
        <div>
          <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1.5rem' }}>Active Contests</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
            {contests.map((contest, index) => (
              <div key={contest._id} className="card animate-fade-in-up" style={{ padding: '2rem', animationDelay: `${index * 0.1}s`, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>{contest.name}</h3>
                  <span className="badge badge-green" style={{ fontSize: '10px', padding: '0.3rem 0.6rem', textTransform: 'uppercase' }}>
                    <span style={{ width: '4px', height: '4px', background: 'var(--green-dark)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite', marginRight: '4px' }}></span>
                    Active
                  </span>
                </div>
                
                <p style={{ color: 'var(--gray-500)', fontSize: 'var(--text-sm)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Ends: {new Date(contest.endTime).toLocaleDateString()}
                </p>

                <div style={{ marginBottom: '1.5rem', flex: 1 }}>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', marginBottom: '0.5rem' }}>Allowed Assets ({contest.allowedTickers.length})</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {contest.allowedTickers.slice(0, 8).map(t => (
                      <span key={t} style={{ background: 'var(--gray-100)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--gray-600)' }}>{t}</span>
                    ))}
                    {contest.allowedTickers.length > 8 && (
                      <span style={{ background: 'var(--gray-100)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--gray-600)' }}>+{contest.allowedTickers.length - 8} more</span>
                    )}
                  </div>
                </div>

                <button className="btn btn-primary" onClick={() => navigate(`/contest/arena/${contest._id}`)} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  Enter Arena
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Contest;
