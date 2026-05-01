/**
 * Technical indicators for backtesting and chart overlays
 */

/**
 * Simple Moving Average
 */
export function SMA(data, period) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      result.push(sum / period);
    }
  }
  return result;
}

/**
 * Exponential Moving Average
 */
export function EMA(data, period) {
  const result = [];
  const multiplier = 2 / (period + 1);
  let ema = data[0];
  result.push(ema);

  for (let i = 1; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
    result.push(i >= period - 1 ? ema : null);
  }
  return result;
}

/**
 * Relative Strength Index
 */
export function RSI(data, period = 14) {
  const result = [];
  const gains = [];
  const losses = [];

  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  result.push(null); // first point has no RSI

  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    } else {
      const prevRSI = result[result.length - 1];
      if (prevRSI === null) {
        result.push(null);
        continue;
      }
      const avgGain = (gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)) / period;
      const avgLoss = (losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }
  return result;
}

/**
 * Bollinger Bands
 */
export function BollingerBands(data, period = 20, stdDev = 2) {
  const sma = SMA(data, period);
  const upper = [];
  const lower = [];

  for (let i = 0; i < data.length; i++) {
    if (sma[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const sd = Math.sqrt(variance);
      upper.push(mean + stdDev * sd);
      lower.push(mean - stdDev * sd);
    }
  }

  return { upper, middle: sma, lower };
}

/**
 * MACD
 */
export function MACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEMA = EMA(data, fastPeriod);
  const slowEMA = EMA(data, slowPeriod);
  const macdLine = fastEMA.map((fast, i) =>
    fast !== null && slowEMA[i] !== null ? fast - slowEMA[i] : null
  );
  const validMACD = macdLine.filter((v) => v !== null);
  const signalLine = EMA(validMACD, signalPeriod);
  
  // Pad signal line
  const paddedSignal = [];
  let signalIdx = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null) {
      paddedSignal.push(null);
    } else {
      paddedSignal.push(signalLine[signalIdx] || null);
      signalIdx++;
    }
  }

  const histogram = macdLine.map((m, i) =>
    m !== null && paddedSignal[i] !== null ? m - paddedSignal[i] : null
  );

  return { macd: macdLine, signal: paddedSignal, histogram };
}
