import { create } from 'zustand';
import { NEWS_TEMPLATES, STOCKS } from '../lib/constants';

function generateNewsItem(template, stock) {
  const headline = template.headline.replace('{company}', stock ? stock.name : 'The Market');
  const impact = template.impact[0] + Math.random() * (template.impact[1] - template.impact[0]);

  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    headline,
    type: template.type,
    sentiment: template.sentiment,
    ticker: stock?.ticker || null,
    impact: impact,
    timestamp: new Date().toISOString(),
    sectorWide: template.sectorWide || false,
  };
}

export const useNewsStore = create((set, get) => ({
  newsItems: [],
  scheduledEvents: [],

  generateInitialNews: () => {
    const items = [];
    for (let i = 0; i < 5; i++) {
      const template = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
      const stock = STOCKS[Math.floor(Math.random() * STOCKS.length)];
      const item = generateNewsItem(template, template.sectorWide ? null : stock);
      item.timestamp = new Date(Date.now() - i * 600000).toISOString(); // stagger
      items.push(item);
    }
    set({ newsItems: items });
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
