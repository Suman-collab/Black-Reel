import React, { useState } from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Youtube } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';

export default function Footer() {
  const { user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const accountEmail = user?.email || '';
  const isVerifiedAccount = Boolean(user?.emailVerified);
  const newsletterEmail = isAuthenticated ? accountEmail : email;

  const handleSubscribe = (e) => {
    e.preventDefault();
    const targetEmail = newsletterEmail.trim().toLowerCase();

    if (!targetEmail) return;

    if (isAuthenticated && !isVerifiedAccount) {
      setStatusMessage('Verify your email to subscribe to the newsletter.');
      return;
    }

    setStatusMessage(`Subscribed successfully with ${targetEmail}!`);

    if (!isAuthenticated) {
      setEmail('');
    }
  };

  return (
    <footer className="blackreel-footer">
      <div className="br-footer-glow" aria-hidden="true"></div>
      <div className="br-footer-container">
        <div className="br-footer-grid">
          
          {/* Column 1: Brand info */}
          <div className="br-footer-column br-brand-column">
            <Link to="/" className="br-footer-logo-link">
              <img src="/images/Horizontal%20logo/Black-Shortz.png" alt="Black Shortz Logo" className="br-footer-logo" />
            </Link>
            <p className="br-footer-description">
              Elevating short-form storytelling. Immerse yourself in premium mobile-first cinema, curated original series, and groundbreaking creator shortz.
            </p>
            <div className="br-social-links-glow">
              <a href="#" aria-label="Twitter" className="social-glow-btn"><Twitter size={18} /></a>
              <a href="#" aria-label="Instagram" className="social-glow-btn"><Instagram size={18} /></a>
              <a href="#" aria-label="Youtube" className="social-glow-btn"><Youtube size={18} /></a>
            </div>
          </div>

          {/* Column 2: Discover Matrix */}
          <div className="br-footer-column">
            <h4 className="br-column-title">Discover</h4>
            <ul className="br-column-links">
              <li><Link to="/">Cinematic Home</Link></li>
              <li><Link to="/categories">Showcase Categories</Link></li>
              <li><Link to="/fandom">Creator Fandom</Link></li>
              <li><Link to="/">Original Releases</Link></li>
              <li><Link to="/plans">Premium Plans</Link></li>
            </ul>
          </div>

          {/* Column 3: Portal & Support */}
          <div className="br-footer-column">
            <h4 className="br-column-title">Member Space</h4>
            <ul className="br-column-links">
              <li><Link to="/profile">My Account</Link></li>
              <li><Link to="/watchlist">My Watchlist</Link></li>
              <li><Link to="/settings">Parental Controls</Link></li>
              <li><Link to="/support">Contact Support</Link></li>
              <li><Link to="/device-management">Linked Devices</Link></li>
            </ul>
          </div>

          {/* Column 4: Newsletter Card */}
          <div className="br-footer-column br-newsletter-column">
            <h4 className="br-column-title">Join The Club</h4>
            <p className="br-newsletter-description">
              Receive weekly insider alerts on fresh indie drops, behind-the-scenes footage, and VIP member benefits.
            </p>
            <form className="br-newsletter-form-premium" onSubmit={handleSubscribe}>
              <div className="br-input-group-premium">
                <input
                  type="email"
                  placeholder={isAuthenticated ? 'Linked Email' : 'Your Email Address'}
                  value={newsletterEmail}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="br-input-premium"
                  disabled={isAuthenticated}
                />
                <button 
                  type="submit" 
                  className="br-submit-btn-premium" 
                  disabled={isAuthenticated && !isVerifiedAccount}
                >
                  Join
                </button>
              </div>
            </form>
            {isAuthenticated && (
              <p className="br-locked-notice">
                {!isVerifiedAccount 
                  ? '⚠️ Verify email to unlock updates.' 
                  : '✓ Linked to your active profile.'}
              </p>
            )}
            {statusMessage && <p className="br-status-success">{statusMessage}</p>}
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="br-footer-divider"></div>
        <div className="br-footer-bottom-premium">
          <p className="br-copyright-premium">
            &copy; {new Date().getFullYear()} <span className="logo-font">Black Shortz</span>. Crafted with passion. All rights reserved.
          </p>
          <div className="br-legal-links-premium">
            <a href="#">Terms of Use</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Cookie Policies</a>
            <a href="#">Compliance</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
