export default function RecommendedLessonCard({ lesson, reason, onOpen }) {
  if (!lesson) return null;

  return (
    <div className="recommended-card card">
      <span className="recommended-card__eyebrow">Recommended for you</span>
      <h3>{lesson.title}</h3>
      <p>{reason || 'Because this is the next useful step in your learning path.'}</p>
      <button className="btn btn-primary btn-sm" onClick={() => onOpen(lesson.id)}>
        Open Lesson
      </button>
    </div>
  );
}
