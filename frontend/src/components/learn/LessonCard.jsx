export default function LessonCard({
  lesson,
  index,
  progress,
  onOpen,
  onStartQuiz,
  portfolioContext,
}) {
  const completedSections = new Set(progress?.completedSections || []);
  const totalSections = lesson.content.length;
  const progressPercent = totalSections > 0 ? Math.round((completedSections.size / totalSections) * 100) : 0;

  const difficultyColors = {
    Beginner: { bg: '#ECFDF5', text: '#059669' },
    Intermediate: { bg: '#FFF7ED', text: '#EA580C' },
    Advanced: { bg: '#FEF2F2', text: '#DC2626' },
  };
  const dc = difficultyColors[lesson.difficulty] || difficultyColors.Beginner;

  const handleOpen = () => {
    onOpen?.(lesson.id);
  };

  return (
    <div className="lesson-card" style={{ animationDelay: `${index * 0.04}s` }}>
      <div className="lesson-card__header" onClick={handleOpen} style={{ cursor: 'pointer' }}>
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
        <div className="lesson-card__chevron" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '13px' }}>
          {progress?.completed ? '✓ Review' : 'Open →'}
        </div>
      </div>
    </div>
  );
}
