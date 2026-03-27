import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import { useAuth } from '../features/auth/AuthContext';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSignup = async (event) => {
    event.preventDefault();

    if (!terms) {
      setError('Please agree to the terms before creating an account.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await register({ name, email, password });
      navigate('/subscribe');
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSubmitting(false);
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
              <input
                type="text"
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Create a password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <div className="auth-terms">
              <input
                type="checkbox"
                id="terms"
                checked={terms}
                onChange={(event) => setTerms(event.target.checked)}
              />
              <label htmlFor="terms">I agree to the <span>terms &amp; policy</span></label>
            </div>

            {error ? <p style={{ color: '#ffb3b3', margin: 0 }}>{error}</p> : null}

            <button type="submit" className="btn-auth" disabled={submitting}>
              {submitting ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className="auth-footer-link">
            Have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
