import { Router } from 'express';
const router = Router();

router.post('/chat', (req, res) => {
  const { message, mode, context } = req.body;

  // Mock AI advisor response
  const responses = {
    trend: {
      recommendation: 'Based on current market momentum, consider increasing your position in SCT which shows strong upward trend with increasing volume.',
      rationale: 'SCT has maintained above its 20-day SMA for 8 consecutive sessions with expanding volume. RSI at 62 indicates bullish momentum without overbought conditions.',
      risk: 'Set a stop-loss at 3% below current price to protect against trend reversal. Position size should not exceed 20% of portfolio.',
    },
    mean_reversion: {
      recommendation: 'HEAL appears oversold with RSI below 30. Consider a small position anticipating a bounce back to the mean.',
      rationale: 'HEAL has declined 8% from its 20-day average, historically it reverts within 3-5 sessions. Volume on the decline is decreasing, suggesting selling pressure is exhausting.',
      risk: 'Mean reversion strategies have a ~60% win rate. Use a tight stop at 2% to limit downside. Scale in with 2-3 entries.',
    },
    value: {
      recommendation: 'GRN is trading at an attractive valuation relative to its sector peers. Long-term accumulation recommended.',
      rationale: 'GRN trades at 15x forward earnings vs sector average of 22x. Strong fundamentals with growing revenue and expanding margins.',
      risk: 'Value traps are a risk. Ensure the company has a catalyst for revaluation. Dollar-cost average over 4-6 weeks.',
    },
  };

  const response = responses[mode] || responses.trend;

  res.json({
    message: response.recommendation,
    rationale: response.rationale,
    risk: response.risk,
    mode,
    timestamp: new Date().toISOString(),
  });
});

router.post('/backtest', (req, res) => {
  const { ticker, strategy, timeframe, initialCapital } = req.body;
  
  // Basic mock backtest logic to return synthetic data
  const baseReturn = strategy === 'sma_crossover' ? 0.15 : strategy === 'mean_reversion' ? 0.12 : strategy === 'momentum' ? 0.18 : 0.08;
  const timeMult = timeframe === '1M' ? 1/12 : timeframe === '3M' ? 3/12 : timeframe === '1Y' ? 1 : 5;
  const noise = (Math.random() - 0.5) * 0.1;
  
  const totalReturn = (baseReturn * timeMult + noise) * 100;
  const finalValue = initialCapital * (1 + totalReturn / 100);
  const winRate = 50 + Math.random() * 20;
  const maxDrawdown = -(Math.random() * 15 + 5);
  
  const equityCurve = [];
  const steps = 100;
  let currentEquity = initialCapital;
  for(let i=0; i<=steps; i++) {
    const progress = i/steps;
    const path = progress * (totalReturn/100) + (Math.random()-0.5)*0.05*progress;
    equityCurve.push({
      time: i,
      equity: initialCapital * (1 + path)
    });
  }

  setTimeout(() => {
    res.json({
      finalValue,
      totalReturn,
      winRate,
      maxDrawdown,
      trades: Math.floor(Math.random() * 50) + 10,
      equityCurve
    });
  }, 800); // simulate processing delay
});

export default router;
