import { useState } from 'react';
import LessonCard from '../components/learn/LessonCard';
import QuizModule from '../components/learn/QuizModule';
import MarketAnalysisLab from '../components/learn/MarketAnalysisLab';
import PatternGame from '../components/learn/PatternGame';
import { LESSONS, QUIZZES } from '../lib/learningData';
import './Learn.css';

export default function Learn() {
  const [activeTab, setActiveTab] = useState('lessons');
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const tabs = [
    { id: 'lessons', label: 'Lessons', icon: '📚', desc: 'Interactive learning modules' },
    { id: 'quizzes', label: 'Quizzes', icon: '🧠', desc: 'Test your knowledge' },
    { id: 'lab', label: 'Market Lab', icon: '🔬', desc: 'Analyze live market data' },
    { id: 'patterns', label: 'Patterns', icon: '🕯️', desc: 'Identify candlestick patterns' },
  ];

  return (
    <div className="learn-page" id="learn-page">
      {/* Hero */}
      <div className="learn-hero">
        <div className="container">
          <span className="badge badge-primary" style={{ marginBottom: '12px' }}>Education Center</span>
          <h1 className="learn-hero__title">Master the Markets</h1>
          <p className="learn-hero__subtitle">
            Interactive lessons, real-time analysis tools, and hands-on practice to build your trading skills
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="learn-tabs-wrapper">
        <div className="container">
          <div className="learn-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`learn-tab ${activeTab === tab.id ? 'learn-tab--active' : ''}`}
                onClick={() => { setActiveTab(tab.id); setSelectedQuiz(null); }}
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

      {/* Content */}
      <div className="container learn-content">
        {/* Lessons Tab */}
        {activeTab === 'lessons' && (
          <div className="learn-lessons">
            {LESSONS.map((lesson, i) => (
              <LessonCard key={lesson.id} lesson={lesson} index={i} />
            ))}
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && !selectedQuiz && (
          <div className="learn-quizzes-grid">
            {QUIZZES.map((quiz) => (
              <div key={quiz.id} className="quiz-card card" onClick={() => setSelectedQuiz(quiz)}>
                <div className="quiz-card__icon">{quiz.icon}</div>
                <h4 className="quiz-card__title">{quiz.title}</h4>
                <p className="quiz-card__meta">{quiz.questions.length} questions • {quiz.category}</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }}>Start Quiz →</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'quizzes' && selectedQuiz && (
          <div className="learn-quiz-active">
            <button className="learn-back-btn" onClick={() => setSelectedQuiz(null)}>
              ← Back to Quizzes
            </button>
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{selectedQuiz.icon}</span> {selectedQuiz.title}
              </h3>
              <QuizModule quiz={selectedQuiz} />
            </div>
          </div>
        )}

        {/* Market Analysis Lab */}
        {activeTab === 'lab' && (
          <div className="card" style={{ padding: '24px' }}>
            <MarketAnalysisLab />
          </div>
        )}

        {/* Pattern Recognition Game */}
        {activeTab === 'patterns' && (
          <div className="card" style={{ padding: '24px' }}>
            <PatternGame />
          </div>
        )}
      </div>
    </div>
  );
}
