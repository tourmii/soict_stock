import { useMemo, useState } from 'react';
import { LESSONS } from '../../lib/learningData';
import { useLearningStore } from '../../store/learningStore';

export default function QuizModule({ quiz, onReviewLesson }) {
  const quizResult = useLearningStore((state) => state.quizResults[quiz.id]);
  const saveQuizResult = useLearningStore((state) => state.saveQuizResult);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [attemptSeed, setAttemptSeed] = useState(0);

  const questions = useMemo(
    () => quiz.questions.map((question, index) => shuffleQuestionOptions(question, index, attemptSeed)),
    [quiz.questions, attemptSeed]
  );
  const q = questions[currentQ];
  const passingScore = quiz.passingScore || 70;

  const handleSelect = (optionIndex) => {
    if (showExplanation) return;
    setSelected(optionIndex);
    setShowExplanation(true);
    const isCorrect = optionIndex === q.correct;
    if (isCorrect) setScore((s) => s + 1);
    setAnswers((prev) => [
      ...prev,
      {
        question: q.question,
        selected: optionIndex,
        correct: q.correct,
        correctAnswer: q.options[q.correct],
        isCorrect,
        explanation: q.explanation,
      },
    ]);
  };

  const handleNext = async () => {
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ((c) => c + 1);
      setSelected(null);
      setShowExplanation(false);
      return;
    }
    setFinished(true);
    if (!saved) {
      setSaved(true);
      await saveQuizResult(quiz.id, score, quiz.questions.length);
    }
  };

  const handleRetry = () => {
    setCurrentQ(0);
    setSelected(null);
    setShowExplanation(false);
    setScore(0);
    setFinished(false);
    setSaved(false);
    setAnswers([]);
    setAttemptSeed((seed) => seed + 1);
  };

  if (finished) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    const passed = percentage >= passingScore;
    const reviewLessons = (quiz.relatedLessonIds || [])
      .map((lessonId) => LESSONS.find((lesson) => lesson.id === lessonId))
      .filter(Boolean);

    return (
      <div className="quiz-results">
        <div className="quiz-results__header">
          <span className="quiz-results__emoji">{passed ? 'Pass' : 'Review'}</span>
          <h4>{passed ? 'Quiz passed' : 'Quiz complete'}</h4>
          <p className="quiz-results__score">
            You scored <strong>{score}/{quiz.questions.length}</strong> ({percentage}%)
          </p>
          <p className={`quiz-results__status ${passed ? 'quiz-results__status--pass' : 'quiz-results__status--fail'}`}>
            {passed ? `Passed at ${passingScore}% threshold` : `Below ${passingScore}% passing threshold`}
          </p>
          <div className="quiz-results__bar">
            <div className="quiz-results__bar-fill" style={{ width: `${percentage}%`, background: passed ? '#22C55E' : '#EF4444' }} />
          </div>
        </div>

        <QuizHistory result={quizResult} />

        {!passed && reviewLessons.length > 0 && (
          <div className="quiz-review-lessons">
            <h5>Recommended Review Lessons</h5>
            {reviewLessons.map((lesson) => (
              <button key={lesson.id} className="quiz-review-lesson" onClick={() => onReviewLesson?.(lesson.id)}>
                <span>{lesson.title}</span>
                <small>{lesson.category}</small>
              </button>
            ))}
          </div>
        )}

        <div className="quiz-results__review">
          {answers.map((a, i) => (
            <div key={`${a.question}-${i}`} className={`quiz-review-item ${a.isCorrect ? 'quiz-review-item--correct' : 'quiz-review-item--wrong'}`}>
              <div className="quiz-review-item__indicator">{a.isCorrect ? 'OK' : 'NO'}</div>
              <div className="quiz-review-item__text">
                <div className="quiz-review-item__q">{a.question}</div>
                {!a.isCorrect && <div className="quiz-review-item__answer">Correct: {a.correctAnswer}</div>}
                <p className="quiz-review-item__explanation">{a.explanation}</p>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-primary" onClick={handleRetry} style={{ marginTop: '16px' }}>
          Retry Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-module">
      <QuizHistory result={quizResult} compact />

      <div className="quiz-module__progress">
        <div className="quiz-module__counter">
          Question {currentQ + 1} of {quiz.questions.length}
        </div>
        <div className="quiz-module__bar">
          <div className="quiz-module__bar-fill" style={{ width: `${((currentQ + (showExplanation ? 1 : 0)) / quiz.questions.length) * 100}%` }} />
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
          }

          return (
            <button key={`${opt}-${idx}`} className={cls} onClick={() => handleSelect(idx)} disabled={showExplanation}>
              <span className="quiz-option__letter">{String.fromCharCode(65 + idx)}</span>
              <span className="quiz-option__text">{opt}</span>
              {showExplanation && idx === q.correct && <span className="quiz-option__icon">OK</span>}
              {showExplanation && idx === selected && idx !== q.correct && <span className="quiz-option__icon">NO</span>}
            </button>
          );
        })}
      </div>

      {showExplanation && (
        <div className={`quiz-explanation ${selected === q.correct ? 'quiz-explanation--correct' : 'quiz-explanation--wrong'}`}>
          <div className="quiz-explanation__icon">{selected === q.correct ? 'OK' : 'Tip'}</div>
          <div>
            <strong>{selected === q.correct ? 'Correct' : 'Not quite'}</strong>
            <p>{q.explanation}</p>
          </div>
        </div>
      )}

      {showExplanation && (
        <button className="btn btn-primary quiz-next-btn" onClick={handleNext}>
          {currentQ < quiz.questions.length - 1 ? 'Next Question' : 'See Results'}
        </button>
      )}
    </div>
  );
}

function shuffleQuestionOptions(question, questionIndex = 0, attemptSeed = 0) {
  const correctAnswer = question.options[question.correct];
  const distractors = question.options.filter((_, index) => index !== question.correct);

  for (let i = distractors.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [distractors[i], distractors[j]] = [distractors[j], distractors[i]];
  }

  const correctSlot = question.options.length > 0
    ? (questionIndex + attemptSeed + 1) % question.options.length
    : 0;
  const options = [];
  let distractorIndex = 0;

  for (let i = 0; i < question.options.length; i += 1) {
    options.push(i === correctSlot ? correctAnswer : distractors[distractorIndex]);
    if (i !== correctSlot) distractorIndex += 1;
  }

  return {
    ...question,
    options,
    correct: correctSlot,
  };
}

function QuizHistory({ result, compact = false }) {
  if (!result?.attempts?.length) return null;
  return (
    <div className={`quiz-history ${compact ? 'quiz-history--compact' : ''}`}>
      <span>Previous attempts: {result.attempts.length}</span>
      <span>Best: {result.bestScore || 0}%</span>
      <span>Last: {result.lastScore || 0}%</span>
    </div>
  );
}
