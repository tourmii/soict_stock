import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

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

    get().syncOrderToSupabase(newOrder);
    return newOrder;
  },

  fillOrder: (orderId) => {
    set((s) => ({
      openOrders: s.openOrders.map((o) =>
        o.id === orderId ? { ...o, status: 'Filled' } : o
      ),
    }));
    get().updateOrderStatusInSupabase(orderId, 'Filled');
  },

  cancelOrder: (orderId) => {
    set((s) => ({
      openOrders: s.openOrders.filter((o) => o.id !== orderId),
    }));
    get().updateOrderStatusInSupabase(orderId, 'Cancelled');
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

  syncOrderToSupabase: async (order) => {
    if (!isSupabaseConfigured()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('orders')
        .upsert({
          id: order.id,
          user_id: user.id,
          type: order.type,
          ticker: order.ticker,
          order_type: order.orderType,
          quantity: order.quantity,
          price: order.price,
          status: order.status,
          created_at: order.createdAt,
          updated_at: new Date().toISOString(),
        });

      if (error) console.error('Order sync error:', error);
    } catch (err) {
      console.error('Order sync error:', err);
    }
  },

  updateOrderStatusInSupabase: async (orderId, status) => {
    if (!isSupabaseConfigured()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('user_id', user.id);

      if (error) console.error('Order status sync error:', error);
    } catch (err) {
      console.error('Order status sync error:', err);
    }
  },

  loadFromSupabase: async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'Pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Order load error:', error);
        return;
      }

      set({
        openOrders: (data || []).map((row) => ({
          id: row.id,
          type: row.type,
          ticker: row.ticker,
          orderType: row.order_type,
          quantity: row.quantity,
          price: row.price,
          status: row.status,
          createdAt: row.created_at,
        })),
      });
    } catch (err) {
      console.error('Order load error:', err);
    }
  },

  getOpenOrderCount: () => get().openOrders.filter((o) => o.status === 'Pending').length,
}));
