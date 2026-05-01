import { Router } from 'express';
const router = Router();

const SCENARIOS = {
  crisis_2008: { name: '2008 Financial Crisis', driftOverrides: { crisis: -0.003 }, volatilityMultipliers: { crisis: 2.5 } },
  tech_bubble: { name: '2000 Tech Bubble', driftOverrides: { bubble: 0.004 }, volatilityMultipliers: { bubble: 1.5 } },
  covid_2020: { name: 'COVID March 2020', driftOverrides: { covid: -0.008 }, volatilityMultipliers: { covid: 4.0 } },
  inflation: { name: 'High Inflation', driftOverrides: { inflation: -0.0005 }, volatilityMultipliers: { inflation: 1.3 } },
};

router.post('/:id/activate', (req, res) => {
  const engine = req.app.locals.engine;
  const scenario = SCENARIOS[req.params.id];
  if (!scenario) return res.status(404).json({ message: 'Scenario not found' });

  engine.setRegime(req.params.id, scenario);
  res.json({ message: `Activated: ${scenario.name}`, scenario: req.params.id });
});

router.post('/deactivate', (req, res) => {
  const engine = req.app.locals.engine;
  engine.setRegime('normal', {});
  res.json({ message: 'Scenario deactivated' });
});

export default router;
