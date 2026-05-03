import { useState } from 'react';

export default function LessonCard({ lesson, index }) {
  const [expanded, setExpanded] = useState(false);
  const [completedSections, setCompletedSections] = useState(new Set());

  const totalSections = lesson.content.length;
  const progress = (completedSections.size / totalSections) * 100;

  const markCompleted = (idx) => {
    setCompletedSections((prev) => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
  };

  const difficultyColors = {
    Beginner: { bg: '#ECFDF5', text: '#059669' },
    Intermediate: { bg: '#FFF7ED', text: '#EA580C' },
    Advanced: { bg: '#FEF2F2', text: '#DC2626' },
  };

  const dc = difficultyColors[lesson.difficulty] || difficultyColors.Beginner;

  return (
    <div className={`lesson-card ${expanded ? 'lesson-card--expanded' : ''}`} style={{ animationDelay: `${index * 0.08}s` }}>
      <div className="lesson-card__header" onClick={() => setExpanded(!expanded)}>
        <div className="lesson-card__icon" style={{ background: `${lesson.color}15`, color: lesson.color }}>
          {lesson.icon}
        </div>
        <div className="lesson-card__info">
          <div className="lesson-card__meta">
            <span className="lesson-card__category">{lesson.category}</span>
            <span className="lesson-card__difficulty" style={{ background: dc.bg, color: dc.text }}>{lesson.difficulty}</span>
            <span className="lesson-card__duration">⏱ {lesson.duration}</span>
          </div>
          <h4 className="lesson-card__title">{lesson.title}</h4>
          <p className="lesson-card__summary">{lesson.summary}</p>
          {progress > 0 && (
            <div className="lesson-card__progress-bar">
              <div className="lesson-card__progress-fill" style={{ width: `${progress}%`, background: lesson.color }} />
            </div>
          )}
        </div>
        <div className="lesson-card__chevron" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="lesson-card__content">
          {lesson.content.map((section, idx) => (
            <div key={idx} className={`lesson-section lesson-section--${section.type} ${completedSections.has(idx) ? 'lesson-section--completed' : ''}`}>
              {section.type === 'text' && (
                <div className="lesson-text" dangerouslySetInnerHTML={{ __html: formatMarkdown(section.body) }} />
              )}
              {section.type === 'concept' && (
                <div className="lesson-concept">
                  <h5 className="lesson-concept__title">{section.title}</h5>
                  <div className="lesson-concept__body" dangerouslySetInnerHTML={{ __html: formatMarkdown(section.body) }} />
                </div>
              )}
              {section.type === 'tip' && (
                <div className="lesson-tip">
                  <div className="lesson-tip__body" dangerouslySetInnerHTML={{ __html: formatMarkdown(section.body) }} />
                </div>
              )}
              {!completedSections.has(idx) && (
                <button className="lesson-section__mark-btn" onClick={() => markCompleted(idx)}>
                  ✓ Got it
                </button>
              )}
            </div>
          ))}
          {completedSections.size === totalSections && (
            <div className="lesson-complete">
              <span className="lesson-complete__icon">🎉</span>
              <span>Lesson completed!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
    .replace(/• /g, '<span class="bullet">•</span> ');
}
