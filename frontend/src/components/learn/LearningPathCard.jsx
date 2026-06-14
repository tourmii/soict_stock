export default function LearningPathCard({ path, progress, quizzes = [], quizResults = {}, onContinue, onStartQuiz }) {
  const actionLabel = progress.percentage > 0 ? 'Continue' : 'Start';
  const pathQuizzes = path.quizIds
    .map((quizId) => quizzes.find((quiz) => quiz.id === quizId))
    .filter(Boolean);

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
      {pathQuizzes.length > 0 && (
        <div className="learning-path-card__quizzes">
          <h4>Required quizzes</h4>
          {pathQuizzes.map((quiz) => {
            const result = quizResults[quiz.id];
            const completed = Boolean(result?.completed);
            return (
              <button
                key={quiz.id}
                type="button"
                className={`learning-path-card__quiz ${completed ? 'learning-path-card__quiz--done' : ''}`}
                onClick={() => onStartQuiz?.(quiz.id)}
              >
                <span>
                  <strong>{quiz.title}</strong>
                  <small>{quiz.questions.length} questions | Pass {quiz.passingScore || 70}%</small>
                </span>
                <em>{completed ? 'Done' : 'Start'}</em>
              </button>
            );
          })}
        </div>
      )}
      <button className="btn btn-primary btn-sm" onClick={() => onContinue(path)}>
        {actionLabel}
      </button>
    </div>
  );
}
