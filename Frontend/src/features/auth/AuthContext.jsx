import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import * as authService from './auth.service';
import { clearStoredAuth, setStoredAuth } from '../../lib/storage';
import { isSuspensionMessage, registerUnauthorizedHandler } from '../../lib/api';
import { DEFAULT_SUSPENSION_MESSAGE, isRestrictedAccountStatus } from '../../lib/accountStatus';
import { clearStoredSuspension, getStoredSuspension, setStoredSuspension } from '../../lib/suspension';
import { firebaseAuth } from '../../firebase/config';
import {
  loginWithEmail,
  loginWithGooglePopup,
  logoutFirebaseUser,
  registerWithEmail,
  requestPasswordResetEmail,
} from '../../firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const storedSuspension = getStoredSuspension();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [suspension, setSuspension] = useState(storedSuspension);

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
    if (!firebaseUser) {
      clearSession(false);
      return null;
    }

    const idToken = await firebaseUser.getIdToken(true);
    setToken(idToken);

    try {
      const backendUser = await authService.getCurrentUser(idToken);

      if (isRestrictedAccountStatus(backendUser?.status)) {
        restrictAccount(DEFAULT_SUSPENSION_MESSAGE, backendUser.email || firebaseUser.email || '');
        return null;
      }

      persistSession({ token: idToken, user: backendUser });
      return backendUser;
    } catch (error) {
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

      if (isSuspensionMessage(message)) {
        restrictAccount(message || DEFAULT_SUSPENSION_MESSAGE, user?.email || '');
        return;
      }

      void logoutFirebaseUser().finally(() => clearSession(true, '/login'));
    });

    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      setLoading(true);
      void syncBackendSession(firebaseUser).catch(() => null);
    });

    return () => {
      registerUnauthorizedHandler(null);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (credentials) => {
    const firebaseUser = await loginWithEmail(credentials);
    return await syncBackendSession(firebaseUser);
  };

  const register = async (payload) => {
    await registerWithEmail(payload);
    return { requiresEmailVerification: true };
  };

  const verifyEmail = async () => {
    const currentUser = firebaseAuth.currentUser;
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
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      throw new Error('Please sign in first to resend verification email.');
    }
    await currentUser.sendEmailVerification();
    return { delivered: true };
  };

  const requestPasswordReset = async (email) => {
    await requestPasswordResetEmail(email);
    return { delivered: true };
  };

  const resetPassword = async () => {
    throw new Error('Use the password reset link sent to your email to set a new password.');
  };

  const googleLogin = async () => {
    const firebaseUser = await loginWithGooglePopup();
    return await syncBackendSession(firebaseUser);
  };

  const beginGoogleOAuth = () => {
    void googleLogin();
  };

  const logout = () => {
    void logoutFirebaseUser().finally(() => clearSession(true));
  };

  const refreshUser = async () => {
    const currentUser = firebaseAuth.currentUser;
    return await syncBackendSession(currentUser);
  };

  const ensureActiveSession = async () => {
    if (!firebaseAuth.currentUser) {
      return null;
    }
    return await syncBackendSession(firebaseAuth.currentUser);
  };

  const updateUser = (nextUser) => {
    const updatedUser = typeof nextUser === 'function' ? nextUser(user) : nextUser;
    setUser(updatedUser);
    if (token && updatedUser) {
      setStoredAuth({ user: updatedUser });
    }
  };

  const hasRestrictedAccess = Boolean(suspension || isRestrictedAccountStatus(user?.status));

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        initialized,
        loading,
        isAuthenticated: Boolean(user),
        hasRestrictedAccess,
        suspension,
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

