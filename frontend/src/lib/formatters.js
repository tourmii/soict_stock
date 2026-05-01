/**
 * Format a number as currency (USD)
 */
export function formatCurrency(value, compact = false) {
  if (value == null || isNaN(value)) return '$0.00';
  if (compact && Math.abs(value) >= 1000) {
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    const tier = Math.floor(Math.log10(Math.abs(value)) / 3);
    const scaled = value / Math.pow(10, tier * 3);
    return `$${scaled.toFixed(2)}${suffixes[tier]}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number as percentage
 */
export function formatPercent(value, decimals = 2) {
  if (value == null || isNaN(value)) return '0.00%';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a number as percentage from raw percent value (not decimal)
 */
export function formatPercentRaw(value, decimals = 2) {
  if (value == null || isNaN(value)) return '0.00%';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format a number with commas
 */
export function formatNumber(value, decimals = 2) {
  if (value == null || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a date/time
 */
export function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format relative time (e.g. "2 min ago")
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/**
 * Format price change with sign and color class
 */
export function formatPriceChange(change, changePercent) {
  const sign = change >= 0 ? '+' : '';
  return {
    text: `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`,
    className: change >= 0 ? 'text-green' : 'text-red',
    isPositive: change >= 0,
  };
}

/**
 * Generate a color for a value on a green-red scale
 */
export function getChangeColor(value) {
  if (value > 0) return 'var(--green)';
  if (value < 0) return 'var(--red)';
  return 'var(--gray-500)';
}
