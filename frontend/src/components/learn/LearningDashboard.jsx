export default function LearningDashboard({
  level,
  overallProgress,
  completedLessons,
  completedQuizzes,
  averageQuizScore,
  earnedBadgeCount,
  recommendedLesson,
  recommendedQuiz,
  weakAreas = [],
  suggestedChallenge,
  onContinue,
  onStartQuiz,
}) {
  const stats = [
    { label: 'Lessons', value: completedLessons },
    { label: 'Quizzes', value: completedQuizzes },
    { label: 'Avg score', value: `${averageQuizScore}%` },
    { label: 'Badges', value: earnedBadgeCount },
  ];

  return (
    <section className="learning-dashboard">
      <div className="learning-dashboard__main">
        <span className="badge badge-primary">Your Learning Journey</span>
        <h2>Your current level: {level}</h2>
        <p>Overall progress: {overallProgress}%</p>
        <div className="learning-dashboard__bar">
          <span style={{ width: `${overallProgress}%` }} />
        </div>
        <p className="learning-dashboard__next">
          Next recommended lesson: <strong>{recommendedLesson?.title || 'How Stock Markets Work'}</strong>
        </p>
        <p className="learning-dashboard__next">
          Suggested next challenge: <strong>{suggestedChallenge || 'Complete a related quiz'}</strong>
        </p>
        {recommendedQuiz && (
          <div className="learning-dashboard__quiz-callout">
            <span>Next path quiz</span>
            <strong>{recommendedQuiz.title}</strong>
            <button className="btn btn-secondary btn-sm" onClick={() => onStartQuiz?.(recommendedQuiz.id)}>Start Quiz</button>
          </div>
        )}
        {weakAreas.length > 0 && (
          <div className="learning-dashboard__weak-areas">
            <span>Review focus</span>
            {weakAreas.slice(0, 2).map((area) => (
              <button key={area.quizId || area.category} type="button" onClick={() => area.quizId && onStartQuiz?.(area.quizId)}>
                {area.category}
              </button>
            ))}
          </div>
        )}
        <p className="learning-dashboard__disclaimer">
          This learning module is for financial education in a simulated market environment. It does not provide real financial advice.
        </p>
        <button className="btn btn-primary" onClick={onContinue}>Continue Learning</button>
      </div>
      <div className="learning-dashboard__stats">
        {stats.map((stat) => (
          <div key={stat.label} className="learning-stat">
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
