import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PracticeTaskCard from './PracticeTaskCard';

function formatMarkdown(text = '') {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

function SlideContent({ section }) {
  if (section.type === 'checklist') {
    return (
      <div>
        <h4 style={{ marginBottom: '12px', color: 'var(--gray-800)' }}>{section.title}</h4>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.9', color: 'var(--gray-700)', fontSize: 'var(--text-md)' }}>
          {section.items?.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
    );
  }
  if (section.type === 'scenario') {
    return (
      <div style={{ background: 'var(--primary-bg)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
        <h4 style={{ marginBottom: '12px', color: 'var(--primary)' }}>{section.title}</h4>
        <p style={{ lineHeight: '1.7', color: 'var(--gray-700)', marginBottom: '16px' }}>{section.body}</p>
        {section.options?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            {section.options.map((opt) => (
              <div key={opt} style={{ background: 'white', border: '1px solid rgba(27,59,252,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 'var(--text-sm)', color: 'var(--gray-700)' }}>{opt}</div>
            ))}
          </div>
        )}
        {section.answer && (
          <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 'var(--text-sm)', color: '#059669' }}>
            <strong>Key insight:</strong> {section.answer}
          </div>
        )}
      </div>
    );
  }
  if (section.type === 'tip') {
    return (
      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '24px', flexShrink: 0 }}>💡</span>
          <div dangerouslySetInnerHTML={{ __html: formatMarkdown(section.body) }} style={{ lineHeight: '1.7', color: 'var(--gray-700)', fontSize: 'var(--text-md)' }} />
        </div>
      </div>
    );
  }
  if (section.type === 'warning') {
    return (
      <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '24px', flexShrink: 0 }}>⚠️</span>
          <div>
            {section.title && <h4 style={{ marginBottom: '8px', color: '#DC2626' }}>{section.title}</h4>}
            <div dangerouslySetInnerHTML={{ __html: formatMarkdown(section.body) }} style={{ lineHeight: '1.7', color: 'var(--gray-700)', fontSize: 'var(--text-md)' }} />
          </div>
        </div>
      </div>
    );
  }
  // concept, example, text
  return (
    <div>
      {section.title && <h4 style={{ marginBottom: '12px', color: 'var(--gray-800)', fontSize: 'var(--text-lg)' }}>{section.title}</h4>}
      <div dangerouslySetInnerHTML={{ __html: formatMarkdown(section.body) }} style={{ lineHeight: '1.85', color: 'var(--gray-700)', fontSize: 'var(--text-md)' }} />
    </div>
  );
}

export default function LessonModal({
  lesson,
  progress,
  onClose,
  onSectionComplete,
  onLessonComplete,
  onStartQuiz,
  portfolioContext,
}) {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const completedSections = new Set(progress?.completedSections || []);
  const totalSlides = lesson.content.length;
  const isLast = slide === totalSlides - 1;
  const isFirst = slide === 0;

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); goPrev(); }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [slide, totalSlides]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const goNext = () => {
    if (slide < totalSlides - 1) setSlide((s) => s + 1);
  };
  const goPrev = () => {
    if (slide > 0) setSlide((s) => s - 1);
  };

  const markCurrentComplete = () => {
    onSectionComplete?.(lesson.id, slide);
    if (isLast) {
      onLessonComplete?.(lesson.id);
    } else {
      goNext();
    }
  };

  const currentSection = lesson.content[slide];
  const currentDone = completedSections.has(slide);
  const allDone = completedSections.size >= totalSlides;

  const difficultyColors = {
    Beginner: { bg: '#ECFDF5', text: '#059669' },
    Intermediate: { bg: '#FFF7ED', text: '#EA580C' },
    Advanced: { bg: '#FEF2F2', text: '#DC2626' },
  };
  const dc = difficultyColors[lesson.difficulty] || difficultyColors.Beginner;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'white', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '760px', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--gray-100)',
          display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0,
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: `${lesson.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, color: lesson.color, flexShrink: 0 }}>
            {lesson.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lesson.category}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', background: dc.bg, color: dc.text }}>{lesson.difficulty}</span>
              <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{lesson.duration}</span>
            </div>
            <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700 }}>{lesson.title}</h3>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--gray-200)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)', flexShrink: 0, fontSize: '16px' }}>×</button>
        </div>

        {/* Progress bar */}
        <div style={{ height: '3px', background: 'var(--gray-100)', flexShrink: 0 }}>
          <div style={{ height: '100%', background: lesson.color, width: `${((slide + 1) / totalSlides) * 100}%`, transition: 'width 0.3s ease' }} />
        </div>

        {/* Slide counter */}
        <div style={{ padding: '12px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: '12px', color: 'var(--gray-400)', fontWeight: 600 }}>
            Section {slide + 1} of {totalSlides}
          </span>
          <div style={{ display: 'flex', gap: '5px' }}>
            {lesson.content.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                style={{
                  width: i === slide ? '20px' : '8px', height: '8px',
                  borderRadius: '4px', border: 'none', cursor: 'pointer',
                  background: completedSections.has(i) ? lesson.color : i === slide ? lesson.color : 'var(--gray-200)',
                  opacity: i === slide ? 1 : 0.6,
                  transition: 'all 0.2s',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Slide content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <SlideContent section={currentSection} />
        </div>

        {/* Footer navigation */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <button
            onClick={goPrev}
            disabled={isFirst}
            style={{ padding: '9px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)', background: 'white', cursor: isFirst ? 'not-allowed' : 'pointer', color: isFirst ? 'var(--gray-300)' : 'var(--gray-700)', fontWeight: 600, fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            ← Prev
          </button>

          <div style={{ flex: 1 }} />

          {!currentDone && (
            <button
              onClick={markCurrentComplete}
              style={{ padding: '9px 18px', borderRadius: 'var(--radius-md)', border: 'none', background: `${lesson.color}15`, color: lesson.color, cursor: 'pointer', fontWeight: 700, fontSize: 'var(--text-sm)' }}
            >
              {isLast ? 'Complete Lesson ✓' : 'Got it → Next'}
            </button>
          )}

          {currentDone && !isLast && (
            <button
              onClick={goNext}
              style={{ padding: '9px 18px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              Next →
            </button>
          )}

          {currentDone && isLast && allDone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {lesson.relatedQuizId && (
                <button
                  onClick={() => { onStartQuiz?.(lesson.relatedQuizId); onClose(); }}
                  style={{ padding: '9px 18px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 'var(--text-sm)' }}
                >
                  Take Quiz →
                </button>
              )}
              {lesson.relatedSimulatorAction && (
                <button
                  onClick={() => { navigate(lesson.relatedSimulatorAction.path); onClose(); }}
                  style={{ padding: '9px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)', background: 'white', color: 'var(--gray-700)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)' }}
                >
                  {lesson.relatedSimulatorAction.label || 'Practice in Simulator'}
                </button>
              )}
              <span style={{ fontSize: '14px', color: '#059669', fontWeight: 700 }}>✓ Completed!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
