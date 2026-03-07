import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    if (!terms) {
      alert("Please agree to the terms.");
      return;
    }
    if (name && email && password) {
      navigate('/subscribe');
    }
  };

  return (
    <div className="auth-split-container">
      <div className="auth-left">
        <div className="auth-form-wrapper">
          <h1 className="auth-title">Get Started Now</h1>
          <p className="auth-subtitle">Create an account to start watching.</p>

          <form onSubmit={handleSignup} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input type="text" id="name" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input type="email" id="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            <div className="auth-terms">
              <input type="checkbox" id="terms" checked={terms} onChange={e => setTerms(e.target.checked)} />
              <label htmlFor="terms">I agree to the <span>terms & policy</span></label>
            </div>

            <button type="submit" className="btn-auth">Signup</button>

            <div className="auth-divider">
              <span>Or</span>
            </div>

            <div className="auth-socials">
              <button type="button" className="btn-social google">
                <img src="https://img.icons8.com/color/24/000000/google-logo.png" alt="Google" />
                Sign in with Google
              </button>
              <button type="button" className="btn-social apple">
                <img src="https://img.icons8.com/ios-filled/24/000000/mac-os.png" alt="Apple" />
                Sign in with Apple
              </button>
            </div>
          </form>

          <p className="auth-footer-link">
            Have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
