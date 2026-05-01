export class RiskMetrics {
  sharpeRatio(returns, riskFreeRate = 0.02 / 252) {
    if (returns.length < 2) return 0;
    const avgReturn = returns.reduce((s, r) => s + r, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);
    if (stdDev === 0) return 0;
    return ((avgReturn - riskFreeRate) / stdDev) * Math.sqrt(252);
  }

  maxDrawdown(values) {
    if (values.length < 2) return 0;
    let peak = values[0];
    let maxDD = 0;
    for (const val of values) {
      if (val > peak) peak = val;
      const dd = (peak - val) / peak;
      if (dd > maxDD) maxDD = dd;
    }
    return maxDD;
  }

  volatility(returns, annualized = true) {
    if (returns.length < 2) return 0;
    const avg = returns.reduce((s, r) => s + r, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + (r - avg) ** 2, 0) / (returns.length - 1);
    const daily = Math.sqrt(variance);
    return annualized ? daily * Math.sqrt(252) : daily;
  }

  beta(portfolioReturns, marketReturns) {
    if (portfolioReturns.length !== marketReturns.length || portfolioReturns.length < 2) return 1;
    const n = portfolioReturns.length;
    const avgP = portfolioReturns.reduce((s, r) => s + r, 0) / n;
    const avgM = marketReturns.reduce((s, r) => s + r, 0) / n;
    let covariance = 0, marketVariance = 0;
    for (let i = 0; i < n; i++) {
      covariance += (portfolioReturns[i] - avgP) * (marketReturns[i] - avgM);
      marketVariance += (marketReturns[i] - avgM) ** 2;
    }
    return marketVariance === 0 ? 1 : covariance / marketVariance;
  }

  winRate(trades) {
    if (trades.length === 0) return 0;
    const wins = trades.filter((t) => t.pnl > 0).length;
    return wins / trades.length;
  }

  profitFactor(trades) {
    const grossProfit = trades.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
    const grossLoss = Math.abs(trades.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
    return grossLoss === 0 ? Infinity : grossProfit / grossLoss;
  }
}
