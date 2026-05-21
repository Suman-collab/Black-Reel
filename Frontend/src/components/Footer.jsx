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
      setStatusMessage('Verify your email before subscribing to the newsletter.');
      return;
    }

    setStatusMessage(`Subscribed with ${targetEmail}`);

    if (!isAuthenticated) {
      setEmail('');
    }
  };

  return (
    <footer className="blackreel-footer">
      <div className="br-footer-glow" aria-hidden="true"></div>
      <div className="br-footer-container">
        <div className="br-footer-top">
          <div className="br-footer-brand">
            <Link to="/" className="br-footer-logo-link">
              <img src="/images/Horizontal%20logo/Black-Shortz.png" alt="Black Shortz Logo" className="br-footer-logo" />
            </Link>
            <p className="br-footer-desc">
              Premium short-form cinema and episodic stories crafted for immersive, mobile-first streaming.
            </p>
            <div className="br-social-links">
              <a href="#" aria-label="Twitter"><Twitter size={16} /></a>
              <a href="#" aria-label="Instagram"><Instagram size={16} /></a>
              <a href="#" aria-label="Youtube"><Youtube size={16} /></a>
            </div>
          </div>

          <div className="br-footer-links-layout">
            <div className="br-footer-col">
              <h4 className="br-footer-heading">Discover</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/categories">Categories</Link></li>
                <li><Link to="/fandom">Fandom</Link></li>
                <li><Link to="/">Originals</Link></li>
              </ul>
            </div>

            <div className="br-footer-col">
              <h4 className="br-footer-heading">Account</h4>
              <ul>
                <li><Link to="/profile">Profile</Link></li>
                <li><Link to="/watchlist">Watchlist</Link></li>
                <li><Link to="/settings">Settings</Link></li>
                <li><Link to="/payment-history">Billing</Link></li>
              </ul>
            </div>

            <div className="br-footer-col">
              <h4 className="br-footer-heading">Support</h4>
              <ul>
                <li><a href="mailto:support@blackreel.com">Help Center</a></li>
                <li><a href="mailto:support@blackreel.com">Contact Us</a></li>
                <li><a href="#">Plans & Pricing</a></li>
                <li><a href="#">Device Compatibility</a></li>
              </ul>
            </div>
          </div>

          <div className="br-footer-newsletter">
            <div className="br-newsletter-card">
              <p className="br-newsletter-kicker">Stay Updated</p>
              <h4 className="br-footer-heading br-newsletter-heading">Newsletter</h4>
              <p className="br-newsletter-text">Get release alerts, creator drops, and curated picks every week.</p>
            </div>
            <form className="br-newsletter-form" onSubmit={handleSubscribe}>
              <div className="br-form-group">
                <input
                  type="email"
                  placeholder={isAuthenticated ? 'Email linked to your account' : 'Email Address'}
                  value={newsletterEmail}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="br-newsletter-input"
                  disabled={isAuthenticated}
                />
                <button type="submit" className="br-newsletter-btn" disabled={isAuthenticated && !isVerifiedAccount}>SUBSCRIBE</button>
              </div>
            </form>
            <div className="br-app-links">
              <a href="#" className="br-app-badge">iOS App</a>
              <a href="#" className="br-app-badge">Android App</a>
            </div>
            {isAuthenticated ? (
              <p className="br-newsletter-locked-copy">
                Newsletter signup is tied to your active account: <strong>{accountEmail}</strong>.{!isVerifiedAccount ? ' Verify your email to enable subscription.' : ' Log out and switch accounts to use a different email.'}
              </p>
            ) : null}
            {statusMessage && <p className="br-status-msg">{statusMessage}</p>}
          </div>
        </div>

        <div className="br-footer-bottom">
          <p className="br-copyright">
            &copy; {new Date().getFullYear()} Black Shortz. All rights reserved.
          </p>
          <div className="br-bottom-links">
            <a href="#">Terms of Service</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Cookie Preferences</a>
            <a href="#">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
