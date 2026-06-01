import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import StatePanel from './StatePanel';

export default function RequireAuth({ children }) {
  const { initialized, isAuthenticated, loading, hasRestrictedAccess } = useAuth();
  const location = useLocation();

  console.log(`[RequireAuth] Checking route protection for path: ${location.pathname}`);
  console.log(`[RequireAuth] State -> initialized: ${initialized}, loading: ${loading}, isAuthenticated: ${isAuthenticated}, hasRestrictedAccess: ${hasRestrictedAccess}`);

  if (!initialized || loading) {
    console.log('[RequireAuth] Session is loading. Displaying loading panel.');
    return <StatePanel title="Loading your account" message="Checking your session and preparing your profile." />;
  }

  if (hasRestrictedAccess) {
    console.warn('[RequireAuth] Restricted account access. Redirecting to /account-suspended.');
    return <Navigate to="/account-suspended" replace />;
  }

  if (!isAuthenticated) {
    console.warn(`[RequireAuth] Unauthorized access to ${location.pathname}. Redirecting to /login.`);
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  console.log(`[RequireAuth] Authorized. Access granted to route: ${location.pathname}`);
  return children;
}
