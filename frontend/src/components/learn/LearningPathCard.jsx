export default function LearningPathCard({ path, progress, onContinue }) {
  const actionLabel = progress.percentage > 0 ? 'Continue' : 'Start';

  return (
    <div className="learning-path-card card">
      <div className="learning-path-card__header">
        <div className="learning-path-card__icon">{path.icon}</div>
        <div>
          <span className="learning-path-card__level">{path.level}</span>
          <h3>{path.title}</h3>
        </div>
      </div>
      <p>{path.description}</p>
      <div className="learning-path-card__meta">
        <span>{path.lessonIds.length} lessons</span>
        <span>{path.quizIds.length} quizzes</span>
        <span>{path.estimatedDuration}</span>
      </div>
      <div className="learning-path-card__bar">
        <span style={{ width: `${progress.percentage}%` }} />
      </div>
      <strong>{progress.percentage}% complete</strong>
      <p className="learning-path-card__outcome">{path.outcome}</p>
      <button className="btn btn-primary btn-sm" onClick={() => onContinue(path)}>
        {actionLabel}
      </button>
    </div>
  );
}
