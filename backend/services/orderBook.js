export class OrderBookService {
  constructor(engine) {
    this.engine = engine;
    this.orders = [];
    this.filledOrders = [];
  }

  placeOrder(order) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const newOrder = { ...order, id, status: 'Pending', createdAt: new Date().toISOString() };

    if (order.orderType === 'Market') {
      return this._executeMarketOrder(newOrder);
    }

    this.orders.push(newOrder);
    return newOrder;
  }

  _executeMarketOrder(order) {
    const quote = this.engine.getQuote(order.ticker);
    if (!quote) return { ...order, status: 'Rejected', reason: 'Unknown ticker' };

    const slippage = order.quantity * 0.0001 * quote.price;
    const executionPrice = order.type === 'Buy' ? quote.ask + slippage : quote.bid - slippage;

    const filled = { ...order, price: executionPrice, status: 'Filled', filledAt: new Date().toISOString(), slippage };
    this.filledOrders.push(filled);
    return filled;
  }

  checkPendingOrders() {
    const toFill = [];
    const remaining = [];

    for (const order of this.orders) {
      if (order.status !== 'Pending') { remaining.push(order); continue; }
      const price = this.engine.prices[order.ticker];
      if (!price) { remaining.push(order); continue; }

      let shouldFill = false;
      if (order.orderType === 'Limit') {
        if (order.type === 'Buy' && price <= order.price) shouldFill = true;
        if (order.type === 'Sell' && price >= order.price) shouldFill = true;
      } else if (order.orderType === 'Stop-Loss') {
        if (order.type === 'Sell' && price <= order.price) shouldFill = true;
      }

      if (shouldFill) {
        const filled = { ...order, status: 'Filled', filledAt: new Date().toISOString(), executionPrice: price };
        this.filledOrders.push(filled);
        toFill.push(filled);
      } else {
        remaining.push(order);
      }
    }

    this.orders = remaining;
    return toFill;
  }

  cancelOrder(id) {
    this.orders = this.orders.filter((o) => o.id !== id);
  }

  getOpenOrders() { return this.orders.filter((o) => o.status === 'Pending'); }
  getFilledOrders() { return this.filledOrders; }

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
