import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import './Auth.css';

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');

    try {
      await requestPasswordReset(email);
      setSuccess('If this email is registered, a reset link has been sent.');
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-split-container">
      <div className="auth-left">
        <div className="auth-form-wrapper">
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Enter your email to get a secure password reset link.</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                placeholder="Enter your account email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            {error ? <p style={{ color: '#ffb3b3', margin: 0 }}>{error}</p> : null}
            {success ? <p style={{ color: '#9fe870', margin: 0 }}>{success}</p> : null}

            <button type="submit" className="btn-auth" disabled={busy}>
              {busy ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <p className="auth-footer-link">
            Back to <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
