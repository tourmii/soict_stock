import { Router } from 'express';
const router = Router();

router.post('/', async (req, res) => {
  const orderBook = req.app.locals.orderBook;
  const { type, ticker, orderType, quantity, price, userId } = req.body;
  if (!type || !ticker || !orderType || !quantity) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const order = await orderBook.placeOrder({
      type, ticker, orderType,
      quantity: parseInt(quantity),
      price: parseFloat(price) || undefined,
      userId: userId || 'default',
    });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  const orderBook = req.app.locals.orderBook;
  const userId = req.query.userId || null;
  try {
    const open = await orderBook.getOpenOrders(userId);
    const filled = await orderBook.getFilledOrders(userId);
    res.json({ open, filled });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const orderBook = req.app.locals.orderBook;
  try {
    await orderBook.cancelOrder(req.params.id);
    res.json({ message: 'Order cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
