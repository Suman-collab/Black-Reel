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
import { useAuth } from '../features/auth/AuthContext';

const AdminSidebar = ({ setSidebarOpen }) => {
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
    if (setSidebarOpen) setSidebarOpen(false);
    logout();
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__logo" style={{ display: 'flex', flexDirection: 'column', padding: 'var(--space-6) var(--space-6) 0 var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xl)', fontWeight: '800' }}>
          <span style={{ color: 'var(--brand-primary)', letterSpacing: '1px' }}>BLACK</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: '400', letterSpacing: '1px' }}>REEL</span>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', letterSpacing: '2px', marginTop: '4px', textTransform: 'uppercase' }}>Studio Admin</span>
      </div>

      <div className="admin-sidebar__section-label">Navigation</div>
      <nav className="sidebar-nav" style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {navItems.map((item) => (
            <li key={item.path} style={{ marginBottom: '4px' }}>
              <NavLink
                to={item.path}
                className={({ isActive }) => isActive ? 'admin-nav-item active' : 'admin-nav-item'}
                onClick={() => {
                  if (setSidebarOpen) setSidebarOpen(false);
                }}
              >
                <span className="admin-nav-item__icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="admin-sidebar__footer">
        <button className="admin-logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
