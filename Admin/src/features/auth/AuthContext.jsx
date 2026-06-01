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
    console.log('[Admin AuthContext] Persisting admin session to storage & state:', session?.user?.email);
    setStoredAdminAuth(session);
    setUser(session.user);
    setToken(null);
  };

  const clearSession = (shouldRedirect = false) => {
    console.log('[Admin AuthContext] Clearing admin session state. Redirect:', shouldRedirect);
    clearStoredAdminAuth();
    setUser(null);
    setToken(null);
    setLoading(false);
    setInitialized(true);

    if (shouldRedirect && window.location.pathname !== '/login') {
      console.log('[Admin AuthContext] Redirecting to /login');
      window.location.assign('/login');
    }
  };

  const refreshUser = async () => {
    console.log('[Admin AuthContext] Refreshing current admin profile from backend...');
    setLoading(true);

    try {
      const currentUser = await authService.getCurrentAdmin();
      console.log('[Admin AuthContext] Received admin profile from backend:', currentUser);

      if (currentUser.role !== 'admin') {
        console.error('[Admin AuthContext] User role is not admin:', currentUser.role);
        throw new Error('This account does not have admin access.');
      }

      persistSession({ user: currentUser });
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error('[Admin AuthContext] Error refreshing admin profile:', error.message);
      clearSession(false);
      throw error;
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  useEffect(() => {
    console.log('[Admin AuthContext] AuthProvider mounted. Stored Session exists:', !!storedSession?.user);
    registerUnauthorizedHandler(() => {
      console.warn('[Admin AuthContext] Unauthorized (401) API response intercepted. Clearing session.');
      clearSession(true);
    });

    if (storedSession?.user) {
      refreshUser().catch(() => null);
    } else {
      setInitialized(true);
      setLoading(false);
    }

    return () => registerUnauthorizedHandler(null);
  }, []);

  const login = async (credentials) => {
    console.log('[Admin AuthContext] login() action initiated for:', credentials.email);
    const session = await authService.login(credentials);
    console.log('[Admin AuthContext] Received login session from service:', session);

    if (session.user.role !== 'admin') {
      console.error('[Admin AuthContext] Access Denied: User role is not admin:', session.user.role);
      throw new Error('This account does not have admin access.');
    }

    persistSession(session);
    setInitialized(true);
    console.log('[Admin AuthContext] login() flow successfully completed for admin:', session.user.email);
    return session.user;
  };

  const beginGoogleOAuth = () => {
    console.log('[Admin AuthContext] beginGoogleOAuth() action initiated.');
    const apiBase = import.meta.env.VITE_API_URL;
    if (!apiBase) {
      console.error('[Admin AuthContext] VITE_API_URL is missing!');
      throw new Error('VITE_API_URL is not configured.');
    }
    const returnTo = `${window.location.origin}/login`;
    const oauthUrl = `${apiBase.replace(/\/$/, '')}/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
    console.log('[Admin AuthContext] Redirecting admin to Google OAuth callback URL:', oauthUrl);
    window.location.assign(oauthUrl);
  };

  const logout = async () => {
    console.log('[Admin AuthContext] logout() action initiated.');
    await authService.logoutCurrentAdminSession().catch((err) => console.warn('[Admin AuthContext] Backend logout request skipped:', err.message));
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


