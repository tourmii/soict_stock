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
    buy: (ticker, quantity, price, orderType = 'Market', prices = {}, orderId = null) => {
        const total = quantity * price;
        const { cash, holdings, transactions } = get();

        if (total > cash) return false;

        const existing = holdings[ticker] || { shares: 0, avgPrice: 0, realizedPL: 0 };
        const totalShares = existing.shares + quantity;
        const avgPrice = (existing.avgPrice * existing.shares + price * quantity) / totalShares;

        const tx = {
            id: orderId || Date.now().toString() + Math.random().toString(36).substr(2, 5),
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
        get().syncToSupabase(tx, prices);
        return tx;
    },

    /* Sell shares */
    sell: (ticker, quantity, price, orderType = 'Market', prices = {}, orderId = null) => {
        const { cash, holdings, transactions } = get();
        const existing = holdings[ticker];

        if (!existing || existing.shares < quantity) return false;

        const total = quantity * price;
        const realizedPL = (price - existing.avgPrice) * quantity;
        const remainingShares = existing.shares - quantity;

        const tx = {
            id: orderId || Date.now().toString() + Math.random().toString(36).substr(2, 5),
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
        get().syncToSupabase(tx, prices);
        return tx;
    },

    /* Sync portfolio state and transaction to Supabase */
    syncToSupabase: async (tx, prices = {}) => {
        if (!isSupabaseConfigured()) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { cash, holdings, initialCash } = get();
            const now = new Date().toISOString();
            const portfolioValue = get().getPortfolioValue(prices);
            const stockValue = Math.max(0, portfolioValue - cash);
            const totalReturn = initialCash !== 0 ? ((portfolioValue - initialCash) / initialCash) * 100 : 0;

            // Update portfolio
            await supabase
                .from('portfolios')
                .upsert({
                    user_id: user.id,
                    cash,
                    initial_cash: initialCash,
                    holdings,
                    updated_at: now,
                }, { onConflict: 'user_id' });

            await get().syncAssetsToSupabase(user.id, prices, now);

            // Insert transaction
            if (tx) {
                await supabase
                    .from('orders')
                    .upsert({
                        id: tx.id,
                        user_id: user.id,
                        type: tx.type,
                        ticker: tx.ticker,
                        order_type: tx.orderType,
                        quantity: tx.quantity,
                        price: tx.price,
                        status: tx.status,
                        created_at: tx.time,
                        updated_at: now,
                    });

                await supabase
                    .from('transactions')
                    .insert({
                        user_id: user.id,
                        order_id: tx.id,
                        type: tx.type,
                        ticker: tx.ticker,
                        order_type: tx.orderType,
                        quantity: tx.quantity,
                        price: tx.price,
                        total: tx.total,
                        status: tx.status,
                    });
            }

            const { transactions } = get();
            await get().savePortfolioSnapshot(user.id, prices, {
                portfolioValue,
                stockValue,
                totalReturn,
                createdAt: now,
            });

            const { useLeaderboardStore } = await import('./leaderboardStore');
            await useLeaderboardStore.getState().submitScore(portfolioValue, totalReturn, transactions.length);
        } catch (err) {
            console.error('Supabase sync error:', err);
        }
    },

    /* Load portfolio from Supabase */
    loadFromSupabase: async (prices = {}) => {
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

            await get().submitToLeaderboard(prices);
        } catch (err) {
            console.error('Portfolio load error:', err);
        }
    },

    /* Calculate portfolio value */
    getPortfolioValue: (prices = {}) => {
        const { cash, holdings } = get();
        let stockValue = 0;
        for (const [ticker, holding] of Object.entries(holdings)) {
            if (holding.shares > 0) {
                stockValue += holding.shares * (prices[ticker] || holding.avgPrice || 0);
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
                const currentPrice = prices[ticker] || h.avgPrice || 0;
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

    /* Store current holdings in normalized asset rows */
    syncAssetsToSupabase: async (userId, prices = {}, updatedAt = new Date().toISOString()) => {
        const { holdings } = get();
        const rows = Object.entries(holdings).map(([ticker, h]) => {
            const marketPrice = prices[ticker] || h.avgPrice || 0;
            const shares = h.shares || 0;
            return {
                user_id: userId,
                ticker,
                shares,
                avg_price: h.avgPrice || 0,
                realized_pl: h.realizedPL || 0,
                market_price: marketPrice,
                market_value: shares * marketPrice,
                unrealized_pl: shares * (marketPrice - (h.avgPrice || 0)),
                updated_at: updatedAt,
            };
        });

        if (rows.length === 0) return;

        const { error } = await supabase
            .from('portfolio_assets')
            .upsert(rows, { onConflict: 'user_id,ticker' });

        if (error) console.error('Asset sync error:', error);
    },

    /* Store value history used for leaderboard queries */
    savePortfolioSnapshot: async (userId, prices = {}, summary = {}) => {
        const { cash, holdings, initialCash } = get();
        const portfolioValue = summary.portfolioValue ?? get().getPortfolioValue(prices);
        const stockValue = summary.stockValue ?? Math.max(0, portfolioValue - cash);
        const totalReturn = summary.totalReturn ?? (initialCash !== 0 ? ((portfolioValue - initialCash) / initialCash) * 100 : 0);

        const { error } = await supabase
            .from('portfolio_snapshots')
            .insert({
                user_id: userId,
                portfolio_value: portfolioValue,
                cash,
                stock_value: stockValue,
                total_return: totalReturn,
                holdings,
                created_at: summary.createdAt || new Date().toISOString(),
            });

        if (error) console.error('Portfolio snapshot error:', error);
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
            const now = new Date().toISOString();

            await get().syncAssetsToSupabase(user.id, prices, now);
            await get().savePortfolioSnapshot(user.id, prices, {
                portfolioValue: totalValue,
                stockValue: Math.max(0, totalValue - get().cash),
                totalReturn,
                createdAt: now,
            });

            const { useLeaderboardStore } = await import('./leaderboardStore');
            await useLeaderboardStore.getState().submitScore(totalValue, totalReturn, transactions.length);
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
