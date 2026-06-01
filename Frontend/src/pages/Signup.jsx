import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import { useAuth, getFirebaseErrorMessage } from '../features/auth/AuthContext';
import { toast } from '../lib/toast';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const navigate = useNavigate();
  const { register, beginGoogleOAuth, error, setError } = useAuth();

  const handleSignup = async (event) => {
    event.preventDefault();

    if (!terms) {
      toast.warning('Please agree to the terms and policy before creating an account.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await register({ name, email, password });

      if (result?.requiresEmailVerification) {
        toast.success('Registration successful! A verification email has been sent.');
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      toast.success('Registration successful! Welcome to Black Reel.');
      navigate('/subscribe');
    } catch (apiError) {
      const mappedErrorMsg = getFirebaseErrorMessage(apiError.code || apiError.message);
      toast.error(mappedErrorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setOauthLoading(true);

    try {
      const user = await beginGoogleOAuth();
      if (user) {
        toast.success('Google sign-in successful! Welcome to Black Reel.');
        navigate('/', { replace: true });
      }
    } catch (apiError) {
      const mappedErrorMsg = getFirebaseErrorMessage(apiError.code || apiError.message);
      toast.error(mappedErrorMsg);
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <div className="auth-split-container">
      <div className="auth-left animate-fade-in-up">
        <div className="form-container">
          <h1 className="form-title">Get Started Now</h1>
          <p className="form-subtitle">Create an account to start watching.</p>

          <form onSubmit={handleSignup} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                className="form-input"
                placeholder="Enter your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="form-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="form-input"
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="form-input-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="auth-terms">
              <input
                type="checkbox"
                id="terms"
                checked={terms}
                onChange={(event) => setTerms(event.target.checked)}
              />
              <label htmlFor="terms">I agree to the <span style={{ color: 'var(--brand-primary)' }}>terms &amp; policy</span></label>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="form-divider">Or</div>

          <button
            type="button"
            className="btn-google"
            onClick={() => {
              void handleGoogleSignup();
            }}
            disabled={submitting || oauthLoading}
          >
            <span className="google-auth-icon" aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
              <svg viewBox="0 0 48 48" width="18" height="18">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.39 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.41 13.72 17.76 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.1 24.55c0-1.64-.15-3.21-.42-4.73H24v9.01h12.39c-.53 2.9-2.18 5.35-4.64 7.01l7.2 5.59C43.74 37.01 46.1 31.33 46.1 24.55z" />
                <path fill="#FBBC05" d="M10.54 28.41A14.7 14.7 0 0 1 9.77 24c0-1.53.27-3 .77-4.41l-7.98-6.19A24.06 24.06 0 0 0 0 24c0 3.84.92 7.47 2.56 10.6l7.98-6.19z" />
                <path fill="#34A853" d="M24 48c6.39 0 11.75-2.11 15.66-5.74l-7.2-5.59c-2 1.34-4.56 2.13-8.46 2.13-6.24 0-11.59-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
            </span>
            <span>{oauthLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          <p className="auth-footer-link" style={{ marginTop: '24px' }}>
            Have an account? <Link to="/login" style={{ color: 'var(--brand-primary)' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

