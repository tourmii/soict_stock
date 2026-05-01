import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="8" fill="#1B3BFC" />
                <path d="M7 18L11 12L15 15L21 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="21" cy="8" r="2" fill="#22C55E" />
              </svg>
              <span className="footer__logo-text">Soict<span className="text-primary">Stock</span></span>
            </Link>
            <p className="footer__tagline">Learn stock trading through realistic market simulation. Build confidence before investing real money.</p>
            <div className="footer__socials">
              <a href="#" aria-label="Twitter" className="footer__social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="footer__social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="#" aria-label="GitHub" className="footer__social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              </a>
            </div>
          </div>

          <div className="footer__columns">
            <div className="footer__column">
              <h4 className="footer__column-title">Product</h4>
              <Link to="/simulation" className="footer__link">Trading Simulator</Link>
              <Link to="/portfolio" className="footer__link">Portfolio Tracker</Link>
              <Link to="/leaderboard" className="footer__link">Leaderboard</Link>
              <a href="#" className="footer__link">Backtesting</a>
            </div>
            <div className="footer__column">
              <h4 className="footer__column-title">Resources</h4>
              <a href="#" className="footer__link">Learning Center</a>
              <a href="#" className="footer__link">Market Insights</a>
              <a href="#" className="footer__link">Trading Strategies</a>
              <a href="#" className="footer__link">Documentation</a>
            </div>
            <div className="footer__column">
              <h4 className="footer__column-title">Company</h4>
              <a href="#" className="footer__link">About Us</a>
              <a href="#" className="footer__link">Careers</a>
              <a href="#" className="footer__link">Blog</a>
              <a href="#" className="footer__link">Contact</a>
            </div>
            <div className="footer__column">
              <h4 className="footer__column-title">Legal</h4>
              <a href="#" className="footer__link">Privacy Policy</a>
              <a href="#" className="footer__link">Terms of Service</a>
              <a href="#" className="footer__link">Cookie Policy</a>
              <a href="#" className="footer__link">Disclaimer</a>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">© 2026 SoictStock. All rights reserved. For educational purposes only.</p>
          <p className="footer__contact">contact@soictstock.com · +1 (555) 123-4567</p>
        </div>
      </div>
    </footer>
  );
}
