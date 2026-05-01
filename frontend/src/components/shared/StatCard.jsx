import SparklineChart from './SparklineChart';

export default function StatCard({ title, value, subtitle, change, sparklineData, icon, accentColor, className = '' }) {
  const isPositive = change != null && parseFloat(change) >= 0;

  return (
    <div className={`card stat-card ${className}`} style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--gray-500)',
            fontWeight: 'var(--fw-medium)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px',
          }}>
            {title}
          </p>
          <p style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--fw-bold)',
            fontFamily: 'var(--font-heading)',
            color: accentColor || 'var(--gray-900)',
            lineHeight: 1.2,
          }}>
            {value}
          </p>
          {(subtitle || change != null) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              {change != null && (
                <span className={`badge ${isPositive ? 'badge-green' : 'badge-red'}`}>
                  {isPositive ? '↑' : '↓'} {change}
                </span>
              )}
              {subtitle && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>{subtitle}</span>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          {icon && (
            <div style={{
              width: 40, height: 40,
              borderRadius: 'var(--radius-lg)',
              background: accentColor ? `${accentColor}15` : 'var(--primary-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px',
            }}>
              {icon}
            </div>
          )}
          {sparklineData && sparklineData.length > 2 && (
            <SparklineChart data={sparklineData} color="auto" height={28} width={72} />
          )}
        </div>
      </div>
    </div>
  );
}
