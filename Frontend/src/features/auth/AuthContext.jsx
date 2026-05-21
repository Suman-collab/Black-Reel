import { createContext, useContext, useEffect, useState } from 'react';
import * as authService from './auth.service';
import { clearStoredAuth, getStoredAuth, setStoredAuth } from '../../lib/storage';
import { isSuspensionMessage, registerUnauthorizedHandler } from '../../lib/api';
import { DEFAULT_SUSPENSION_MESSAGE, isRestrictedAccountStatus } from '../../lib/accountStatus';
import { clearStoredSuspension, getStoredSuspension, setStoredSuspension } from '../../lib/suspension';

const AuthContext = createContext(null);
const SESSION_REVALIDATION_INTERVAL_MS = 15000;

export const AuthProvider = ({ children }) => {
  const storedSession = getStoredAuth();
  const storedSuspension = getStoredSuspension();
  const [user, setUser] = useState(storedSession?.user || null);
  const [token, setToken] = useState(storedSession?.token || null);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(Boolean(storedSession?.token));
  const [suspension, setSuspension] = useState(storedSuspension);

  const setSuspendedState = (message, email = '') => {
    const nextSuspension = {
      message: message || DEFAULT_SUSPENSION_MESSAGE,
      email: email || '',
    };

    setStoredSuspension(nextSuspension);
    setSuspension(nextSuspension);
    return nextSuspension;
  };

  const persistSession = (session) => {
    clearStoredSuspension();
    setSuspension(null);
    setStoredAuth(session);
    setUser(session.user);
    setToken(session.token);
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

  const restrictAccount = (message, email = '') => {
    setSuspendedState(message, email);
    clearSession(true, '/account-suspended', true);
  };

  const refreshUser = async () => {
    const activeSession = getStoredAuth();

    if (!activeSession?.token) {
      clearSession(false);
      return null;
    }

    setLoading(true);

    try {
      const currentUser = await authService.getCurrentUser();

      if (isRestrictedAccountStatus(currentUser.status)) {
        restrictAccount(DEFAULT_SUSPENSION_MESSAGE, currentUser.email || activeSession.user?.email || '');
        return null;
      }

      persistSession({ token: activeSession.token, user: currentUser });
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      if (!isSuspensionMessage(error.message)) {
        clearSession(false);
      }
      throw error;
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  useEffect(() => {
    registerUnauthorizedHandler((error) => {
      const message = error?.response?.data?.message || error?.message || '';
      const activeSession = getStoredAuth();

      if (isSuspensionMessage(message)) {
        restrictAccount(message || DEFAULT_SUSPENSION_MESSAGE, activeSession?.user?.email || '');
        return;
      }

      clearSession(true, '/login');
    });

    if (storedSession?.token && isRestrictedAccountStatus(storedSession.user?.status)) {
      restrictAccount(DEFAULT_SUSPENSION_MESSAGE, storedSession.user?.email || '');
    } else if (storedSession?.token) {
      refreshUser().catch(() => null);
    } else {
      setInitialized(true);
      setLoading(false);
    }

    return () => registerUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const revalidateSession = () => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      refreshUser().catch(() => null);
    };

    const intervalId = window.setInterval(revalidateSession, SESSION_REVALIDATION_INTERVAL_MS);
    window.addEventListener('focus', revalidateSession);
    document.addEventListener('visibilitychange', revalidateSession);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', revalidateSession);
      document.removeEventListener('visibilitychange', revalidateSession);
    };
  }, [token]);

  const login = async (credentials) => {
    const session = await authService.login(credentials);
    persistSession(session);
    setInitialized(true);
    return session.user;
  };

  const register = async (payload) => {
    const session = await authService.register(payload);
    if (session?.token && session?.user) {
      persistSession(session);
    }
    setInitialized(true);
    return session;
  };

  const verifyEmail = async (tokenValue) => {
    const session = await authService.verifyEmail(tokenValue);
    persistSession(session);
    setInitialized(true);
    return session.user;
  };

  const resendVerification = async (email) => {
    return await authService.resendVerification(email);
  };

  const requestPasswordReset = async (email) => {
    return await authService.requestPasswordReset(email);
  };

  const resetPassword = async (tokenValue, passwordValue) => {
    const session = await authService.resetPassword(tokenValue, passwordValue);
    persistSession(session);
    setInitialized(true);
    return session.user;
  };

  const socialLogin = async (payload) => {
    const session = await authService.socialLogin(payload);
    persistSession(session);
    setInitialized(true);
    return session.user;
  };

  const logout = () => {
    clearSession(true);
  };

  const ensureActiveSession = async () => {
    const activeSession = getStoredAuth();

    if (!activeSession?.token) {
      return null;
    }

    if (isRestrictedAccountStatus(user?.status)) {
      restrictAccount(DEFAULT_SUSPENSION_MESSAGE, user?.email || activeSession.user?.email || '');
      return null;
    }

    return await refreshUser();
  };

  const updateUser = (nextUser) => {
    const activeSession = getStoredAuth();
    const updatedUser = typeof nextUser === 'function' ? nextUser(user) : nextUser;

    if (isRestrictedAccountStatus(updatedUser?.status)) {
      restrictAccount(DEFAULT_SUSPENSION_MESSAGE, updatedUser.email || activeSession?.user?.email || '');
      return;
    }

    setUser(updatedUser);

    if (activeSession?.token) {
      setStoredAuth({ token: activeSession.token, user: updatedUser });
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
        isAuthenticated: Boolean(user && token),
        hasRestrictedAccess,
        suspension,
        login,
        register,
        verifyEmail,
        resendVerification,
        requestPasswordReset,
        resetPassword,
        socialLogin,
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
