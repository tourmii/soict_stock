export function analyzePortfolioRisk(context = {}) {
  const holdings = context.portfolio?.holdingsArray || [];
  const totalValue = context.portfolio?.portfolioValue || 0;
  const largestHolding = holdings[0];
  const largestHoldingPct = totalValue > 0 && largestHolding ? (largestHolding.marketValue / totalValue) * 100 : 0;
  const largestSector = context.portfolio?.sectorAllocation?.[0] || null;
  const largestSectorPct = largestSector?.percentage || 0;
  const holdingCount = holdings.length;
  const sectorCount = context.portfolio?.sectorAllocation?.length || 0;

  let level = 'Low';
  const reasons = [];
  if (largestHoldingPct >= 50 || largestSectorPct >= 60 || holdingCount < 3) {
    level = 'High';
    if (largestHoldingPct >= 50) reasons.push('largest holding is above 50% of simulated portfolio value');
    if (largestSectorPct >= 60) reasons.push('largest sector is above 60% of invested value');
    if (holdingCount < 3) reasons.push('there are fewer than 3 active holdings');
  } else if (largestHoldingPct >= 30 || largestSectorPct >= 40 || sectorCount < 3) {
    level = 'Moderate';
    if (largestHoldingPct >= 30) reasons.push('largest holding is above 30%');
    if (largestSectorPct >= 40) reasons.push('largest sector is above 40%');
    if (sectorCount < 3) reasons.push('sector spread is still limited');
  } else {
    reasons.push('holdings are spread across several stocks and sectors');
  }

  return { level, reasons, largestHolding, largestHoldingPct, largestSector, largestSectorPct };
}

export function analyzeTradeBehavior(context = {}) {
  const transactions = context.portfolio?.transactions || [];
  const latest = transactions[0];
  const portfolioValue = context.portfolio?.portfolioValue || 0;
  const largeTrade = latest && portfolioValue > 0 && latest.total > portfolioValue * 0.25;
  return {
    transactionCount: transactions.length,
    latest,
    possibleOvertrading: transactions.length >= 10,
    largeTrade,
  };
}
