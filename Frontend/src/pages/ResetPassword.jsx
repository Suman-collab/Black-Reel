import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './Auth.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const hasToken = useMemo(() => token.trim().length > 0, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');

    try {
      throw new Error('Firebase handles password reset on its secure hosted page. Please use the link sent to your email.');
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
          <h1 className="auth-title">Set New Password</h1>
          <p className="auth-subtitle">Firebase secure reset link is required for password changes.</p>

          <form onSubmit={handleSubmit} className="auth-form">
            {error ? <p style={{ color: '#ffb3b3', margin: 0 }}>{error}</p> : null}
            {success ? <p style={{ color: '#9fe870', margin: 0 }}>{success}</p> : null}

            <button type="submit" className="btn-auth" disabled={busy || !hasToken}>
              {busy ? 'Checking...' : 'Use Email Reset Link'}
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
