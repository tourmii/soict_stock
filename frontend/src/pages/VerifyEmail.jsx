import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Clear any stale session so the user can sign in fresh after verifying
    localStorage.removeItem('soict_userId');

    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link.');
      return;
    }

    api.verifyEmail(token)
      .then((data) => {
        setStatus('success');
        setMessage(data.message || 'Email verified! You can now sign in.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Invalid or expired verification link.');
      });
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--gray-50, #f9fafb)',
      padding: '24px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '48px 40px',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
      }}>
        {status === 'verifying' && (
          <>
            <div style={{ width: 48, height: 48, border: '3px solid #e5e7eb', borderTopColor: '#1B3BFC', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 24px' }} />
            <h2 style={{ color: '#111827', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Verifying your email…</h2>
            <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: 56, height: 56, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2 style={{ color: '#111827', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Email Verified!</h2>
            <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 28px' }}>{message}</p>
            <button
              onClick={() => navigate('/')}
              style={{ background: '#1B3BFC', color: 'white', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Go to Sign In
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width: 56, height: 56, background: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h2 style={{ color: '#111827', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Verification Failed</h2>
            <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 28px' }}>{message}</p>
            <button
              onClick={() => navigate('/')}
              style={{ background: '#1B3BFC', color: 'white', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Back to Home
            </button>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
