import { createContext, useContext, useEffect, useState } from 'react';
import * as authService from './auth.service';
import { clearStoredAuth, getStoredAuth, setStoredAuth } from '../../lib/storage';
import { registerUnauthorizedHandler } from '../../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const storedSession = getStoredAuth();
  const [user, setUser] = useState(storedSession?.user || null);
  const [token, setToken] = useState(storedSession?.token || null);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(Boolean(storedSession?.token));

  const persistSession = (session) => {
    setStoredAuth(session);
    setUser(session.user);
    setToken(session.token);
  };

  const clearSession = (shouldRedirect = false) => {
    clearStoredAuth();
    setUser(null);
    setToken(null);
    setLoading(false);
    setInitialized(true);

    if (shouldRedirect && window.location.pathname !== '/login') {
      window.location.assign('/login');
    }
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
      persistSession({ token: activeSession.token, user: currentUser });
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
    registerUnauthorizedHandler(() => {
      clearSession(true);
    });

    if (storedSession?.token) {
      refreshUser().catch(() => null);
    } else {
      setInitialized(true);
      setLoading(false);
    }

    return () => registerUnauthorizedHandler(null);
  }, []);

  const login = async (credentials) => {
    const session = await authService.login(credentials);
    persistSession(session);
    setInitialized(true);
    return session.user;
  };

  const register = async (payload) => {
    const session = await authService.register(payload);
    persistSession(session);
    setInitialized(true);
    return session.user;
  };

  const logout = () => {
    clearSession(true);
  };

  const updateUser = (nextUser) => {
    const activeSession = getStoredAuth();
    const updatedUser = typeof nextUser === 'function' ? nextUser(user) : nextUser;

    setUser(updatedUser);

    if (activeSession?.token) {
      setStoredAuth({ token: activeSession.token, user: updatedUser });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        initialized,
        loading,
        isAuthenticated: Boolean(user && token),
        login,
        register,
        logout,
        refreshUser,
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
