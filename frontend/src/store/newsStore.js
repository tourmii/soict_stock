import { create } from 'zustand';
import { NEWS_TEMPLATES, STOCKS } from '../lib/constants';

function generateNewsItem(template, stock) {
  const headline = template.headline.replace('{company}', stock ? stock.name : 'The Market');
  const impact = template.impact[0] + Math.random() * (template.impact[1] - template.impact[0]);

  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    headline,
    description: 'Market simulation generated news event.',
    url: null,
    source: 'SoictStock Simulation',
    image: null,
    type: template.type,
    sentiment: template.sentiment,
    affectedTickers: stock ? [stock.ticker] : STOCKS.map((s) => s.ticker),
    isMarketWide: template.sectorWide || false,
    impact: impact,
    timestamp: new Date().toISOString(),
  };
}

export const useNewsStore = create((set, get) => ({
  newsItems: [],
  selectedNews: null, // for the popup modal
  scheduledEvents: [],

  setSelectedNews: (item) => set({ selectedNews: item }),
  clearSelectedNews: () => set({ selectedNews: null }),

  generateInitialNews: () => {
    const items = [];
    for (let i = 0; i < 5; i++) {
      const template = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
      const stock = STOCKS[Math.floor(Math.random() * STOCKS.length)];
      const item = generateNewsItem(template, template.sectorWide ? null : stock);
      item.timestamp = new Date(Date.now() - i * 600000).toISOString();
      items.push(item);
    }
    set({ newsItems: items });
  },

  /* Fetch real news from backend API */
  fetchFromBackend: async () => {
    try {
      const res = await fetch('/api/news?limit=20');
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.length > 0) {
        set({ newsItems: data });
      }
    } catch (err) {
      // Backend not available — keep local news
      console.log('News fetch from backend failed, using local news');
    }
  },

  injectNews: () => {
    const template = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
    const stock = STOCKS[Math.floor(Math.random() * STOCKS.length)];
    const item = generateNewsItem(template, template.sectorWide ? null : stock);
    set((s) => ({ newsItems: [item, ...s.newsItems].slice(0, 30) }));
    return item;
  },

  clearNews: () => set({ newsItems: [] }),
}));
