import { Router } from 'express';
const router = Router();

router.post('/chat', (req, res) => {
  const { message, mode, context } = req.body;

  // Mock AI advisor response
  const responses = {
    trend: {
      recommendation: 'In the simulation, SCT can be used as an example to study trend-following behavior. Review chart context, news, and position size before placing any practice trade.',
      rationale: 'This response is based on simulated momentum indicators and does not predict real market performance.',
      risk: 'Use this only as educational guidance. No simulated signal guarantees profit, and position size should be reviewed carefully.',
    },
    mean_reversion: {
      recommendation: 'In the simulation, HEAL can be used as an example for studying mean-reversion behavior after a sharp move.',
      rationale: 'A low RSI can help learners discuss oversold conditions, but it is not a real buy signal and does not guarantee a bounce.',
      risk: 'Mean reversion can continue moving against the learner. Treat this as practice for scenario review and risk planning.',
    },
    value: {
      recommendation: 'In the simulation, GRN can be used as an example for studying value-style reasoning. This is not a real investment recommendation.',
      rationale: 'The mock valuation comparison is for education only and should be paired with risk factors and scenario assumptions.',
      risk: 'Value-style ideas can still lose value. Use this as simulation-only learning, not as a real trading plan.',
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
