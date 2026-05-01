import { Router } from 'express';
const router = Router();

router.get('/stocks', (req, res) => {
  const engine = req.app.locals.engine;
  const stocks = engine.stocks.map((s) => ({
    ...s,
    price: engine.prices[s.ticker],
    quote: engine.getQuote(s.ticker),
  }));
  res.json(stocks);
});

router.get('/history/:ticker', (req, res) => {
  const engine = req.app.locals.engine;
  const { ticker } = req.params;
  const { timeframe = 'All' } = req.query;
  const history = engine.histories[ticker];
  if (!history) return res.status(404).json({ message: 'Ticker not found' });

  const now = Math.floor(Date.now() / 1000);
  const ranges = { '1D': 86400, '1W': 604800, '1M': 2592000, '3M': 7776000, '1Y': 31536000, 'All': Infinity };
  const cutoff = now - (ranges[timeframe] || Infinity);
  const filtered = history.filter((bar) => bar.time >= cutoff);
  res.json(filtered);
});

router.get('/quote/:ticker', (req, res) => {
  const engine = req.app.locals.engine;
  const quote = engine.getQuote(req.params.ticker);
  if (!quote) return res.status(404).json({ message: 'Ticker not found' });
  res.json(quote);
});

export default router;
