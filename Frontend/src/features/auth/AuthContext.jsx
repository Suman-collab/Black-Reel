import { createContext, useContext, useEffect, useState } from 'react';
import * as authService from './auth.service';
import { clearStoredAuth, setStoredAuth } from '../../lib/storage';
import { isSuspensionMessage, registerUnauthorizedHandler, registerDeviceLimitHandler } from '../../lib/api';
import { DEFAULT_SUSPENSION_MESSAGE, isRestrictedAccountStatus } from '../../lib/accountStatus';
import { clearStoredSuspension, getStoredSuspension, setStoredSuspension } from '../../lib/suspension';
import { auth } from '../../firebase/config';
import {
  loginWithEmail,
  signupWithEmail,
  loginWithGoogle,
  logoutUser,
  resetPassword as sendFirebasePasswordResetEmail,
  resetPasswordWithCode,
  onAuthChange,
} from '../../firebase/auth';

const AuthContext = createContext(null);

export const getFirebaseErrorMessage = (errorCode) => {
  const messages = {
    
    'auth/configuration-not-found':
      'Firebase is not set up correctly. Please fill in ' +
      'VITE_FIREBASE_* keys in your .env file and restart.',

    
    
    'auth/invalid-credential':
      'Incorrect email or password. Please try again.',
    
    'auth/invalid-login-credentials':
      'Incorrect email or password. Please try again.',
    
    'auth/wrong-password':
      'Incorrect password. Please try again.',
    'auth/user-not-found':
      'No account found with this email.',

    
    'auth/user-disabled':
      'This account has been disabled. Contact support.',
    'auth/email-already-in-use':
      'An account with this email already exists.',
    'auth/account-exists-with-different-credential':
      'An account with this email already exists using a different sign-in method.',

    
    'auth/invalid-email':
      'Please enter a valid email address.',
    'auth/weak-password':
      'Password must be at least 6 characters.',
    'auth/missing-password':
      'Please enter your password.',
    'auth/missing-email':
      'Please enter your email address.',

    
    'auth/too-many-requests':
      'Too many failed attempts. Please wait a few minutes and try again.',
    'auth/network-request-failed':
      'Network error. Please check your connection and try again.',

    
    'auth/popup-closed-by-user':        '',
    'auth/cancelled-popup-request':     '',
    'auth/popup-blocked':
      'Popup was blocked by your browser. Please allow popups for this site.',
    'auth/unauthorized-domain':
      'This domain is not authorised in your Firebase console.',

    
    'auth/expired-action-code':
      'This link has expired. Please request a new one.',
    'auth/invalid-action-code':
      'This link is invalid or has already been used.',
    'auth/requires-recent-login':
      'Please sign out and sign back in before making this change.',

    
    'auth/internal-error':
      'An internal error occurred. Please try again.',
    'auth/operation-not-allowed':
      'This sign-in method is not enabled. Contact support.',
  };

  return messages[errorCode] || 'Something went wrong. Please try again.';
};

