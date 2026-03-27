import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import UsersManagement from './pages/UsersManagement';
import ContentManagement from './pages/ContentManagement';
import SubscriptionManagement from './pages/SubscriptionManagement';
import NotificationsManagement from './pages/NotificationsManagement';
import ReportsManagement from './pages/ReportsManagement';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './features/auth/AuthContext';
import './index.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UsersManagement />} />
              <Route path="content" element={<ContentManagement />} />
              <Route path="subscriptions" element={<SubscriptionManagement />} />
              <Route path="notifications" element={<NotificationsManagement />} />
              <Route path="reports" element={<ReportsManagement />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
