import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { toast } from '../lib/toast';
import './Auth.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification } = useAuth();
  const email = searchParams.get('email') || '';
  const [busy, setBusy] = useState(false);

  const handleVerify = async () => {
    setBusy(true);

    try {
      await verifyEmail();
      toast.success('Email verified successfully. Redirecting...');
      setTimeout(() => navigate('/', { replace: true }), 800);
    } catch (apiError) {
      toast.error(apiError.message);
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setBusy(true);

    try {
      await resendVerification(email || undefined);
      toast.success('Verification email sent. Check your inbox.');
    } catch (apiError) {
      toast.error(apiError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-split-container">
      <div className="auth-left animate-fade-in-up">
        <div className="form-container">
          <h1 className="form-title">Verify Your Email</h1>
          <p className="form-subtitle">
            {email ? `Verification required for ${email}.` : 'Open your inbox and verify your account to continue.'}
          </p>

          <div className="auth-terms" style={{ marginTop: '24px', display: 'grid', gap: '12px' }}>
            <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={() => { void handleVerify(); }}>
              {busy ? 'Checking...' : 'I Have Verified'}
            </button>
            <button type="button" className="btn btn-outline btn-block" disabled={busy} onClick={() => { void handleResend(); }}>
              {busy ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>

          <p className="auth-footer-link" style={{ marginTop: '24px' }}>
            Already verified? <Link to="/login" style={{ color: 'var(--brand-primary)' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