export const AuthProvider = ({ children }) => {
  const storedSuspension = getStoredSuspension();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [suspension, setSuspension] = useState(storedSuspension);
  const [error, setError] = useState('');
  const [deviceLimitInfo, setDeviceLimitInfo] = useState(null); 
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const persistSession = ({ token: nextToken, user: nextUser }) => {
    clearStoredSuspension();
    setSuspension(null);
    setStoredAuth({ user: nextUser });
    setToken(nextToken);
    setUser(nextUser);
  };

  const clearSession = (shouldRedirect = false, redirectPath = '/login', preserveSuspension = false) => {
    clearStoredAuth();
    setUser(null);
    setToken(null);
    setLoading(false);
    setInitialized(true);

    if (!preserveSuspension) {
      clearStoredSuspension();
      setSuspension(null);
    }

    if (shouldRedirect && window.location.pathname !== redirectPath) {
      window.location.assign(redirectPath);
    }
  };

  const setSuspendedState = (message, email = '') => {
    const nextSuspension = {
      message: message || DEFAULT_SUSPENSION_MESSAGE,
      email: email || '',
    };
    setStoredSuspension(nextSuspension);
    setSuspension(nextSuspension);
    return nextSuspension;
  };

  const restrictAccount = (message, email = '') => {
    setSuspendedState(message, email);
    clearSession(true, '/account-suspended', true);
  };

  const syncBackendSession = async (firebaseUser) => {
    if (firebaseUser && !firebaseUser.emailVerified) {
      setUser(null);
      setToken(null);
      setVerificationPending(true);
      setVerificationEmail(firebaseUser.email);
      setInitialized(true);
      setLoading(false);
      return null;
    } else {
      setVerificationPending(false);
      setVerificationEmail('');
    }

    if (!firebaseUser) {
      try {
        const backendUser = await authService.getCurrentUser();

        if (backendUser?.status === 'suspended' || backendUser?.status === 'banned') {
          await logoutUser();
          clearSession(false);
          setUser(null);
          setError('Account suspended. Contact support.');
          return null;
        }

        persistSession({ token: null, user: backendUser });
        return backendUser;
      } catch (error) {
        if (/banned/i.test(error.message) || error.response?.data?.errorCode === 'ACCOUNT_SUSPENDED') {
          await logoutUser();
          clearSession(false);
          setUser(null);
          setError('Account suspended. Contact support.');
          return null;
        }
        clearSession(false);
        return null;
      } finally {
        setInitialized(true);
        setLoading(false);
      }
    }

    const idToken = await firebaseUser.getIdToken(true);
    setToken(idToken);

    try {
      const backendUser = await authService.getCurrentUser(idToken);

      if (backendUser?.status === 'suspended' || backendUser?.status === 'banned') {
        await logoutUser();
        clearSession(false);
        setUser(null);
        setError('Account suspended. Contact support.');
        return null;
      }

      persistSession({ token: idToken, user: backendUser });
      return backendUser;
    } catch (error) {
      if (/banned/i.test(error.message) || error.response?.data?.errorCode === 'ACCOUNT_SUSPENDED') {
        await logoutUser();
        clearSession(false);
        setUser(null);
        setError('Account suspended. Contact support.');
        return null;
      }
      if (isSuspensionMessage(error.message)) {
        restrictAccount(error.message || DEFAULT_SUSPENSION_MESSAGE, firebaseUser.email || '');
        return null;
      }
      clearSession(false);
      throw error;
    } finally {
      setInitialized(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    registerUnauthorizedHandler((error) => {
      const message = error?.response?.data?.message || error?.message || '';

      if (isSuspensionMessage(message) || error?.response?.data?.errorCode === 'ACCOUNT_SUSPENDED') {
        void logoutUser().finally(() => {
          clearSession(true, '/login');
        });
        return;
      }

      void logoutUser().finally(() => clearSession(true, '/login'));
    });

    registerDeviceLimitHandler((info) => {
      setDeviceLimitInfo(info);
    });

    const unsubscribe = onAuthChange((firebaseUser) => {
      setLoading(true);
      void syncBackendSession(firebaseUser).catch(() => null);
    });

    return () => {
      registerUnauthorizedHandler(null);
      registerDeviceLimitHandler(null);
      unsubscribe();
    };
    
  }, []);

  const login = async (credentials) => {
    try {
      setError('');
      const firebaseUser = await loginWithEmail(credentials.email, credentials.password);
      return await syncBackendSession(firebaseUser);
    } catch (err) {
      if (err?.response?.data?.errorCode === 'ACCOUNT_SUSPENDED' || err?.message?.includes('ACCOUNT_SUSPENDED')) {
        setError('Your account has been suspended. Contact support@blackshortz.com for assistance.');
        await logoutUser();
        clearSession(false);
        throw err;
      }
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('');
      } else {
        setError(getFirebaseErrorMessage(err.code || err.message));
      }
      throw err;
    }
  };

  const register = async (payload) => {
    try {
      setError('');
      const firebaseUser = await signupWithEmail(payload.email, payload.password);
      return { requiresEmailVerification: true, firebaseUser };
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('');
      } else {
        setError(getFirebaseErrorMessage(err.code));
      }
      throw err;
    }
  };

  const verifyEmail = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Please sign in first.');
    }

    await currentUser.reload();
    if (!currentUser.emailVerified) {
      throw new Error('Email verification is still pending. Please verify from your inbox.');
    }

    return await syncBackendSession(currentUser);
  };

  const resendVerification = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Please sign in first to resend verification email.');
    }
    await currentUser.sendEmailVerification();
    return { delivered: true };
  };

  const requestPasswordReset = async (email) => {
    try {
      setError('');
      await sendFirebasePasswordResetEmail(email);
      return { delivered: true };
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('');
      } else {
        setError(getFirebaseErrorMessage(err.code));
      }
      throw err;
    }
  };

  const resetPassword = async ({ oobCode, newPassword }) => {
    if (!oobCode || !newPassword) {
      throw new Error('Reset code and new password are required.');
    }

    try {
      setError('');
      await resetPasswordWithCode({ oobCode, newPassword });
      return { success: true };
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('');
      } else {
        setError(getFirebaseErrorMessage(err.code));
      }
      throw err;
    }
  };

  const googleLogin = async () => {
    try {
      setError('');
      const firebaseUser = await loginWithGoogle();
      if (!firebaseUser) {
        return null;
      }
      return await syncBackendSession(firebaseUser);
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('');
      } else {
        setError(getFirebaseErrorMessage(err.code));
      }
      throw err;
    }
  };

  const beginGoogleOAuth = async () => {
    return await googleLogin();
  };

  const logout = () => {
    void authService
      .logoutCurrentSession()
      .catch(() => null)
      .finally(() => logoutUser().finally(() => {
        setVerificationPending(false);
        setVerificationEmail('');
        clearSession(true);
      }));
  };

  const refreshUser = async () => {
    const currentUser = auth.currentUser;
    return await syncBackendSession(currentUser);
  };

  const ensureActiveSession = async () => {
    if (!auth.currentUser) {
      return null;
    }
    return await syncBackendSession(auth.currentUser);
  };

  const updateUser = (nextUser) => {
    const updatedUser = typeof nextUser === 'function' ? nextUser(user) : nextUser;
    setUser(updatedUser);
    if (token && updatedUser) {
      setStoredAuth({ user: updatedUser });
    }
  };

  const hasRestrictedAccess = Boolean(user?.status === 'banned');
  const isSuspended = Boolean(user?.status === 'suspended');
  const isActive = Boolean(user?.status === 'active');

  const dismissDeviceLimit = () => setDeviceLimitInfo(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        initialized,
        loading,
        isAuthenticated: Boolean(user),
        hasRestrictedAccess,
        isSuspended,
        isActive,
        suspension,
        error,
        setError,
        login,
        register,
        verifyEmail,
        resendVerification,
        requestPasswordReset,
        resetPassword,
        googleLogin,
        beginGoogleOAuth,
        logout,
        refreshUser,
        ensureActiveSession,
        updateUser,
        deviceLimitInfo,
        dismissDeviceLimit,
        verificationPending,
        verificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
