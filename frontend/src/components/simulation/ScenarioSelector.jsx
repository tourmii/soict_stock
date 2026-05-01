import { useState } from 'react';
import { useMarketStore } from '../../store/marketStore';

const SCENARIOS = [
  { id: 'normal', name: 'Normal Market', desc: 'Standard market conditions with historical averages.', icon: '📈' },
  { id: 'crisis_2008', name: '2008 Financial Crisis', desc: 'High volatility, strong downward drift across all sectors.', icon: '📉' },
  { id: 'tech_bubble', name: '2000 Tech Bubble', desc: 'High volatility, massive upward drift for tech stocks.', icon: '🚀' },
  { id: 'covid_2020', name: 'COVID March 2020', desc: 'Extreme volatility, rapid crash followed by sector-specific recovery.', icon: '🦠' },
  { id: 'inflation', name: 'High Inflation', desc: 'Persistent moderate downward drift, increased volatility.', icon: '💸' },
];

export default function ScenarioSelector() {
  const regime = useMarketStore((s) => s.regime);
  const setRegime = useMarketStore((s) => s.setRegime);
  const isConnected = useMarketStore((s) => s.isConnected);
  const [isOpen, setIsOpen] = useState(false);

  const activeScenario = SCENARIOS.find((s) => s.id === regime) || SCENARIOS[0];

  const handleSelect = async (scenarioId) => {
    setRegime(scenarioId);
    setIsOpen(false);
    
    if (isConnected) {
      try {
        if (scenarioId === 'normal') {
          await fetch('/api/scenarios/deactivate', { method: 'POST' });
        } else {
          await fetch(`/api/scenarios/${scenarioId}/activate`, { method: 'POST' });
        }
      } catch (err) {
        console.error('Failed to sync scenario with backend', err);
      }
    } else {
      // Apply locally if disconnected
      const marketStore = useMarketStore.getState();
      if (scenarioId === 'normal') {
        marketStore.setRegime('normal');
      } else {
        marketStore.setRegime(scenarioId); // The local simulateTick doesn't fully support overrides yet, but it stores the state.
      }
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-outline btn-sm"
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <span>{activeScenario.icon}</span>
        <span>{activeScenario.name}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '320px', background: 'var(--white)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--gray-200)', zIndex: 100, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-100)', background: 'var(--gray-50)' }}>
            <h5 style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Market Scenarios</h5>
            <p style={{ fontSize: '11px', color: 'var(--gray-500)' }}>Select a historical or hypothetical market regime to simulate.</p>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {SCENARIOS.map((s) => (
              <div 
                key={s.id} 
                onClick={() => handleSelect(s.id)}
                style={{ padding: '12px 16px', display: 'flex', gap: '12px', cursor: 'pointer', borderBottom: '1px solid var(--gray-50)', background: regime === s.id ? 'var(--primary-bg)' : 'transparent', transition: 'background 0.15s' }}
                onMouseEnter={(e) => { if (regime !== s.id) e.currentTarget.style.background = 'var(--gray-50)' }}
                onMouseLeave={(e) => { if (regime !== s.id) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ fontSize: '20px', marginTop: '2px' }}>{s.icon}</div>
                <div>
                  <h6 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: regime === s.id ? 'var(--primary)' : 'var(--gray-900)' }}>{s.name}</h6>
                  <p style={{ fontSize: '11px', color: 'var(--gray-500)', lineHeight: 1.4, marginTop: '2px' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
