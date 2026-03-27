import { Navigate, Outlet } from 'react-router-dom';
import StatePanel from './StatePanel';
import { useAuth } from '../features/auth/AuthContext';

const ProtectedRoute = () => {
  const { initialized, loading, isAuthenticated, user } = useAuth();

  if (!initialized || loading) {
    return <StatePanel title="Loading admin session" message="Validating your token and permissions." />;
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
