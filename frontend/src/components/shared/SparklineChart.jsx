import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function SparklineChart({ data, color = 'var(--primary)', height = 32, width = 80 }) {
  const chartData = (data || []).map((value, index) => ({ value, index }));
  const isPositive = chartData.length >= 2 && chartData[chartData.length - 1].value >= chartData[0].value;
  const lineColor = color === 'auto' ? (isPositive ? '#22C55E' : '#EF4444') : color;

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
