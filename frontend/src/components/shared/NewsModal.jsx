import { useEffect } from 'react';
import { formatRelativeTime } from '../../lib/formatters';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: '20px',
  animation: 'fadeIn 0.2s ease',
};

const modalStyle = {
  background: 'var(--white)',
  borderRadius: 'var(--radius-xl)',
  maxWidth: '560px',
  width: '100%',
  maxHeight: '80vh',
  overflowY: 'auto',
  boxShadow: 'var(--shadow-xl)',
  animation: 'slideUp 0.25s ease',
};

const headerStyle = {
  padding: '24px 24px 16px',
  borderBottom: '1px solid var(--gray-100)',
};

const bodyStyle = {
  padding: '20px 24px',
};

const footerStyle = {
  padding: '16px 24px',
  borderTop: '1px solid var(--gray-100)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
};

export default function NewsModal({ item, onClose }) {
  if (!item) return null;

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const sentimentColor = item.sentiment === 'positive' ? 'var(--green)' : item.sentiment === 'negative' ? 'var(--red)' : 'var(--gray-500)';
  const sentimentIcon = item.sentiment === 'positive' ? '📈' : item.sentiment === 'negative' ? '📉' : '📊';
  const sentimentLabel = item.sentiment === 'positive' ? 'Bullish' : item.sentiment === 'negative' ? 'Bearish' : 'Neutral';

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '18px' }}>{sentimentIcon}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: sentimentColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {sentimentLabel}
                </span>
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, lineHeight: 1.4, color: 'var(--gray-900)' }}>
                {item.headline}
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'var(--gray-100)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px',
                color: 'var(--gray-500)',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', fontSize: '12px', color: 'var(--gray-500)' }}>
            {item.source && (
              <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>{item.source}</span>
            )}
            <span>{formatRelativeTime(item.timestamp)}</span>
          </div>
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          {/* Image */}
          {item.image && (
            <div style={{ marginBottom: '16px', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <img
                src={item.image}
                alt=""
                style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}

          {/* Description */}
          {item.description && (
            <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7, color: 'var(--gray-600)', marginBottom: '16px' }}>
              {item.description}
            </p>
          )}

          {/* Affected Stocks */}
          {item.affectedTickers && item.affectedTickers.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {item.isMarketWide ? 'Market-Wide Impact' : 'Affected Stocks'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {item.affectedTickers.map((ticker) => (
                  <span
                    key={ticker}
                    className={`badge ${item.sentiment === 'positive' ? 'badge-green' : item.sentiment === 'negative' ? 'badge-red' : 'badge-gray'}`}
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    {item.sentiment === 'positive' ? '↑' : item.sentiment === 'negative' ? '↓' : '•'} {ticker}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Impact Indicator */}
          {item.impact && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: item.sentiment === 'positive' ? 'rgba(34,197,94,0.08)' : item.sentiment === 'negative' ? 'rgba(239,68,68,0.08)' : 'var(--gray-50)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-600)' }}>Estimated Impact</span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: sentimentColor }}>
                {item.impact > 0 ? '+' : ''}{(item.impact * 100).toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>
            {item.source === 'SoictStock Simulation' ? 'Simulated news event' : 'Source: ' + (item.source || 'Unknown')}
          </span>
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{ textDecoration: 'none', fontSize: '12px' }}
            >
              Read Full Article →
            </a>
          ) : (
            <button onClick={onClose} className="btn btn-outline btn-sm" style={{ fontSize: '12px' }}>
              Close
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
