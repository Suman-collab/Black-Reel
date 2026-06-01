import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './Auth.css';
import { useAuth, getFirebaseErrorMessage } from '../features/auth/AuthContext';
import { toast } from '../lib/toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword, setError } = useAuth();
  const resetCode = searchParams.get('oobCode') || searchParams.get('token') || '';
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const hasToken = useMemo(() => resetCode.trim().length > 0, [resetCode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    if (password.length < 6) {
      setBusy(false);
      toast.warning('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setBusy(false);
      toast.warning('Passwords do not match.');
      return;
    }

    try {
      await resetPassword({ oobCode: resetCode, newPassword: password });
      toast.success('Password reset successful. Redirecting to sign in...');
      setTimeout(() => navigate('/login', { replace: true }), 1000);
    } catch (apiError) {
      const mappedErrorMsg = getFirebaseErrorMessage(apiError.code || apiError.message);
      toast.error(mappedErrorMsg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-split-container">
      <div className="auth-left animate-fade-in-up">
        <div className="form-container">
          <h1 className="form-title">Set New Password</h1>
          <p className="form-subtitle">Enter your new password to complete account recovery.</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                className="form-input"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-new-password">Confirm password</label>
              <input
                id="confirm-new-password"
                type="password"
                className="form-input"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={busy || !hasToken}>
              {busy ? 'Updating...' : 'Reset Password'}
            </button>
          </form>

          <p className="auth-footer-link" style={{ marginTop: '24px' }}>
            Back to <Link to="/login" style={{ color: 'var(--brand-primary)' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
