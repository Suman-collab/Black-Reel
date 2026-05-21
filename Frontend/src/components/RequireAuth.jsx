import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import StatePanel from './StatePanel';

export default function RequireAuth({ children }) {
  const { initialized, isAuthenticated, loading, hasRestrictedAccess } = useAuth();
  const location = useLocation();

  if (!initialized || loading) {
    return <StatePanel title="Loading your account" message="Checking your session and preparing your profile." />;
  }

  if (hasRestrictedAccess) {
    return <Navigate to="/account-suspended" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
