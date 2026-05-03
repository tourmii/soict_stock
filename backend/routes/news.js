import express from 'express';

const router = express.Router();

// GET /api/news — return latest news items
router.get('/', (req, res) => {
  const newsInjector = req.app.locals.newsInjector;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const news = newsInjector.getNews(limit);
  res.json(news);
});

export default router;
