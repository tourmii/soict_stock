import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LessonCard from '../components/learn/LessonCard';
import LessonModal from '../components/learn/LessonModal';
import QuizModule from '../components/learn/QuizModule';
import MarketAnalysisLab from '../components/learn/MarketAnalysisLab';
import PatternGame from '../components/learn/PatternGame';
import LearningDashboard from '../components/learn/LearningDashboard';
import LearningPathCard from '../components/learn/LearningPathCard';
import AchievementBadge from '../components/learn/AchievementBadge';
import RecommendedLessonCard from '../components/learn/RecommendedLessonCard';
import PracticeTaskCard from '../components/learn/PracticeTaskCard';
import { LEARNING_BADGES, LEARNING_PATHS, LESSONS, QUIZZES } from '../lib/learningData';
import { calculatePathProgress, getNextLessonInPath } from '../lib/learningUtils';
import { STOCKS } from '../lib/constants';
import { useAuthStore } from '../store/authStore';
import { useLearningStore } from '../store/learningStore';
import { useMarketStore } from '../store/marketStore';
import { usePortfolioStore } from '../store/portfolioStore';
import './Learn.css';

export default function Learn() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [openLessonId, setOpenLessonId] = useState(null);
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const holdings = usePortfolioStore((state) => state.holdings);
  const transactions = usePortfolioStore((state) => state.transactions);
  const prices = useMarketStore((state) => state.prices);
  const lessonProgress = useLearningStore((state) => state.lessonProgress);
  const quizResults = useLearningStore((state) => state.quizResults);
  const earnedBadges = useLearningStore((state) => state.earnedBadges);
  const currentLevel = useLearningStore((state) => state.currentLevel);
  const initializeLearning = useLearningStore((state) => state.initializeLearning);
  const markSectionComplete = useLearningStore((state) => state.markSectionComplete);
  const markLessonComplete = useLearningStore((state) => state.markLessonComplete);
  const calculateOverallProgress = useLearningStore((state) => state.calculateOverallProgress);
  const calculateAverageQuizScore = useLearningStore((state) => state.calculateAverageQuizScore);
  const getCompletedLessonCount = useLearningStore((state) => state.getCompletedLessonCount);
  const getCompletedQuizCount = useLearningStore((state) => state.getCompletedQuizCount);
  const getLessonProgress = useLearningStore((state) => state.getLessonProgress);
  const getRecommendedLesson = useLearningStore((state) => state.getRecommendedLesson);
  const evaluateBadges = useLearningStore((state) => state.evaluateBadges);

  const portfolioContext = useMemo(() => ({
    holdings,
    transactions,
    prices,
    quizResults,
    stocks: STOCKS,
  }), [holdings, transactions, prices, quizResults]);

  useEffect(() => {
    initializeLearning(user?.id || null);
  }, [initializeLearning, user?.id]);

  useEffect(() => {
    evaluateBadges(portfolioContext);
  }, [evaluateBadges, portfolioContext]);

  const recommendation = getRecommendedLesson(LESSONS, LEARNING_PATHS, portfolioContext);
  const recommendedLesson = recommendation.lesson;
  const recentQuiz = getRecentQuiz(quizResults);
  const recommendedQuiz = getNextPathQuiz(currentLevel, LEARNING_PATHS, QUIZZES, quizResults);
  const weakAreas = getWeakAreas(quizResults, QUIZZES);
  const suggestedTaskLesson = LESSONS.find((lesson) => lesson.practiceTask && !lessonProgress[lesson.id]?.completed) || recommendedLesson;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'O', desc: 'Your journey' },
    { id: 'paths', label: 'Paths', icon: 'P', desc: 'Guided tracks' },
    { id: 'lessons', label: 'Lessons', icon: 'L', desc: 'Interactive modules' },
    { id: 'quizzes', label: 'Quizzes', icon: 'Q', desc: 'Test knowledge' },
    { id: 'lab', label: 'Market Lab', icon: 'M', desc: 'Analyze data' },
    { id: 'patterns', label: 'Patterns', icon: 'C', desc: 'Candlesticks' },
    { id: 'achievements', label: 'Achievements', icon: 'A', desc: 'Badges' },
  ];

  useEffect(() => {
    const tab = searchParams.get('tab');
    const lessonId = searchParams.get('lessonId');
    const quizId = searchParams.get('quizId');
    const validTabs = tabs.map((item) => item.id);
    if (lessonId && LESSONS.some((lesson) => lesson.id === lessonId)) {
      setActiveTab('lessons');
      setSelectedQuiz(null);
      setOpenLessonId(lessonId);
      return;
    }
    if (quizId) {
      const quiz = QUIZZES.find((item) => item.id === quizId);
      if (quiz) {
        setActiveTab('quizzes');
        setSelectedQuiz(quiz);
      }
      return;
    }
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
      setSelectedQuiz(null);
    }
  }, [searchParams]);

  const openLesson = (lessonId) => {
    setOpenLessonId(lessonId);
    setSelectedQuiz(null);
  };

  const openQuiz = (quizId) => {
    const quiz = QUIZZES.find((item) => item.id === quizId);
    if (!quiz) return;
    setSelectedQuiz(quiz);
    setActiveTab('quizzes');
  };

  const continuePath = (path) => {
    const lessonId = getNextLessonInPath(path, lessonProgress);
    if (lessonId) {
      openLesson(lessonId);
      return;
    }

    const quizId = path.quizIds.find((id) => !quizResults[id]?.completed) || path.quizIds[0];
    openQuiz(quizId);
  };

  const earnedBadgeCount = earnedBadges.length;
  const overallProgress = calculateOverallProgress();

  return (
    <div className="learn-page" id="learn-page">
      <div className="learn-hero">
        <div className="container">
          <span className="badge badge-primary" style={{ marginBottom: '12px' }}>Education Center</span>
          <h1 className="learn-hero__title">Master the Markets</h1>
          <p className="learn-hero__subtitle">
            Personalized lessons, progress tracking, quizzes, and simulated portfolio feedback for financial education.
          </p>
        </div>
      </div>

      <div className="learn-tabs-wrapper">
        <div className="container">
          <div className="learn-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`learn-tab ${activeTab === tab.id ? 'learn-tab--active' : ''}`}
                onClick={() => { setActiveTab(tab.id); if (tab.id !== 'quizzes') setSelectedQuiz(null); }}
                id={`learn-tab-${tab.id}`}
              >
                <span className="learn-tab__icon">{tab.icon}</span>
                <div>
                  <span className="learn-tab__label">{tab.label}</span>
                  <span className="learn-tab__desc">{tab.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container learn-content">
        {activeTab === 'overview' && (
          <div className="learn-overview">
            <LearningDashboard
              level={currentLevel}
              overallProgress={overallProgress}
              completedLessons={getCompletedLessonCount()}
              completedQuizzes={getCompletedQuizCount()}
              averageQuizScore={calculateAverageQuizScore()}
              earnedBadgeCount={earnedBadgeCount}
              recommendedLesson={recommendedLesson}
              recommendedQuiz={recommendedQuiz}
              weakAreas={weakAreas}
              suggestedChallenge={recommendedLesson?.relatedQuizId ? 'Pass the related quiz' : 'Complete a practice task'}
              onContinue={() => openLesson(recommendedLesson?.id || 'market-basics')}
              onStartQuiz={openQuiz}
            />

            <div className="learn-overview__grid">
              <RecommendedLessonCard lesson={recommendedLesson} reason={recommendation.reason} onOpen={openLesson} />

              <div className="overview-card card">
                <h3>Current Path Progress</h3>
                {LEARNING_PATHS.map((path) => {
                  const progress = calculatePathProgress(path, lessonProgress, quizResults);
                  return (
                    <div key={path.id} className="path-mini">
                      <span>{path.level}</span>
                      <div><span style={{ width: `${progress.percentage}%` }} /></div>
                      <strong>{progress.percentage}%</strong>
                    </div>
                  );
                })}
              </div>

              <div className="overview-card card">
                <h3>Recent Quiz Result</h3>
                {recentQuiz ? (
                  <p>{recentQuiz.title}: <strong>{recentQuiz.percentage}%</strong> {recentQuiz.passed ? 'passed' : 'review suggested'}</p>
                ) : (
                  <p>No quiz attempts yet. Start with Market Basics when you are ready.</p>
                )}
              </div>

              <div className="overview-card card">
                <h3>Badges Preview</h3>
                <div className="badge-preview">
                  {LEARNING_BADGES.slice(0, 4).map((badge) => {
                    const earned = findEarnedBadge(earnedBadges, badge.id);
                    return (
                      <span key={badge.id} className={earned ? 'badge-preview__earned' : ''}>
                        {badge.image && <img src={badge.image} alt="" />}
                        {badge.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {suggestedTaskLesson?.practiceTask && (
              <PracticeTaskCard task={suggestedTaskLesson.practiceTask} portfolioContext={portfolioContext} onStartQuiz={openQuiz} />
            )}
          </div>
        )}

        {activeTab === 'paths' && (
          <div className="learning-paths-grid">
            {LEARNING_PATHS.map((path) => (
              <LearningPathCard
                key={path.id}
                path={path}
                progress={calculatePathProgress(path, lessonProgress, quizResults)}
                lessons={LESSONS}
                quizzes={QUIZZES}
                lessonProgress={lessonProgress}
                quizResults={quizResults}
                onContinue={continuePath}
                onOpenLesson={openLesson}
                onStartQuiz={openQuiz}
              />
            ))}
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="learn-lessons">
            {LESSONS.map((lesson, i) => (
              <div id={`lesson-${lesson.id}`} key={lesson.id}>
                <LessonCard
                  lesson={lesson}
                  index={i}
                  progress={getLessonProgress(lesson.id)}
                  onOpen={openLesson}
                  onStartQuiz={openQuiz}
                  portfolioContext={portfolioContext}
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'quizzes' && !selectedQuiz && (
          <div className="learn-quizzes-grid">
            {QUIZZES.map((quiz) => {
              const result = quizResults[quiz.id];
              return (
                <button key={quiz.id} className="quiz-card card" onClick={() => setSelectedQuiz(quiz)}>
                  <div className="quiz-card__icon">{getQuizInitial(quiz)}</div>
                  <h4 className="quiz-card__title">{quiz.title}</h4>
                  <div className="quiz-card__levels">
                    {getQuizLevels(quiz.id, LEARNING_PATHS).map((level) => (
                      <span key={level}>{level}</span>
                    ))}
                  </div>
                  <p className="quiz-card__meta">{quiz.questions.length} questions | {quiz.category}</p>
                  {result?.attempts?.length > 0 && (
                    <p className="quiz-card__meta">Best {result.bestScore}% | Last {result.lastScore}%</p>
                  )}
                  <span className="btn btn-primary btn-sm" style={{ marginTop: '12px' }}>Start Quiz</span>
                </button>
              );
            })}
          </div>
        )}

        {activeTab === 'quizzes' && selectedQuiz && (
          <div className="learn-quiz-active">
            <button className="learn-back-btn" onClick={() => setSelectedQuiz(null)}>
              Back to Quizzes
            </button>
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="quiz-title-icon">{getQuizInitial(selectedQuiz)}</span> {selectedQuiz.title}
              </h3>
              <QuizModule quiz={selectedQuiz} onReviewLesson={openLesson} />
            </div>
          </div>
        )}

        {activeTab === 'lab' && (
          <div className="card" style={{ padding: '24px' }}>
            <MarketAnalysisLab />
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="card" style={{ padding: '24px' }}>
            <PatternGame />
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="achievements-grid">
            {LEARNING_BADGES.map((badge) => (
              <AchievementBadge key={badge.id} badge={badge} earned={findEarnedBadge(earnedBadges, badge.id)} />
            ))}
          </div>
        )}
      </div>

      {openLessonId && (() => {
        const lesson = LESSONS.find(l => l.id === openLessonId);
        return lesson ? (
          <LessonModal
            lesson={lesson}
            progress={getLessonProgress(lesson.id)}
            onClose={() => setOpenLessonId(null)}
            onSectionComplete={markSectionComplete}
            onLessonComplete={markLessonComplete}
            onStartQuiz={openQuiz}
            portfolioContext={portfolioContext}
          />
        ) : null;
      })()}
    </div>
  );
}

function findEarnedBadge(earnedBadges, badgeId) {
  return earnedBadges.find((badge) => (typeof badge === 'string' ? badge === badgeId : badge.id === badgeId));
}

function getRecentQuiz(quizResults) {
  const attempts = Object.entries(quizResults).flatMap(([quizId, result]) =>
    (result.attempts || []).map((attempt) => ({ ...attempt, quizId }))
  );
  attempts.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  const latest = attempts[0];
  if (!latest) return null;
  const quiz = QUIZZES.find((item) => item.id === latest.quizId);
  return { ...latest, title: quiz?.title || latest.quizId };
}

function getNextPathQuiz(currentLevel, paths, quizzes, quizResults) {
  const currentPath = paths.find((item) => item.level === currentLevel);
  const path = currentPath?.quizIds?.some((id) => !quizResults[id]?.completed)
    ? currentPath
    : paths.find((item) => item.quizIds.some((id) => !quizResults[id]?.completed));
  const quizId = path?.quizIds?.find((id) => !quizResults[id]?.completed);
  return quizzes.find((quiz) => quiz.id === quizId) || null;
}

function getQuizLevels(quizId, paths) {
  return paths
    .filter((path) => path.quizIds.includes(quizId))
    .map((path) => path.level);
}

function getWeakAreas(quizResults, quizzes) {
  return Object.entries(quizResults)
    .map(([quizId, result]) => {
      const quiz = quizzes.find((item) => item.id === quizId);
      return {
        quizId,
        category: quiz?.category || quiz?.title || quizId,
        lastScore: result?.lastScore ?? 100,
        attempts: result?.attempts?.length || 0,
      };
    })
    .filter((area) => area.attempts > 0 && area.lastScore < 70)
    .sort((a, b) => a.lastScore - b.lastScore);
}

function getQuizInitial(quiz) {
  return quiz?.title?.trim()?.charAt(0)?.toUpperCase() || quiz?.icon || 'Q';
}
