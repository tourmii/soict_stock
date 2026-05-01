import { Router } from 'express';
const router = Router();

router.post('/', (req, res) => {
  const orderBook = req.app.locals.orderBook;
  const { type, ticker, orderType, quantity, price } = req.body;
  if (!type || !ticker || !orderType || !quantity) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const order = orderBook.placeOrder({ type, ticker, orderType, quantity: parseInt(quantity), price: parseFloat(price) || undefined });
  res.json(order);
});

router.get('/', (req, res) => {
  const orderBook = req.app.locals.orderBook;
  res.json({ open: orderBook.getOpenOrders(), filled: orderBook.getFilledOrders() });
});

router.delete('/:id', (req, res) => {
  const orderBook = req.app.locals.orderBook;
  orderBook.cancelOrder(req.params.id);
  res.json({ message: 'Order cancelled' });
});

export default router;
