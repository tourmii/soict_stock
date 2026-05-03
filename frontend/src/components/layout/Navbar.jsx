import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import UserMenu from './UserMenu';
import AuthModal from '../shared/AuthModal';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/simulation', label: 'Simulator' },
    { path: '/learn', label: 'Learn' },
    { path: '/portfolio', label: 'Portfolio' },
    { path: '/leaderboard', label: 'Leaderboard' },
  ];

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} id="main-navbar">
        <div className="navbar__inner container">
          <Link to="/" className="navbar__logo" id="logo-link">
            <div className="navbar__logo-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="8" fill="#1B3BFC" />
                <path d="M7 18L11 12L15 15L21 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="21" cy="8" r="2" fill="#22C55E" />
              </svg>
            </div>
            <span className="navbar__logo-text">
              Soict<span className="navbar__logo-accent">Stock</span>
            </span>
          </Link>

          <div className={`navbar__links ${mobileOpen ? 'navbar__links--open' : ''}`}>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`navbar__link ${location.pathname === link.path ? 'navbar__link--active' : ''}`}
                id={`nav-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="navbar__actions">
            {user ? (
              <UserMenu />
            ) : (
              <button
                className="btn btn-primary btn-sm"
                id="nav-cta"
                onClick={() => setAuthModalOpen(true)}
              >
                Sign In
              </button>
            )}
            <button
              className="navbar__mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              id="mobile-menu-toggle"
              aria-label="Toggle menu"
            >
              <span className={`hamburger ${mobileOpen ? 'hamburger--active' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </div>
        </div>
      </nav>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
