import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const DEFAULT_COLORS = ['#1B3BFC', '#8B5CF6', '#22C55E', '#F59E0B', '#06B6D4', '#EC4899'];

export default function DonutChart({ data, colors = DEFAULT_COLORS, size = 180, innerRadius = 55, outerRadius = 75, showLegend = true }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="donut-chart-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `${((value / total) * 100).toFixed(1)}%`}
              contentStyle={{
                background: 'var(--white)',
                border: 'var(--border-light)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                boxShadow: 'var(--shadow-md)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {showLegend && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', justifyContent: 'center' }}>
          {data.map((item, index) => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)' }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: colors[index % colors.length],
              }} />
              <span style={{ color: 'var(--gray-600)' }}>{item.name}</span>
              <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>
                {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
