import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PracticeTaskCard from './PracticeTaskCard';

export default function LessonCard({
  lesson,
  index,
  progress,
  expanded: controlledExpanded,
  onToggle,
  onSectionComplete,
  onLessonComplete,
  onLessonOpened,
  onStartQuiz,
  portfolioContext,
}) {
  const navigate = useNavigate();
  const [localExpanded, setLocalExpanded] = useState(false);
  const expanded = controlledExpanded ?? localExpanded;
  const completedSections = new Set(progress?.completedSections || []);
  const totalSections = lesson.content.length;
  const progressPercent = totalSections > 0 ? Math.round((completedSections.size / totalSections) * 100) : 0;

  useEffect(() => {
    if (expanded && onLessonOpened) onLessonOpened(lesson.id);
  }, [expanded, lesson.id, onLessonOpened]);

  useEffect(() => {
    if (totalSections > 0 && completedSections.size >= totalSections && !progress?.completed) {
      onLessonComplete?.(lesson.id);
    }
  }, [completedSections.size, lesson.id, onLessonComplete, progress?.completed, totalSections]);

  const difficultyColors = {
    Beginner: { bg: '#ECFDF5', text: '#059669' },
    Intermediate: { bg: '#FFF7ED', text: '#EA580C' },
    Advanced: { bg: '#FEF2F2', text: '#DC2626' },
  };
  const dc = difficultyColors[lesson.difficulty] || difficultyColors.Beginner;

  const handleToggle = () => {
    if (onToggle) onToggle(lesson.id);
    else setLocalExpanded((value) => !value);
  };

  return (
    <div className={`lesson-card ${expanded ? 'lesson-card--expanded' : ''}`} style={{ animationDelay: `${index * 0.04}s` }}>
      <div className="lesson-card__header" onClick={handleToggle}>
        <div className="lesson-card__icon" style={{ background: `${lesson.color}15`, color: lesson.color }}>
          {lesson.icon}
        </div>
        <div className="lesson-card__info">
          <div className="lesson-card__meta">
            <span className="lesson-card__category">{lesson.category}</span>
            <span className="lesson-card__difficulty" style={{ background: dc.bg, color: dc.text }}>{lesson.difficulty}</span>
            <span className="lesson-card__duration">{lesson.duration}</span>
            {progress?.completed && <span className="lesson-card__done">Completed</span>}
          </div>
          <h4 className="lesson-card__title">{lesson.title}</h4>
          <p className="lesson-card__summary">{lesson.summary}</p>
          <div className="lesson-card__progress-bar" aria-label={`${progressPercent}% complete`}>
            <div className="lesson-card__progress-fill" style={{ width: `${progressPercent}%`, background: lesson.color }} />
          </div>
        </div>
        <div className="lesson-card__chevron" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="lesson-card__content">
          {lesson.learningObjectives?.length > 0 && (
            <div className="lesson-objectives">
              <h5>Learning objectives</h5>
              <ul>
                {lesson.learningObjectives.map((objective) => <li key={objective}>{objective}</li>)}
              </ul>
            </div>
          )}

          {!progress?.completed && (
            <div className="lesson-bulk-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => onLessonComplete?.(lesson.id)}>
                Mark all sections as complete
              </button>
            </div>
          )}

          {lesson.content.map((section, idx) => {
            const completed = completedSections.has(idx);
            return (
              <div key={`${lesson.id}-${idx}`} className={`lesson-section lesson-section--${section.type} ${completed ? 'lesson-section--completed' : ''}`}>
                <div className="lesson-section__status">{completed ? 'Complete' : `Section ${idx + 1}`}</div>
                <SectionContent section={section} />
                {!completed && (
                  <button className="lesson-section__mark-btn" onClick={() => onSectionComplete?.(lesson.id, idx)}>
                    Mark section as complete
                  </button>
                )}
              </div>
            );
          })}

          <PracticeTaskCard task={lesson.practiceTask} portfolioContext={portfolioContext} onStartQuiz={onStartQuiz} />

          <div className="lesson-actions">
            {lesson.relatedQuizId && (
              <button className="btn btn-primary btn-sm" onClick={() => onStartQuiz?.(lesson.relatedQuizId)}>
                Start Related Quiz
              </button>
            )}
            {lesson.relatedSimulatorAction && (
              <button className="btn btn-secondary btn-sm" onClick={() => navigate(lesson.relatedSimulatorAction.path)}>
                {lesson.relatedSimulatorAction.label || 'Practice in Simulator'}
              </button>
            )}
          </div>

          {progress?.completed && (
            <div className="lesson-complete">
              <span className="lesson-complete__icon">Done</span>
              <span>Lesson completed!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionContent({ section }) {
  if (section.type === 'checklist') {
    return (
      <div className="lesson-concept">
        <h5 className="lesson-concept__title">{section.title}</h5>
        <ul className="lesson-checklist">
          {section.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
    );
  }

  if (section.type === 'scenario') {
    return (
      <div className="lesson-scenario">
        <h5 className="lesson-concept__title">{section.title}</h5>
        <p>{section.body}</p>
        <div className="lesson-scenario__options">
          {section.options?.map((option) => <span key={option}>{option}</span>)}
        </div>
        {section.answer && <p className="lesson-scenario__answer">Review focus: {section.answer}</p>}
      </div>
    );
  }

  if (section.type === 'example' || section.type === 'warning' || section.type === 'concept') {
    return (
      <div className="lesson-concept">
        <h5 className="lesson-concept__title">{section.title}</h5>
        <div className="lesson-concept__body" dangerouslySetInnerHTML={{ __html: formatMarkdown(section.body) }} />
      </div>
    );
  }

  if (section.type === 'tip') {
    return (
      <div className="lesson-tip">
        <div className="lesson-tip__body" dangerouslySetInnerHTML={{ __html: formatMarkdown(section.body) }} />
      </div>
    );
  }

  return <div className="lesson-text" dangerouslySetInnerHTML={{ __html: formatMarkdown(section.body) }} />;
}

function formatMarkdown(text = '') {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}
