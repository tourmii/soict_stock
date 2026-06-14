import { create } from 'zustand';
import { api } from '../lib/api';

/**
 * Auth store — uses MongoDB backend for user authentication.
 * Session token (userId) is stored in localStorage for persistence.
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,

  /* Initialize — check for stored session */
  initialize: async () => {
    try {
      const storedUserId = localStorage.getItem('soict_userId');
      if (storedUserId) {
        try {
          const data = await api.getProfile(storedUserId);
          const user = data?.user;
          if (!user?.id) {
            localStorage.removeItem('soict_userId');
            set({ loading: false });
            return;
          }
          set({ user, profile: user, session: { userId: user.id }, loading: false });
        } catch {
          localStorage.removeItem('soict_userId');
          set({ loading: false });
        }
      } else {
        set({ loading: false });
      }
    } catch (err) {
      console.error('Auth init error:', err);
      set({ loading: false });
    }
  },

  /* Fetch user profile */
  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const data = await api.getProfile(user.id);
      set({ profile: data.user });
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  },

  /* Sign up — create account via backend (requires email verification before sign in) */
  signUp: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      const data = await api.signUp(email, password, displayName);
      set({ loading: false });
      return { data: { message: data.message } };
    } catch (err) {
      const msg = err.message || 'Sign up failed';
      set({ error: msg, loading: false });
      return { error: { message: msg } };
    }
  },

  /* Sign in — authenticate via backend */
  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await api.signIn(email, password);
      const user = data?.user;
      if (!user?.id) throw new Error('Unexpected response from server');
      localStorage.setItem('soict_userId', user.id);
      set({ user, profile: user, session: { userId: user.id }, loading: false });
      return { data: { user } };
    } catch (err) {
      const msg = err.message || 'Sign in failed';
      set({ error: msg, loading: false });
      return { error: { message: msg } };
    }
  },

  /* Sign out */
  signOut: async () => {
    localStorage.removeItem('soict_userId');
    set({ user: null, session: null, profile: null, error: null });
  },

  /* Update display name */
  updateDisplayName: async (displayName) => {
    const { user } = get();
    if (!user) return;
    try {
      const data = await api.updateProfile(user.id, displayName);
      set({ user: data.user, profile: data.user });
    } catch (err) {
      console.error('Profile update error:', err);
    }
  },

  clearError: () => set({ error: null }),
}));
