import React, { useState } from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      alert(`Subscribed with ${email}!`);
      setEmail('');
    }
  };

  return (
    <footer className="footer-container">
      <div className="container footer-content">
        <div className="footer-brand-col">
          <Link to="/" className="footer-brand">
            <img src="/images/Horizontal%20logo/Black-Shortz.png" alt="Black Shortz Logo" style={{ height: '100px', objectFit: 'contain' }} />
          </Link>
          <p className="footer-desc">
            Your premium destination for cinematic storytelling and gripping series.
          </p>
          <div className="social-links">
            <a href="#" aria-label="Facebook"><Facebook size={20} /></a>
            <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
            <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
            <a href="#" aria-label="Youtube"><Youtube size={20} /></a>
          </div>
        </div>

        <div className="footer-links-col">
          <h4 className="footer-title">Browse</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/categories">Categories</Link></li>
            <li><Link to="/fandom">Fandom</Link></li>
            <li><Link to="/">Originals</Link></li>
          </ul>
        </div>

        <div className="footer-links-col">
          <h4 className="footer-title">Account</h4>
          <ul className="footer-links">
            <li><Link to="/profile">Profile</Link></li>
            <li><Link to="/watchlist">Watchlist</Link></li>
            <li><Link to="/profile">Settings</Link></li>
            <li><a href="#">Help Center</a></li>
          </ul>
        </div>

        <div className="footer-newsletter-col">
          <h4 className="footer-title">Newsletter</h4>
          <p className="newsletter-desc">Subscribe for the latest updates on new releases and original series.</p>
          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="newsletter-btn">SUBSCRIBE</button>
          </form>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Black Shortz. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
