import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Auth.css';
import { useAuth, getFirebaseErrorMessage } from '../features/auth/AuthContext';
import { toast } from '../lib/toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, beginGoogleOAuth, setError } = useAuth();

  const redirectTo = location.state?.from || '/';

  const handleLogin = async (event) => {
    event.preventDefault();
    console.log(`[Login Page] Form submitted. Attempting login for email: ${email}`);
    setSubmitting(true);
    setError('');

    try {
      await login({ email, password });
      console.log(`[Login Page] Login successful. Redirecting user to: ${redirectTo}`);
      toast.success('Welcome back! Login successful.');
      navigate(redirectTo, { replace: true });
    } catch (apiError) {
      console.error('[Login Page] Form login failed:', apiError);
      const mappedErrorMsg = getFirebaseErrorMessage(apiError.code || apiError.message);
      toast.error(mappedErrorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    console.log('[Login Page] Google login triggered.');
    setError('');
    setOauthLoading(true);

    try {
      const user = await beginGoogleOAuth();
      if (user) {
        console.log('[Login Page] Google login successful. Redirecting to home (/).');
        toast.success('Google sign-in successful! Welcome back.');
        navigate('/', { replace: true });
      } else {
        console.warn('[Login Page] Google login did not return a user object.');
      }
    } catch (apiError) {
      console.error('[Login Page] Google login failed:', apiError);
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
          <h1 className="form-title">Welcome Back</h1>
          <p className="form-subtitle">Sign in to continue watching.</p>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
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
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
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
                id="remember"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <label htmlFor="remember">Keep me signed in on this device</label>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="form-divider">Or</div>

          <button
            type="button"
            className="btn-google"
            onClick={() => {
              void handleGoogleLogin();
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
            Forgot password? <Link to="/forgot-password" style={{ color: 'var(--brand-primary)' }}>Reset it</Link>
          </p>
          <p className="auth-footer-link">
            Don&apos;t have an account? <Link to="/signup" style={{ color: 'var(--brand-primary)' }}>Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
