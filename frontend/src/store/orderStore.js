import { create } from 'zustand';
import { api } from '../lib/api';

export const useOrderStore = create((set, get) => ({
  openOrders: [],  // { id, type, ticker, orderType, quantity, price, status, createdAt }

  addOrder: (order) => {
    const newOrder = {
      ...order,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    set((s) => ({
      openOrders: [newOrder, ...s.openOrders],
    }));

    // Sync to backend
    api.placeOrder(newOrder).catch((err) => console.error('Order sync error:', err));

    return newOrder;
  },

  fillOrder: (orderId) => {
    set((s) => ({
      openOrders: s.openOrders.map((o) =>
        o.id === orderId ? { ...o, status: 'Filled' } : o
      ),
    }));
  },

  cancelOrder: (orderId) => {
    set((s) => ({
      openOrders: s.openOrders.filter((o) => o.id !== orderId),
    }));
    api.cancelOrder(orderId).catch((err) => console.error('Order cancel error:', err));
  },

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
      const success = executeTrade(order.type, order.ticker, order.quantity, price, order.orderType, order.id);
      if (success) {
        get().fillOrder(order.id);
      }
    }
  },

  loadFromBackend: async () => {
    try {
      const data = await api.getOrders();
      if (data?.open) {
        set({
          openOrders: data.open.map((row) => ({
            id: row.id || row._id,
            type: row.type,
            ticker: row.ticker,
            orderType: row.orderType || row.order_type,
            quantity: row.quantity,
            price: row.price,
            status: row.status,
            createdAt: row.createdAt || row.created_at,
          })),
        });
      }
    } catch (err) {
      console.error('Order load error:', err);
    }
  },

  getOpenOrderCount: () => get().openOrders.filter((o) => o.status === 'Pending').length,
}));
