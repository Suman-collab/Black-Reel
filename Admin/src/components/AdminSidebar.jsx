import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Film,
  CreditCard,
  Bell,
  Flag,
  LogOut
} from 'lucide-react';
import '../styles/AdminSidebar.css';
import { useAuth } from '../features/auth/AuthContext';

const AdminSidebar = () => {
  const { logout } = useAuth();

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/users', icon: <Users size={20} />, label: 'Users' },
    { path: '/content', icon: <Film size={20} />, label: 'Content' },
    { path: '/subscriptions', icon: <CreditCard size={20} />, label: 'Subscriptions' },
    { path: '/notifications', icon: <Bell size={20} />, label: 'Notifications' },
    { path: '/reports', icon: <Flag size={20} />, label: 'Reports' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header" style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
        <img src="/images/Black-Shortz.png" alt="Black Reel Logo" className="sidebar-logo" style={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'contain' }} />
      </div>

      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
