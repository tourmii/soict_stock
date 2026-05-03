import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const { user, profile, signOut } = useAuthStore();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'Trader';
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
  };

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-menu__trigger"
        onClick={() => setOpen(!open)}
        aria-label="User menu"
      >
        <div className="user-menu__avatar">{initials}</div>
        <span className="user-menu__name">{displayName}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {open && (
        <div className="user-menu__dropdown">
          <div className="user-menu__info">
            <div className="user-menu__avatar user-menu__avatar--lg">{initials}</div>
            <div>
              <div className="user-menu__info-name">{displayName}</div>
              <div className="user-menu__info-email">{user.email}</div>
            </div>
          </div>
          <div className="user-menu__divider" />
          <button className="user-menu__item" onClick={handleSignOut}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign Out
          </button>
        </div>
      )}

      <style>{`
        .user-menu {
          position: relative;
        }
        .user-menu__trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px 6px 6px;
          border: 1.5px solid var(--gray-200, #e5e7eb);
          border-radius: var(--radius-full, 50px);
          background: var(--white, #fff);
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .user-menu__trigger:hover {
          border-color: var(--primary, #1B3BFC);
          box-shadow: 0 0 0 3px rgba(27, 59, 252, 0.08);
        }
        .user-menu__avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1B3BFC, #6366F1);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .user-menu__avatar--lg {
          width: 40px;
          height: 40px;
          font-size: 14px;
        }
        .user-menu__name {
          font-size: 13px;
          font-weight: 600;
          color: var(--gray-700, #374151);
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .user-menu__dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 240px;
          background: var(--white, #fff);
          border: 1px solid var(--gray-200, #e5e7eb);
          border-radius: 14px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
          z-index: 1100;
          animation: menuSlide 0.2s ease;
          overflow: hidden;
        }
        @keyframes menuSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .user-menu__info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
        }
        .user-menu__info-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-800, #1f2937);
        }
        .user-menu__info-email {
          font-size: 12px;
          color: var(--gray-500, #6b7280);
          margin-top: 2px;
        }
        .user-menu__divider {
          height: 1px;
          background: var(--gray-100, #f3f4f6);
        }
        .user-menu__item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 12px 16px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: var(--gray-700, #374151);
          transition: all 0.15s;
          font-family: inherit;
        }
        .user-menu__item:hover {
          background: var(--gray-50, #f9fafb);
          color: #DC2626;
        }
        @media (max-width: 640px) {
          .user-menu__name { display: none; }
        }
      `}</style>
    </div>
  );
}
