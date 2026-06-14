import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContestStore } from '../store/contestStore';
import { useAuthStore } from '../store/authStore';
import Modal from '../components/shared/Modal';

const Contest = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [previewReward, setPreviewReward] = useState(null);
  
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

      {/* Rewards Catalog Section */}
      <div style={{ marginTop: '4rem', paddingBottom: '2rem' }}>
        <div style={{ borderTop: '1px solid var(--gray-200)', pt: '3rem', marginTop: '3rem' }}></div>
        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🎁</span> Contest Merchandise Rewards
        </h2>
        <p style={{ color: 'var(--gray-500)', marginBottom: '2rem', fontSize: 'var(--text-base)' }}>
          Trade smart, climb the leaderboard, and claim these exclusive SOICT Stock branded physical prizes! (Click on any reward to view details)
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {[
            {
              id: 'tshirt',
              name: 'SOICT Stock Premium Tee',
              badge: 'Rank 1 - 5 Reward',
              badgeClass: 'badge-primary',
              image: '/soict_stock_tshirt.png',
              shortDesc: 'A premium heavy-cotton black t-shirt featuring our iconic neon-accented stock chart design on the chest.',
              longDesc: 'Crafted from 100% premium combed ringspun cotton, this heavyweight tee features a modern retail fit, durable double-needle stitching, and a vibrant screen-printed geometric graph on the chest. Designed to keep you comfortable through long market sessions while displaying your SOICT Stock pride.',
              specs: [
                '100% ringspun combed cotton',
                'Fabric weight: 220 gsm / 6.5 oz',
                'Relaxed boxy fit',
                'High-density screen print graphic',
                'Pre-shrunk to maintain shape over time'
              ],
              exclusive: 'Rank #1 & Ranks #2-5 Prize'
            },
            {
              id: 'bottle',
              name: 'SOICT Stock Thermos Bottle',
              badge: 'Rank 1 Reward Only',
              badgeClass: 'badge-green',
              badgeStyle: { background: 'var(--amber-bg)', color: 'var(--amber)' },
              image: '/soict_stock_bottle.png',
              shortDesc: 'A premium double-walled matte black insulated bottle with custom engraved trading metrics.',
              longDesc: 'Keep your drinks cold for up to 24 hours or hot for 12 hours with this food-grade stainless steel thermos. Finished with a highly durable matte black powder coating, it features our high-contrast market bull-chart graphics wrapped around the body. Comes with a leak-proof cap and a carrying loop.',
              specs: [
                '18/8 food-grade stainless steel',
                'Capacity: 750ml / 25oz',
                'Double-wall vacuum insulation (BPA-free)',
                'Sweat-proof powder coated finish',
                'Laser-engraved custom graphics'
              ],
              exclusive: 'Rank #1 Exclusive Prize'
            },
            {
              id: 'cap',
              name: 'SOICT Stock Classic Cap',
              badge: 'Rank 1 - 5 Reward',
              badgeClass: 'badge-green',
              image: '/soict_stock_cap.png',
              shortDesc: 'A sleek black baseball cap embroidered with our high-contrast green and blue bullish chart logo.',
              longDesc: 'This low-profile cap is constructed from premium cotton twill panels and features a curved brim. Embroidered with premium quality 3D thread detailing showing the upward chart lines of the SOICT Stock logo. Includes an adjustable metal slide buckle strap on the back.',
              specs: [
                '100% premium cotton twill',
                '6-panel structured design',
                '3D embroidery thread detailing',
                'Adjustable brass metal slide buckle',
                'Embroidered ventilation eyelets'
              ],
              exclusive: 'Rank #1 & Ranks #2-5 Prize'
            }
          ].map((item) => (
            <div 
              key={item.id} 
              className="card" 
              onClick={() => setPreviewReward(item)}
              style={{ 
                padding: '0', 
                borderRadius: 'var(--radius-xl)', 
                overflow: 'hidden', 
                border: '1px solid var(--gray-200)',
                transition: 'transform 0.3s var(--transition-fast), box-shadow 0.3s var(--transition-fast)',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--white)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--shadow-card)';
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: '280px', overflow: 'hidden', background: '#f5f5f7' }}>
                <img 
                  src={item.image} 
                  alt={item.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span className={`badge ${item.badgeClass}`} style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.4rem 0.8rem', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', ...(item.badgeStyle || {}) }}>
                  {item.badge}
                </span>
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: '0.5rem', color: 'var(--gray-800)' }}>{item.name}</h3>
                <p style={{ color: 'var(--gray-500)', fontSize: 'var(--text-sm)', lineHeight: '1.5', marginBottom: '1.5rem', flex: 1 }}>
                  {item.shortDesc}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--gray-100)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', textTransform: 'uppercase', fontWeight: 'bold' }}>Click for specs</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>{item.exclusive}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal 
        isOpen={!!previewReward} 
        onClose={() => setPreviewReward(null)} 
        title={previewReward?.name || 'Reward Details'}
        maxWidth={720}
      >
        {previewReward && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {/* Left: Image */}
              <div style={{ background: '#f5f5f7', borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={previewReward.image} alt={previewReward.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {/* Right: Specifications */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <span className={`badge ${previewReward.badgeClass}`} style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'inline-block', ...(previewReward.badgeStyle || {}) }}>
                    {previewReward.badge}
                  </span>
                  <p style={{ color: 'var(--gray-600)', fontSize: 'var(--text-sm)', lineHeight: '1.5', margin: 0 }}>
                    {previewReward.longDesc}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--gray-800)', marginBottom: '0.4rem' }}>Specifications:</h4>
                  <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '12px', color: 'var(--gray-500)', lineHeight: '1.6' }}>
                    {previewReward.specs.map((spec, i) => (
                      <li key={i}>{spec}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--gray-400)', fontWeight: 'bold' }}>ELIGIBILITY</span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--primary)', fontWeight: 'bold' }}>{previewReward.exclusive}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Contest;
