export default function LearningDashboard({
  level,
  overallProgress,
  completedLessons,
  completedQuizzes,
  averageQuizScore,
  earnedBadgeCount,
  recommendedLesson,
  suggestedChallenge,
  onContinue,
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
