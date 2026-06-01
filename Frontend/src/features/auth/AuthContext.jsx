import { createContext, useContext, useEffect, useState } from 'react';
import * as authService from './auth.service';
import { clearStoredAuth, setStoredAuth } from '../../lib/storage';
import { isSuspensionMessage, registerUnauthorizedHandler, registerDeviceLimitHandler } from '../../lib/api';
import { DEFAULT_SUSPENSION_MESSAGE } from '../../lib/accountStatus';
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
  const persistAccessToken = (value) => {
    if (!value) return;
    console.log('[AuthContext] Storing access tokens in localStorage.');
    localStorage.setItem('token', value);
    localStorage.setItem('authToken', value);
    localStorage.setItem('accessToken', value);
  };

  const clearAccessTokens = () => {
    console.log('[AuthContext] Removing access tokens from localStorage.');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('accessToken');
  };

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
    console.log('[AuthContext] Persisting session to state & storage for user:', nextUser?.email);
    clearStoredSuspension();
    setSuspension(null);
    setStoredAuth({ user: nextUser });
    setToken(nextToken);
    setUser(nextUser);
    console.log('[AuthContext] Current Auth State (Authenticated):', !!nextUser, nextUser);
  };

  const clearSession = (shouldRedirect = false, redirectPath = '/login', preserveSuspension = false) => {
    console.log('[AuthContext] Clearing session state & local storage. Redirect:', shouldRedirect, redirectPath);
    clearStoredAuth();
    clearAccessTokens();
    setUser(null);
    setToken(null);
    setLoading(false);
    setInitialized(true);

    if (!preserveSuspension) {
      clearStoredSuspension();
      setSuspension(null);
    }

    if (shouldRedirect && window.location.pathname !== redirectPath) {
      console.log(`[AuthContext] Redirecting location to: ${redirectPath}`);
      window.location.assign(redirectPath);
    }
  };

  const setSuspendedState = (message, email = '') => {
    console.warn(`[AuthContext] Setting account suspension state: ${message} (Email: ${email})`);
    const nextSuspension = {
      message: message || DEFAULT_SUSPENSION_MESSAGE,
      email: email || '',
    };
    setStoredSuspension(nextSuspension);
    setSuspension(nextSuspension);
    return nextSuspension;
  };

  const restrictAccount = (message, email = '') => {
    console.error(`[AuthContext] Restricting account access: ${message}`);
    setSuspendedState(message, email);
    clearSession(true, '/account-suspended', true);
  };

  const syncBackendSession = async (firebaseUser) => {
    console.log('[AuthContext] Syncing session with Firebase User state:', firebaseUser ? `Email: ${firebaseUser.email}, Verified: ${firebaseUser.emailVerified}` : 'No Firebase User (Guest)');
    
    if (firebaseUser && !firebaseUser.emailVerified) {
      console.warn('[AuthContext] Firebase User exists but email is not verified. Pending verification.');
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
      const hasStoredToken = Boolean(
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('accessToken')
      );
      console.log(`[AuthContext] Guest state. Tokens found in localStorage: ${hasStoredToken}`);

      if (!hasStoredToken) {
        console.log('[AuthContext] No stored token found. Finalizing guest session.');
        clearSession(false);
        return null;
      }

      try {
        console.log('[AuthContext] Stored token exists. Fetching current user profile from backend...');
        const backendUser = await authService.getCurrentUser();
        console.log('[AuthContext] Successfully retrieved backend user profile:', backendUser);

        if (backendUser?.status === 'suspended' || backendUser?.status === 'banned') {
          console.error('[AuthContext] User profile status indicates restriction:', backendUser.status);
          await logoutUser();
          clearSession(false);
          setUser(null);
          setError('Account suspended. Contact support.');
          return null;
        }

        persistSession({ token: null, user: backendUser });
        return backendUser;
      } catch (error) {
        console.error('[AuthContext] Error retrieving profile via stored token:', error.message);
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

    console.log('[AuthContext] Fetching fresh ID token from Firebase...');
    const idToken = await firebaseUser.getIdToken(true);
    console.log('[AuthContext] Firebase ID token retrieved successfully. Persisting...');
    persistAccessToken(idToken);
    setToken(idToken);

    try {
      console.log('[AuthContext] Syncing user profile with backend using Firebase ID Token...');
      const backendUser = await authService.getCurrentUser(idToken);
      console.log('[AuthContext] Successfully synchronized with backend user profile:', backendUser);

      if (backendUser?.status === 'suspended' || backendUser?.status === 'banned') {
        console.error('[AuthContext] User profile status indicates restriction on sync:', backendUser.status);
        await logoutUser();
        clearSession(false);
        setUser(null);
        setError('Account suspended. Contact support.');
        return null;
      }

      persistSession({ token: idToken, user: backendUser });
      return backendUser;
    } catch (error) {
      console.error('[AuthContext] Error syncing with backend using Firebase ID Token:', error.message);
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
    console.log('[AuthContext] login() action initiated for:', credentials.email);
    try {
      setError('');
      const firebaseUser = await loginWithEmail(credentials.email, credentials.password);
      console.log('[AuthContext] login() Firebase signIn successful for uid:', firebaseUser.uid);
      const userData = await syncBackendSession(firebaseUser);

      // Defensive fallback for alternate backend payloads.
      const tokenFromResponse =
        userData?.token ||
        userData?.accessToken ||
        userData?.data?.token ||
        null;
      if (tokenFromResponse) {
        console.log('[AuthContext] login() Fallback token retrieved from response payload:', tokenFromResponse);
        persistAccessToken(tokenFromResponse);
      }

      console.log('[AuthContext] login() flow successfully completed. User data:', userData);
      return userData;
    } catch (err) {
      console.error('[AuthContext] login() failed:', err.code, err.message);
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
    console.log('[AuthContext] register() action initiated for:', payload.email);
    try {
      setError('');
      const firebaseUser = await signupWithEmail(payload.email, payload.password);
      console.log('[AuthContext] register() Firebase registration successful for uid:', firebaseUser.uid);
      return { requiresEmailVerification: true, firebaseUser };
    } catch (err) {
      console.error('[AuthContext] register() failed:', err.code, err.message);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('');
      } else {
        setError(getFirebaseErrorMessage(err.code));
      }
      throw err;
    }
  };

  const verifyEmail = async () => {
    console.log('[AuthContext] verifyEmail() initiated.');
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('[AuthContext] verifyEmail() failed: No current user logged in.');
      throw new Error('Please sign in first.');
    }

    console.log('[AuthContext] verifyEmail() Reloading Firebase user profile...');
    await currentUser.reload();
    console.log('[AuthContext] verifyEmail() emailVerified status:', currentUser.emailVerified);
    if (!currentUser.emailVerified) {
      console.error('[AuthContext] verifyEmail() failed: Email is not verified.');
      throw new Error('Email verification is still pending. Please verify from your inbox.');
    }

    console.log('[AuthContext] verifyEmail() Email verified. Synchronizing session with backend...');
    return await syncBackendSession(currentUser);
  };

  const resendVerification = async () => {
    console.log('[AuthContext] resendVerification() initiated.');
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('[AuthContext] resendVerification() failed: No current user logged in.');
      throw new Error('Please sign in first to resend verification email.');
    }
    console.log('[AuthContext] Resending verification email to:', currentUser.email);
    await currentUser.sendEmailVerification();
    return { delivered: true };
  };

  const requestPasswordReset = async (email) => {
    console.log('[AuthContext] requestPasswordReset() initiated for:', email);
    try {
      setError('');
      await sendFirebasePasswordResetEmail(email);
      console.log('[AuthContext] Password reset email successfully sent.');
      return { delivered: true };
    } catch (err) {
      console.error('[AuthContext] requestPasswordReset() failed:', err.code, err.message);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('');
      } else {
        setError(getFirebaseErrorMessage(err.code));
      }
      throw err;
    }
  };

  const resetPassword = async ({ oobCode, newPassword }) => {
    console.log('[AuthContext] resetPassword() initiated.');
    if (!oobCode || !newPassword) {
      throw new Error('Reset code and new password are required.');
    }

    try {
      setError('');
      await resetPasswordWithCode({ oobCode, newPassword });
      console.log('[AuthContext] Password reset successfully confirmed.');
      return { success: true };
    } catch (err) {
      console.error('[AuthContext] resetPassword() failed:', err.code, err.message);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('');
      } else {
        setError(getFirebaseErrorMessage(err.code));
      }
      throw err;
    }
  };

  const googleLogin = async () => {
    console.log('[AuthContext] googleLogin() initiated.');
    try {
      setError('');
      const firebaseUser = await loginWithGoogle();
      if (!firebaseUser) {
        console.warn('[AuthContext] googleLogin() Popup closed or cancelled.');
        return null;
      }
      console.log('[AuthContext] googleLogin() Firebase sign-in successful. Retrieving ID token...');
      const idToken = await firebaseUser.getIdToken();
      persistAccessToken(idToken);
      console.log('[AuthContext] googleLogin() Syncing session with backend...');
      return await syncBackendSession(firebaseUser);
    } catch (err) {
      console.error('[AuthContext] googleLogin() failed:', err.code, err.message);
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
    console.log('[AuthContext] logout() initiated. Cleaning up local session and notifying backend.');
    void authService
      .logoutCurrentSession()
      .catch((err) => console.warn('[AuthContext] Backend logout request skipped/failed:', err.message))
      .finally(() => logoutUser().finally(() => {
        console.log('[AuthContext] Firebase signOut completed.');
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
