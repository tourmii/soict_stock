import { create } from 'zustand';

export const useOrderStore = create((set, get) => ({
  openOrders: [],  // { id, type, ticker, orderType, quantity, price, status, createdAt }

  addOrder: (order) =>
    set((s) => ({
      openOrders: [
        {
          ...order,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          status: 'Pending',
          createdAt: new Date().toISOString(),
        },
        ...s.openOrders,
      ],
    })),

  fillOrder: (orderId) =>
    set((s) => ({
      openOrders: s.openOrders.map((o) =>
        o.id === orderId ? { ...o, status: 'Filled' } : o
      ),
    })),

  cancelOrder: (orderId) =>
    set((s) => ({
      openOrders: s.openOrders.filter((o) => o.id !== orderId),
    })),

  /* Check and execute limit/stop orders */
  checkOrders: (prices, executeTrade) => {
    const { openOrders } = get();
    const toFill = [];

    for (const order of openOrders) {
      if (order.status !== 'Pending') continue;
      const currentPrice = prices[order.ticker];
      if (!currentPrice) continue;

      if (order.orderType === 'Limit') {
        if (order.type === 'Buy' && currentPrice <= order.price) {
          toFill.push(order);
        } else if (order.type === 'Sell' && currentPrice >= order.price) {
          toFill.push(order);
        }
      } else if (order.orderType === 'Stop-Loss') {
        if (order.type === 'Sell' && currentPrice <= order.price) {
          toFill.push(order);
        }
      }
    }

    for (const order of toFill) {
      const price = prices[order.ticker]; // execute at current market price
      const success = executeTrade(order.type, order.ticker, order.quantity, price, order.orderType);
      if (success) {
        get().fillOrder(order.id);
      }
    }
  },

  getOpenOrderCount: () => get().openOrders.filter((o) => o.status === 'Pending').length,
}));
