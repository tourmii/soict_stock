export default function Badge({ children, variant = 'primary', size = 'default' }) {
  const sizeStyles = size === 'sm' ? { fontSize: '11px', padding: '2px 8px' } : {};
  return (
    <span className={`badge badge-${variant}`} style={sizeStyles}>
      {children}
    </span>
  );
}
