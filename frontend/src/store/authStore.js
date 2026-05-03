import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,

  /* Initialize auth listener */
  initialize: async () => {
    if (!isSupabaseConfigured()) {
      set({ loading: false });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        set({ user: session.user, session });
        await get().fetchProfile();
      }
    } catch (err) {
      console.error('Auth init error:', err);
    } finally {
      set({ loading: false });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      set({ user: session?.user || null, session: session || null });
      if (session?.user) {
        await get().fetchProfile();
      } else {
        set({ profile: null });
      }
    });
  },

  /* Fetch user profile */
  fetchProfile: async () => {
    if (!isSupabaseConfigured()) return;
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) set({ profile: data });
    if (error) console.error('Profile fetch error:', error);
  },

  /* Sign up with email/password */
  signUp: async (email, password, displayName) => {
    if (!isSupabaseConfigured()) {
      set({ error: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env' });
      return { error: { message: 'Supabase not configured' } };
    }

    set({ loading: true, error: null });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email.split('@')[0] },
      },
    });

    if (error) {
      set({ error: error.message, loading: false });
      return { error };
    }

    set({ user: data.user, session: data.session, loading: false });
    return { data };
  },

  /* Sign in with email/password */
  signIn: async (email, password) => {
    if (!isSupabaseConfigured()) {
      set({ error: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env' });
      return { error: { message: 'Supabase not configured' } };
    }

    set({ loading: true, error: null });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ error: error.message, loading: false });
      return { error };
    }

    set({ user: data.user, session: data.session, loading: false });
    return { data };
  },

  /* Sign out */
  signOut: async () => {
    if (!isSupabaseConfigured()) return;

    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, error: null });
  },

  /* Update display name */
  updateDisplayName: async (displayName) => {
    if (!isSupabaseConfigured()) return;
    const { user } = get();
    if (!user) return;

    const { error } = await supabase
      .from('user_profiles')
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (!error) {
      set((s) => ({
        profile: { ...s.profile, display_name: displayName },
      }));
    }
  },

  clearError: () => set({ error: null }),
}));
