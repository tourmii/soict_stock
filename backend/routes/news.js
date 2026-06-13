import express from 'express';

const router = express.Router();

// GET /api/news — return latest news items
router.get('/', async (req, res) => {
  const newsInjector = req.app.locals.newsInjector;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  try {
    const news = await newsInjector.getNews(limit);
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
