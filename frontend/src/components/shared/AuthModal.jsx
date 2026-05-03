import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';

export default function AuthModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { signIn, signUp, loading, error, clearError } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setSuccessMsg('');

    if (mode === 'login') {
      const result = await signIn(email, password);
      if (!result.error) {
        onClose();
        resetForm();
      }
    } else {
      const result = await signUp(email, password, displayName);
      if (!result.error) {
        setSuccessMsg('Account created! Check your email for verification, or you may be auto-logged in.');
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2000);
      }
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setSuccessMsg('');
    clearError();
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    clearError();
    setSuccessMsg('');
  };

  if (!isOpen) return null;

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="auth-modal__header">
          <div className="auth-modal__logo">
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="#1B3BFC" />
              <path d="M7 18L11 12L15 15L21 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="21" cy="8" r="2" fill="#22C55E" />
            </svg>
          </div>
          <h3 className="auth-modal__title">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h3>
          <p className="auth-modal__subtitle">
            {mode === 'login'
              ? 'Sign in to access your portfolio and progress'
              : 'Join SoictStock to save your trading progress'}
          </p>
          <button className="auth-modal__close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`} onClick={() => switchMode()}>
            Sign In
          </button>
          <button className={`auth-tab ${mode === 'signup' ? 'auth-tab--active' : ''}`} onClick={() => switchMode()}>
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="auth-field">
              <label className="auth-label">Display Name</label>
              <input
                type="text"
                className="auth-input"
                placeholder="TraderPro_123"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="auth-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              {error}
            </div>
          )}

          {successMsg && (
            <div className="auth-success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              {successMsg}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <span className="auth-spinner" />
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="auth-footer">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button className="auth-switch" onClick={switchMode}>
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>

      <style>{`
        .auth-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: authFadeIn 0.2s ease;
        }
        @keyframes authFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes authSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .auth-modal {
          background: var(--white, #fff);
          border-radius: 20px;
          width: 420px;
          max-width: 95vw;
          box-shadow: 0 25px 60px rgba(0,0,0,0.3);
          animation: authSlideUp 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .auth-modal__header {
          padding: 32px 32px 16px;
          text-align: center;
          position: relative;
          background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
          border-bottom: 1px solid var(--gray-100, #f3f4f6);
        }
        .auth-modal__logo {
          margin-bottom: 12px;
          display: inline-flex;
        }
        .auth-modal__title {
          font-size: 22px;
          font-weight: 700;
          color: var(--gray-900, #111827);
          margin-bottom: 6px;
        }
        .auth-modal__subtitle {
          font-size: 14px;
          color: var(--gray-500, #6b7280);
        }
        .auth-modal__close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--gray-400, #9ca3af);
          padding: 4px;
          border-radius: 6px;
          transition: all 0.15s;
        }
        .auth-modal__close:hover {
          background: var(--gray-200, #e5e7eb);
          color: var(--gray-700, #374151);
        }
        .auth-tabs {
          display: flex;
          padding: 0 32px;
          gap: 0;
          background: var(--gray-50, #f9fafb);
        }
        .auth-tab {
          flex: 1;
          padding: 14px;
          border: none;
          background: none;
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-400, #9ca3af);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .auth-tab--active {
          color: var(--primary, #1B3BFC);
          border-bottom-color: var(--primary, #1B3BFC);
        }
        .auth-form {
          padding: 24px 32px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .auth-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--gray-700, #374151);
        }
        .auth-input {
          padding: 12px 14px;
          border: 1.5px solid var(--gray-200, #e5e7eb);
          border-radius: 10px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
          background: var(--white, #fff);
          font-family: inherit;
        }
        .auth-input:focus {
          border-color: var(--primary, #1B3BFC);
          box-shadow: 0 0 0 3px rgba(27, 59, 252, 0.1);
        }
        .auth-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 10px;
          color: #DC2626;
          font-size: 13px;
        }
        .auth-success {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: #F0FDF4;
          border: 1px solid #BBF7D0;
          border-radius: 10px;
          color: #16A34A;
          font-size: 13px;
        }
        .auth-submit {
          padding: 14px;
          background: var(--primary, #1B3BFC);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          font-family: inherit;
        }
        .auth-submit:hover:not(:disabled) {
          background: #1530d4;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(27, 59, 252, 0.3);
        }
        .auth-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .auth-spinner {
          width: 20px;
          height: 20px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: authSpin 0.7s linear infinite;
        }
        @keyframes authSpin {
          to { transform: rotate(360deg); }
        }
        .auth-footer {
          padding: 0 32px 24px;
          text-align: center;
          font-size: 13px;
          color: var(--gray-500, #6b7280);
        }
        .auth-switch {
          background: none;
          border: none;
          color: var(--primary, #1B3BFC);
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
          font-family: inherit;
        }
        .auth-switch:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
