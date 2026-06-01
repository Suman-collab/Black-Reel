import { createContext, useContext, useEffect, useState } from 'react';
import * as authService from './auth.service';
import { clearStoredAdminAuth, getStoredAdminAuth, setStoredAdminAuth } from '../../lib/storage';
import { registerUnauthorizedHandler } from '../../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const storedSession = getStoredAdminAuth();
  const [user, setUser] = useState(storedSession?.user || null);
  const [token, setToken] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  const persistSession = (session) => {
    setStoredAdminAuth(session);
    setUser(session.user);
    setToken(null);
  };

  const clearSession = (shouldRedirect = false) => {
    clearStoredAdminAuth();
    setUser(null);
    setToken(null);
    setLoading(false);
    setInitialized(true);

    if (shouldRedirect && window.location.pathname !== '/login') {
      window.location.assign('/login');
    }
  };

  const refreshUser = async () => {
    setLoading(true);

    try {
      const currentUser = await authService.getCurrentAdmin();

      if (currentUser.role !== 'admin') {
        throw new Error('This account does not have admin access.');
      }

      persistSession({ user: currentUser });
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      clearSession(false);
      throw error;
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  useEffect(() => {
    registerUnauthorizedHandler(() => clearSession(true));

    if (storedSession?.user) {
      refreshUser().catch(() => null);
    } else {
      setInitialized(true);
      setLoading(false);
    }

    return () => registerUnauthorizedHandler(null);
  }, []);

  const login = async (credentials) => {
    const session = await authService.login(credentials);

    if (session.user.role !== 'admin') {
      throw new Error('This account does not have admin access.');
    }

    persistSession(session);
    setInitialized(true);
    return session.user;
  };

  const beginGoogleOAuth = () => {
    const apiBase = import.meta.env.VITE_API_URL;
    if (!apiBase) {
      throw new Error('VITE_API_URL is not configured.');
    }
    const returnTo = `${window.location.origin}/login`;
    const oauthUrl = `${apiBase.replace(/\/$/, '')}/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
    window.location.assign(oauthUrl);
  };

  const logout = async () => {
    await authService.logoutCurrentAdminSession().catch(() => null);
    clearSession(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        initialized,
        loading,
        isAuthenticated: Boolean(user),
        login,
        beginGoogleOAuth,
        logout,
        refreshUser,
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


