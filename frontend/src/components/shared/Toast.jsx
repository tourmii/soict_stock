import { useEffect } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import './Toast.css';

export default function Toast() {
  const toasts = useSettingsStore((s) => s.toasts);
  const removeToast = useSettingsStore((s) => s.removeToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    const latest = toasts[toasts.length - 1];
    const timer = setTimeout(() => removeToast(latest.id), 6000);
    return () => clearTimeout(timer);
  }, [toasts.length]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" id="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type || 'info'} animate-slide-in-right`}
          id={`toast-${toast.id}`}
        >
          <div className="toast__icon">
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '✕'}
            {toast.type === 'warning' && '⚠'}
            {toast.type === 'info' && 'ℹ'}
            {toast.type === 'trade' && '📊'}
          </div>
          <div className="toast__content">
            {toast.title && <p className="toast__title">{toast.title}</p>}
            <p className="toast__message">{toast.message}</p>
            {toast.lesson && (
              <a href="#" className="toast__lesson-link">📚 Learn more about this →</a>
            )}
          </div>
          <button className="toast__close" onClick={() => removeToast(toast.id)} aria-label="Close">×</button>
        </div>
      ))}
    </div>
  );
}
