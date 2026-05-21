import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import './Auth.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification } = useAuth();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const hasVerificationToken = useMemo(() => token.trim().length > 0, [token]);

  const handleVerify = async () => {
    if (!hasVerificationToken) {
      setError('Verification link is incomplete. Request a new verification email.');
      return;
    }

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      await verifyEmail(token);
      setSuccess('Email verified successfully. Redirecting...');
      setTimeout(() => navigate('/', { replace: true }), 800);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setBusy(true);
    setError('');
    setSuccess('');

    try {
      await resendVerification(email || undefined);
      setSuccess('Verification email sent. Check your inbox.');
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
          <h1 className="auth-title">Verify Your Email</h1>
          <p className="auth-subtitle">
            {email ? `Verification required for ${email}.` : 'Open your inbox and verify your account to continue.'}
          </p>

          {error ? <p style={{ color: '#ffb3b3', margin: 0 }}>{error}</p> : null}
          {success ? <p style={{ color: '#9fe870', margin: 0 }}>{success}</p> : null}

          <div className="auth-terms" style={{ marginTop: '14px', display: 'grid', gap: '10px' }}>
            {hasVerificationToken ? (
              <button type="button" className="btn-auth" disabled={busy} onClick={() => { void handleVerify(); }}>
                {busy ? 'Verifying...' : 'Verify Email'}
              </button>
            ) : null}
            <button type="button" className="btn-auth" disabled={busy} onClick={() => { void handleResend(); }}>
              {busy ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>

          <p className="auth-footer-link">
            Already verified? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
