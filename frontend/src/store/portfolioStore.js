import { create } from 'zustand';
import { INITIAL_CASH } from '../lib/constants';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const usePortfolioStore = create((set, get) => ({
    cash: INITIAL_CASH,
    initialCash: INITIAL_CASH,
    holdings: {},        // { ticker: { shares, avgPrice, realizedPL } }
    transactions: [],    // { id, type, ticker, orderType, quantity, price, total, time, status }
    portfolioHistory: [], // { time, value }
    dailyPLHistory: [],

    /* Buy shares */
    buy: (ticker, quantity, price, orderType = 'Market') => {
        const total = quantity * price;
        const { cash, holdings, transactions } = get();

        if (total > cash) return false;

        const existing = holdings[ticker] || { shares: 0, avgPrice: 0, realizedPL: 0 };
        const totalShares = existing.shares + quantity;
        const avgPrice = (existing.avgPrice * existing.shares + price * quantity) / totalShares;

        const tx = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            type: 'Buy',
            ticker,
            orderType,
            quantity,
            price,
            total,
            time: new Date().toISOString(),
            status: 'Filled',
        };

        set({
            cash: cash - total,
            holdings: {
                ...holdings,
                [ticker]: { shares: totalShares, avgPrice, realizedPL: existing.realizedPL },
            },
            transactions: [tx, ...transactions],
        });

        // Sync to Supabase in background
        get().syncToSupabase(tx);
        return tx;
    },

    /* Sell shares */
    sell: (ticker, quantity, price, orderType = 'Market') => {
        const { cash, holdings, transactions } = get();
        const existing = holdings[ticker];

        if (!existing || existing.shares < quantity) return false;

        const total = quantity * price;
        const realizedPL = (price - existing.avgPrice) * quantity;
        const remainingShares = existing.shares - quantity;

        const tx = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            type: 'Sell',
            ticker,
            orderType,
            quantity,
            price,
            total,
            time: new Date().toISOString(),
            status: 'Filled',
        };

        const newHoldings = { ...holdings };
        if (remainingShares === 0) {
            newHoldings[ticker] = { shares: 0, avgPrice: 0, realizedPL: existing.realizedPL + realizedPL };
        } else {
            newHoldings[ticker] = {
                shares: remainingShares,
                avgPrice: existing.avgPrice,
                realizedPL: existing.realizedPL + realizedPL,
            };
        }

        set({
            cash: cash + total,
            holdings: newHoldings,
            transactions: [tx, ...transactions],
        });

        // Sync to Supabase in background
        get().syncToSupabase(tx);
        return tx;
    },

    /* Sync portfolio state and transaction to Supabase */
    syncToSupabase: async (tx) => {
        if (!isSupabaseConfigured()) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { cash, holdings, initialCash } = get();

            // Update portfolio
            await supabase
                .from('portfolios')
                .upsert({
                    user_id: user.id,
                    cash,
                    initial_cash: initialCash,
                    holdings,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

            // Insert transaction
            if (tx) {
                await supabase
                    .from('transactions')
                    .insert({
                        user_id: user.id,
                        type: tx.type,
                        ticker: tx.ticker,
                        order_type: tx.orderType,
                        quantity: tx.quantity,
                        price: tx.price,
                        total: tx.total,
                        status: tx.status,
                    });
            }

            // Auto-submit to leaderboard
            const { transactions } = get();
            const portfolioValue = cash + Object.entries(holdings).reduce((sum, [, h]) => {
                return sum + h.shares * (h.avgPrice || 0);
            }, 0);
            const totalReturn = ((portfolioValue - initialCash) / initialCash) * 100;

            const { useLeaderboardStore } = await import('./leaderboardStore');
            useLeaderboardStore.getState().submitScore(portfolioValue, totalReturn, transactions.length);
        } catch (err) {
            console.error('Supabase sync error:', err);
        }
    },

    /* Load portfolio from Supabase */
    loadFromSupabase: async () => {
        if (!isSupabaseConfigured()) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: portfolio } = await supabase
                .from('portfolios')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (portfolio) {
                set({
                    cash: portfolio.cash || INITIAL_CASH,
                    initialCash: portfolio.initial_cash || INITIAL_CASH,
                    holdings: portfolio.holdings || {},
                });
            }

            // Load transactions
            const { data: txData } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(100);

            if (txData) {
                const transactions = txData.map((row) => ({
                    id: row.id,
                    type: row.type,
                    ticker: row.ticker,
                    orderType: row.order_type,
                    quantity: row.quantity,
                    price: row.price,
                    total: row.total,
                    time: row.created_at,
                    status: row.status,
                }));
                set({ transactions });
            }
        } catch (err) {
            console.error('Portfolio load error:', err);
        }
    },

    /* Calculate portfolio value */
    getPortfolioValue: (prices) => {
        const { cash, holdings } = get();
        let stockValue = 0;
        for (const [ticker, holding] of Object.entries(holdings)) {
            if (holding.shares > 0 && prices[ticker]) {
                stockValue += holding.shares * prices[ticker];
            }
        }
        return cash + stockValue;
    },

    /* Get unrealized P&L */
    getUnrealizedPL: (prices) => {
        const { holdings } = get();
        let total = 0;
        for (const [ticker, holding] of Object.entries(holdings)) {
            if (holding.shares > 0 && prices[ticker]) {
                total += (prices[ticker] - holding.avgPrice) * holding.shares;
            }
        }
        return total;
    },

    /* Get realized P&L */
    getTotalRealizedPL: () => {
        const { holdings } = get();
        let total = 0;
        for (const holding of Object.values(holdings)) {
            total += holding.realizedPL || 0;
        }
        return total;
    },

    /* Get total return */
    getTotalReturn: (prices) => {
        const { initialCash } = get();
        const portfolioValue = get().getPortfolioValue(prices);
        return portfolioValue - initialCash;
    },

    /* Get holdings as array with live P&L */
    getHoldingsArray: (prices) => {
        const { holdings } = get();
        return Object.entries(holdings)
            .filter(([, h]) => h.shares > 0)
            .map(([ticker, h]) => {
                const currentPrice = prices[ticker] || 0;
                const marketValue = h.shares * currentPrice;
                const unrealizedPL = (currentPrice - h.avgPrice) * h.shares;
                const unrealizedPLPercent = h.avgPrice > 0 ? ((currentPrice - h.avgPrice) / h.avgPrice) * 100 : 0;
                return {
                    ticker,
                    shares: h.shares,
                    avgPrice: h.avgPrice,
                    currentPrice,
                    marketValue,
                    unrealizedPL,
                    unrealizedPLPercent,
                    realizedPL: h.realizedPL,
                };
            })
            .sort((a, b) => b.marketValue - a.marketValue);
    },

    /* Get allocation breakdown */
    getAllocation: (prices) => {
        const { cash } = get();
        const holdingsArr = get().getHoldingsArray(prices);
        const totalValue = get().getPortfolioValue(prices);

        const stockValue = holdingsArr.reduce((sum, h) => sum + h.marketValue, 0);
        return {
            stocks: totalValue > 0 ? (stockValue / totalValue) * 100 : 0,
            cash: totalValue > 0 ? (cash / totalValue) * 100 : 100,
            etfs: 0,
            other: 0,
        };
    },

    /* Record a snapshot of portfolio value for history chart */
    recordSnapshot: (prices) => {
        const value = get().getPortfolioValue(prices);
        const now = new Date().toISOString();
        
        set((s) => ({
            portfolioHistory: [...s.portfolioHistory.slice(-99), { time: now, value }]
        }));

        // Auto-submit to leaderboard if user is logged in
        get().submitToLeaderboard(prices);
    },

    /* Submit current performance to Supabase leaderboard */
    submitToLeaderboard: async (prices) => {
        if (!isSupabaseConfigured()) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const totalValue = get().getPortfolioValue(prices);
            const { initialCash, transactions } = get();
            const totalReturn = initialCash !== 0 ? ((totalValue - initialCash) / initialCash) * 100 : 0;
            
            const entry = {
                user_id: user.id,
                user_name: user.user_metadata?.display_name || user.email.split('@')[0],
                portfolio_value: totalValue,
                total_return: totalReturn,
                trade_count: transactions.length,
                updated_at: new Date().toISOString()
            };

            await supabase.from('leaderboard_entries').upsert(entry, { onConflict: 'user_id' });
        } catch (err) {
            console.error('Leaderboard submission error:', err);
        }
    },

    /* Reset portfolio */
    reset: () =>
        set({
            cash: INITIAL_CASH,
            holdings: {},
            transactions: [],
            portfolioHistory: [],
            dailyPLHistory: [],
        }),
}));
