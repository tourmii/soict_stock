import { useNewsStore } from '../../store/newsStore';
import { formatRelativeTime } from '../../lib/formatters';
import NewsModal from '../shared/NewsModal';

const SENTIMENT_ICON = { positive: '▲', negative: '▼', neutral: '—' };
const SENTIMENT_COLOR = { positive: 'var(--green)', negative: 'var(--red)', neutral: 'var(--gray-400)' };

export default function NewsPanel() {
  const newsItems       = useNewsStore((s) => s.newsItems);
  const selectedNews    = useNewsStore((s) => s.selectedNews);
  const setSelectedNews = useNewsStore((s) => s.setSelectedNews);
  const clearSelected   = useNewsStore((s) => s.clearSelectedNews);

  return (
    <>
      <div className="news-panel">
        <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Market News</span>
          <span className="news-live-dot" />
        </div>

        <div className="news-panel__list">
          {newsItems.length === 0 && (
            <div className="news-panel__empty">No news yet…</div>
          )}
          {newsItems.slice(0, 10).map((item) => (
            <div
              key={item.id}
              className="news-row"
              onClick={() => setSelectedNews(item)}
            >
              <span
                className="news-row__icon"
                style={{ color: SENTIMENT_COLOR[item.sentiment] || 'var(--gray-400)' }}
              >
                {SENTIMENT_ICON[item.sentiment] || '—'}
              </span>
              <div className="news-row__body">
                <p className="news-row__headline">{item.headline}</p>
                <div className="news-row__meta">
                  {item.affectedTickers && !item.isMarketWide &&
                    item.affectedTickers.slice(0, 2).map((t) => (
                      <span key={t} className={`news-tag ${item.sentiment}`}>{t}</span>
                    ))
                  }
                  {item.isMarketWide && <span className="news-tag neutral">Market</span>}
                  <span className="news-row__time">{formatRelativeTime(item.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <NewsModal item={selectedNews} onClose={clearSelected} />
    </>
  );
}
