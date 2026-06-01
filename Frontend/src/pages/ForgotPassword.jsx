import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { toast } from '../lib/toast';
import './Auth.css';

export default function ForgotPassword() {
  const { requestPasswordReset, setError: setGlobalError } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [localError, setLocalError] = useState('');

  
  useEffect(() => {
    if (typeof setGlobalError === 'function') {
      setGlobalError('');
    }
  }, [setGlobalError]);

  
  const validateEmail = (emailStr) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(String(emailStr).trim().toLowerCase());
  };

  
  const getFriendlyErrorMessage = (errorCode) => {
    const errorMessages = {
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-not-found': 'No account found with this email address.',
      'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
      'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
      'auth/internal-error': 'An internal error occurred. Please try again.',
      'auth/configuration-not-found': 'Firebase is not configured correctly. Please check your environment keys.',
    };
    return errorMessages[errorCode] || 'Failed to send reset link. Please verify your email and try again.';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setLocalError('');
    setSuccess('');

    const trimmedEmail = email.trim();

    
    if (!trimmedEmail) {
      toast.warning('Email address is required.');
      setBusy(false);
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      toast.warning('Please enter a valid email address format (e.g. user@example.com).');
      setBusy(false);
      return;
    }

    try {
      await requestPasswordReset(trimmedEmail);
      setSubmittedEmail(trimmedEmail);
      setSuccess('A secure password reset link has been sent to your email.');
      toast.success('Password reset email sent successfully!');
      setEmail(''); 
    } catch (apiError) {
      const errorCode = apiError?.code || '';
      const friendlyError = getFriendlyErrorMessage(errorCode);
      toast.error(friendlyError);
      setLocalError(friendlyError);
      
      
      if (typeof setGlobalError === 'function') {
        setGlobalError('');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-split-container">
      {}
      <style>{`
        .forgot-card {
          background: rgba(20, 20, 20, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
          width: 100%;
          max-width: 460px;
          animation: fadeInForgotPassword 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          box-sizing: border-box;
        }

        .auth-icon-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .auth-lock-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(198, 167, 94, 0.1);
          border: 1px solid rgba(198, 167, 94, 0.25);
          color: #c6a75e;
          animation: floatLockIcon 4s ease-in-out infinite;
        }

        .auth-success-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(159, 232, 112, 0.1);
          border: 1px solid rgba(159, 232, 112, 0.3);
          color: #9fe870;
          animation: pulseSuccessIcon 2s ease-in-out infinite;
        }

        .auth-input-icon-wrapper {
          position: relative;
          width: 100%;
          box-sizing: border-box;
        }

        .auth-input-icon-wrapper input {
          width: 100%;
          box-sizing: border-box;
        }

        .auth-input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #888;
          pointer-events: none;
          transition: color 0.2s;
        }

        .auth-input-with-icon {
          padding-left: 48px !important;
        }

        .form-group input:focus + .auth-input-icon {
          color: #c6a75e;
        }

        .btn-auth-loader {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spinLoader 0.8s linear infinite;
        }

        .submitted-email-accent {
          color: #c6a75e;
          font-weight: 600;
          word-break: break-all;
        }

        .success-accent-block {
          background: rgba(159, 232, 112, 0.05);
          border-left: 3px solid #9fe870;
          padding: 16px;
          border-radius: 4px 8px 8px 4px;
          margin-bottom: 24px;
        }

        .success-accent-text {
          color: #eee;
          font-size: 0.95rem;
          line-height: 1.6;
          margin: 0;
        }

        .back-btn-outline {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #eee;
          padding: 14px;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          text-decoration: none;
          box-sizing: border-box;
          margin-top: 12px;
        }

        .back-btn-outline:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.3);
          color: #fff;
        }

        @keyframes fadeInForgotPassword {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes floatLockIcon {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }

        @keyframes pulseSuccessIcon {
          0% { box-shadow: 0 0 0 0 rgba(159, 232, 112, 0.2); }
          70% { box-shadow: 0 0 0 10px rgba(159, 232, 112, 0); }
          100% { box-shadow: 0 0 0 0 rgba(159, 232, 112, 0); }
        }

        @keyframes spinLoader {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="auth-left animate-fade-in-up">
        <div className="form-container">
          {!success ? (
            /* Forgot Password Request State */
            <>
              <div className="auth-icon-wrapper">
                <div className="auth-lock-circle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
              </div>

              <h1 className="form-title" style={{ textAlign: 'center', marginBottom: '12px' }}>
                Reset Password
              </h1>
              <p className="form-subtitle" style={{ textAlign: 'center', marginBottom: '32px' }}>
                Enter your email address below and we'll send you a secure link to reset your account password.
              </p>

              <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email address</label>
                  <div className="auth-input-icon-wrapper">
                    <input
                      type="email"
                      id="email"
                      className="form-input auth-input-with-icon"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={busy}
                      required
                      aria-label="Email address"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="auth-input-icon">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-block btn-auth-loader" disabled={busy} style={{ width: '100%' }}>
                  {busy ? (
                    <>
                      <div className="spinner" aria-hidden="true"></div>
                      <span>Sending Secure Link...</span>
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <p className="auth-footer-link" style={{ marginTop: '32px', marginBottom: 0, textAlign: 'center' }}>
                Already remembered? <Link to="/login" style={{ color: 'var(--brand-primary)' }}>Sign In</Link>
              </p>
            </>
          ) : (
            /* Gorgeous Success Confirmation State */
            <div style={{ animation: 'fadeInForgotPassword 0.4s ease-out' }}>
              <div className="auth-icon-wrapper">
                <div className="auth-success-circle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              </div>

              <h1 className="auth-title" style={{ textAlign: 'center', marginBottom: '12px' }}>
                Check Your Inbox
              </h1>
              <p className="auth-subtitle" style={{ textAlign: 'center', marginBottom: '24px', color: '#aaa', fontSize: '0.9rem', lineHeight: '1.5' }}>
                A password reset email has been successfully dispatched to your mailbox.
              </p>

              <div className="success-accent-block">
                <p className="success-accent-text">
                  We have sent a secure link to <span className="submitted-email-accent">{submittedEmail}</span>. Click on the link inside the email to establish a new password for your account.
                </p>
              </div>

              <p style={{ color: '#aaa', fontSize: '0.8rem', textAlign: 'center', margin: '0 0 24px 0', lineHeight: '1.5' }}>
                Did not receive the email? Check your junk/spam folder or try sending it again.
              </p>

              <Link to="/login" className="btn btn-primary btn-block" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                Return to Sign In
              </Link>

              <button
                onClick={() => {
                  setSuccess('');
                  setLocalError('');
                }}
                className="btn btn-outline btn-block"
                style={{ marginTop: '12px' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
                Resend Reset Email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


