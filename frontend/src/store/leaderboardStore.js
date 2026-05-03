import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const useLeaderboardStore = create((set, get) => ({
  entries: [],
  period: 'all-time',
  userRank: null,
  loaded: false,

  setPeriod: (period) => {
    set({ period });
    get().fetchFromSupabase();
  },

  setEntries: (entries) => set({ entries }),

  /* Fetch leaderboard from Supabase */
  fetchFromSupabase: async () => {
    if (!isSupabaseConfigured()) {
      set({ loaded: true });
      return;
    }

    try {
      const { period } = get();
      const { data, error } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('period', period)
        .order('portfolio_value', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Leaderboard fetch error:', error);
        set({ loaded: true });
        return;
      }

      const entries = (data || []).map((row, i) => ({
        rank: i + 1,
        userId: row.user_id,
        name: row.display_name,
        portfolio: row.portfolio_value,
        return: row.total_return,
        sharpe: row.sharpe_ratio || 0,
        badge: null,
        trades: row.trades_count || 0,
      }));

      // Find current user rank
      let userRank = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const idx = entries.findIndex((e) => e.userId === user.id);
          userRank = idx >= 0 ? idx + 1 : null;
        }
      } catch (_) {}

      set({ entries, userRank, loaded: true });
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      set({ loaded: true });
    }
  },

  /* Submit user score */
  submitScore: async (portfolioValue, totalReturn, tradesCount) => {
    if (!isSupabaseConfigured()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      const displayName = profile?.display_name || user.email?.split('@')[0] || 'Trader';

      await supabase
        .from('leaderboard_entries')
        .upsert({
          user_id: user.id,
          display_name: displayName,
          portfolio_value: portfolioValue,
          total_return: totalReturn,
          sharpe_ratio: 0,
          trades_count: tradesCount,
          period: 'all-time',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,period' });

      // Refresh leaderboard
      await get().fetchFromSupabase();
    } catch (err) {
      console.error('Score submit error:', err);
    }
  },
}));
