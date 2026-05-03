import { useState } from 'react';

export default function QuizModule({ quiz }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState([]);

  const q = quiz.questions[currentQ];

  const handleSelect = (optionIndex) => {
    if (showExplanation) return;
    setSelected(optionIndex);
    setShowExplanation(true);
    const isCorrect = optionIndex === q.correct;
    if (isCorrect) setScore((s) => s + 1);
    setAnswers((prev) => [...prev, { question: q.question, selected: optionIndex, correct: q.correct, isCorrect }]);
  };

  const handleNext = () => {
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ((c) => c + 1);
      setSelected(null);
      setShowExplanation(false);
    } else {
      setFinished(true);
    }
  };

  const handleRetry = () => {
    setCurrentQ(0);
    setSelected(null);
    setShowExplanation(false);
    setScore(0);
    setFinished(false);
    setAnswers([]);
  };

  if (finished) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    const emoji = percentage >= 80 ? '🏆' : percentage >= 60 ? '👍' : '📚';
    return (
      <div className="quiz-results">
        <div className="quiz-results__header">
          <span className="quiz-results__emoji">{emoji}</span>
          <h4>Quiz Complete!</h4>
          <p className="quiz-results__score">
            You scored <strong>{score}/{quiz.questions.length}</strong> ({percentage}%)
          </p>
          <div className="quiz-results__bar">
            <div className="quiz-results__bar-fill" style={{ width: `${percentage}%`, background: percentage >= 80 ? '#22C55E' : percentage >= 60 ? '#F59E0B' : '#EF4444' }} />
          </div>
        </div>
        <div className="quiz-results__review">
          {answers.map((a, i) => (
            <div key={i} className={`quiz-review-item ${a.isCorrect ? 'quiz-review-item--correct' : 'quiz-review-item--wrong'}`}>
              <div className="quiz-review-item__indicator">{a.isCorrect ? '✓' : '✗'}</div>
              <div className="quiz-review-item__text">
                <div className="quiz-review-item__q">{a.question}</div>
                {!a.isCorrect && (
                  <div className="quiz-review-item__answer">
                    Correct: {quiz.questions[i].options[a.correct]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={handleRetry} style={{ marginTop: '16px' }}>
          🔄 Retry Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-module">
      <div className="quiz-module__progress">
        <div className="quiz-module__counter">
          Question {currentQ + 1} of {quiz.questions.length}
        </div>
        <div className="quiz-module__bar">
          <div className="quiz-module__bar-fill" style={{ width: `${((currentQ) / quiz.questions.length) * 100}%` }} />
        </div>
        <div className="quiz-module__score">Score: {score}</div>
      </div>

      <h4 className="quiz-module__question">{q.question}</h4>

      <div className="quiz-options">
        {q.options.map((opt, idx) => {
          let cls = 'quiz-option';
          if (showExplanation) {
            if (idx === q.correct) cls += ' quiz-option--correct';
            else if (idx === selected) cls += ' quiz-option--wrong';
          } else if (idx === selected) {
            cls += ' quiz-option--selected';
          }

          return (
            <button key={idx} className={cls} onClick={() => handleSelect(idx)} disabled={showExplanation}>
              <span className="quiz-option__letter">{String.fromCharCode(65 + idx)}</span>
              <span className="quiz-option__text">{opt}</span>
              {showExplanation && idx === q.correct && <span className="quiz-option__icon">✓</span>}
              {showExplanation && idx === selected && idx !== q.correct && <span className="quiz-option__icon">✗</span>}
            </button>
          );
        })}
      </div>

      {showExplanation && (
        <div className={`quiz-explanation ${selected === q.correct ? 'quiz-explanation--correct' : 'quiz-explanation--wrong'}`}>
          <div className="quiz-explanation__icon">{selected === q.correct ? '✅' : '💡'}</div>
          <div>
            <strong>{selected === q.correct ? 'Correct!' : 'Not quite!'}</strong>
            <p>{q.explanation}</p>
          </div>
        </div>
      )}

      {showExplanation && (
        <button className="btn btn-primary quiz-next-btn" onClick={handleNext}>
          {currentQ < quiz.questions.length - 1 ? 'Next Question →' : 'See Results'}
        </button>
      )}
    </div>
  );
}
