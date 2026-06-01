import { UserCircle, Bell } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';

const AdminNavbar = () => {
  const { user } = useAuth();

  return (
    <header className="admin-navbar">
      <div className="navbar-actions">
        <button className="icon-btn">
          <Bell size={20} />
          <span className="badge">3</span>
        </button>
        <div className="admin-profile">
          <UserCircle size={28} style={{ color: 'var(--brand-primary)' }} />
          <div className="profile-info">
            <span className="name">{user?.name || 'Admin User'}</span>
            <span className="role">{user?.role === 'admin' ? 'Administrator' : 'Team Member'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
