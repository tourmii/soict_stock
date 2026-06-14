import { create } from 'zustand';
import { api } from '../lib/api';
import { buildChatbotContext } from '../lib/chatbotContext';
import { generateChatbotReply } from '../lib/chatbotEngine';
import { makeResponseSimulationSafe } from '../lib/chatbotSafety';

const STORAGE_KEY = 'soict_chatbot_conversation';
const initialMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello! I'm the SoictStock AI Learning Assistant. I can explain financial concepts, analyze your simulated portfolio, recommend lessons, and help you use the simulator. My guidance is educational and simulation-based, not real financial advice.",
  intent: 'GeneralGreeting',
  createdAt: new Date().toISOString(),
  suggestions: ['Explain my portfolio', 'Analyze my risk', 'Recommend a lesson', 'Explain stop-loss'],
  cards: [],
};

const trimMessages = (messages) => messages.slice(-50);
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useChatbotStore = create((set, get) => ({
  isOpen: false,
  messages: [initialMessage],
  loading: false,
  error: null,
  conversationId: null,
  lastIntent: null,

  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),

  addMessage: (message) => {
    set((state) => ({ messages: trimMessages([...state.messages, { id: makeId(), createdAt: new Date().toISOString(), ...message }]) }));
    get().saveToLocalStorage();
  },

  sendMessage: async (text, userId = null) => {
    const content = text.trim();
    if (!content || get().loading) return;
    const context = buildChatbotContext(content);
    get().addMessage({ role: 'user', content });
    set({ loading: true, error: null });

    try {
      let response;
      try {
        response = await api.sendChatbotMessage({ userId, message: content, context });
      } catch {
        response = generateChatbotReply(content, context);
      }
      const safe = makeResponseSimulationSafe({
        reply: response.reply || response.message || '',
        intent: response.intent || 'Fallback',
        suggestions: response.suggestions || [],
        cards: response.cards || [],
        metadata: response.metadata || {},
      });
      get().addMessage({
        role: 'assistant',
        content: safe.reply,
        intent: safe.intent,
        suggestions: safe.suggestions,
        cards: safe.cards,
        metadata: safe.metadata,
      });
      set({ lastIntent: safe.intent });
      if (userId) await get().saveConversation(userId);
    } catch (err) {
      set({ error: err.message || 'Chatbot failed' });
      get().addMessage({ role: 'assistant', content: 'Sorry, I had trouble answering. You can still ask about lessons, portfolio risk, orders, or simulation concepts.', intent: 'Fallback' });
    } finally {
      set({ loading: false });
    }
  },

  clearConversation: async (userId = null) => {
    set({ messages: [initialMessage], lastIntent: null, error: null });
    localStorage.removeItem(STORAGE_KEY);
    if (userId) {
      try { await api.clearChatbotHistory(userId); } catch { /* local fallback is enough */ }
    }
  },

  loadFromLocalStorage: () => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (stored?.messages?.length) set({ messages: trimMessages(stored.messages) });
    } catch {
      set({ messages: [initialMessage] });
    }
  },

  saveToLocalStorage: () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: get().messages, updatedAt: new Date().toISOString() }));
  },

  hydrateConversation: async (userId = null) => {
    get().loadFromLocalStorage();
    if (!userId) return;
    try {
      const data = await api.getChatbotHistory(userId);
      if (data?.messages?.length) {
        set({ messages: trimMessages(data.messages) });
        get().saveToLocalStorage();
      }
    } catch {
      get().loadFromLocalStorage();
    }
  },

  saveConversation: async (userId = null) => {
    get().saveToLocalStorage();
    if (!userId) return;
    try {
      await api.saveChatbotHistory({ userId, messages: get().messages.slice(-100) });
    } catch {
      get().saveToLocalStorage();
    }
  },
}));
