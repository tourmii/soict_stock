import { useNavigate } from 'react-router-dom';
import { isPracticeTaskComplete } from '../../lib/learningUtils';

export default function PracticeTaskCard({ task, portfolioContext, onStartQuiz }) {
  const navigate = useNavigate();
  if (!task) return null;

  const result = isPracticeTaskComplete(task, portfolioContext);
  const cta = getCta(task);

  const handleAction = () => {
    if (task.type === 'complete_quiz' && onStartQuiz) {
      onStartQuiz(task.target?.quizId || task.relatedQuizId);
      return;
    }
    navigate(cta.path);
  };

  return (
    <div className={`practice-task ${result.completed ? 'practice-task--done' : ''}`}>
      <div>
        <div className="practice-task__eyebrow">Practice task</div>
        <h5 className="practice-task__title">{task.title}</h5>
        <p className="practice-task__desc">{task.description}</p>
        <p className="practice-task__status">{result.status}</p>
      </div>
      {!result.completed && (
        <button className="btn btn-secondary btn-sm" onClick={handleAction}>
          {cta.label}
        </button>
      )}
    </div>
  );
}

function getCta(task) {
  if (task.type === 'complete_quiz') return { label: 'Start Quiz', path: '/learn' };
  if (task.type === 'sector_allocation') return { label: 'Go to Portfolio', path: '/portfolio' };
  return task.cta || { label: 'Go to Simulator', path: '/simulation' };
}
