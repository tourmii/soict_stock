/**
 * OrderBook Service — persists orders to MongoDB
 */
import { getDb } from './db.js';

export class OrderBookService {
  constructor(engine) {
    this.engine = engine;
  }

  async placeOrder(order) {
    const db = getDb();
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const newOrder = {
      ...order,
      id,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    if (order.orderType === 'Market') {
      return this._executeMarketOrder(newOrder);
    }

    // Persist limit/stop order
    await db.collection('orders').insertOne({ ...newOrder, _id: id });
    return newOrder;
  }

  async _executeMarketOrder(order) {
    const db = getDb();
    const quote = this.engine.getQuote(order.ticker);
    if (!quote) return { ...order, status: 'Rejected', reason: 'Unknown ticker' };

    const slippage = order.quantity * 0.0001 * quote.price;
    const executionPrice = order.type === 'Buy' ? quote.ask + slippage : quote.bid - slippage;

    const filled = {
      ...order,
      price: executionPrice,
      status: 'Filled',
      filledAt: new Date().toISOString(),
      slippage,
    };

    await db.collection('orders').insertOne({ ...filled, _id: filled.id });
    return filled;
  }

  async checkPendingOrders() {
    const db = getDb();
    const pendingOrders = await db.collection('orders')
      .find({ status: 'Pending' })
      .toArray();

    const toFill = [];

    for (const order of pendingOrders) {
      const price = this.engine.prices[order.ticker];
      if (!price) continue;

      let shouldFill = false;
      if (order.orderType === 'Limit') {
        if (order.type === 'Buy' && price <= order.price) shouldFill = true;
        if (order.type === 'Sell' && price >= order.price) shouldFill = true;
      } else if (order.orderType === 'Stop-Loss') {
        if (order.type === 'Sell' && price <= order.price) shouldFill = true;
      }

      if (shouldFill) {
        const filled = {
          ...order,
          status: 'Filled',
          filledAt: new Date().toISOString(),
          executionPrice: price,
        };
        await db.collection('orders').updateOne(
          { _id: order._id },
          { $set: { status: 'Filled', filledAt: filled.filledAt, executionPrice: price } }
        );
        toFill.push(filled);
      }
    }

    return toFill;
  }

  async cancelOrder(id) {
    const db = getDb();
    await db.collection('orders').updateOne(
      { id },
      { $set: { status: 'Cancelled' } }
    );
  }

  async getOpenOrders(userId = null) {
    const db = getDb();
    const query = { status: 'Pending' };
    if (userId) query.userId = userId;
    return db.collection('orders').find(query).sort({ createdAt: -1 }).toArray();
  }

  async getFilledOrders(userId = null) {
    const db = getDb();
    const query = { status: 'Filled' };
    if (userId) query.userId = userId;
    return db.collection('orders').find(query).sort({ filledAt: -1 }).limit(100).toArray();
  }

  getDepth(ticker) {
    const price = this.engine.prices[ticker] || 100;
    const spread = price * 0.002;
    const bids = [], asks = [];
    for (let i = 0; i < 10; i++) {
      bids.push({ price: price - spread * (i + 1) * 0.5, quantity: Math.floor(50 + Math.random() * 500) });
      asks.push({ price: price + spread * (i + 1) * 0.5, quantity: Math.floor(50 + Math.random() * 500) });
    }
    return { bids, asks: asks.reverse(), spread, midPrice: price };
  }
}
