import React, { useEffect, useState } from 'react';
import {
  Users,
  CircleCheck,
  Ban,
  Crown,
  TrendingUp,
  Calendar,
  Search,
  Download,
  Laptop,
  Eye,
  Trash2,
} from 'lucide-react';
import {
  getUsers,
  getUserById,
  getUserStats,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  adminRemoveDevice,
} from '../lib/api';
import UserDetailPanel from '../components/UserDetailPanel';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function UsersManagement() {
  // ------------------------------------------------------------
  // A) STATE VARIABLES
  // ------------------------------------------------------------
  const [users, setUsers]           = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [planFilter, setPlan]       = useState('');
  const [roleFilter, setRole]       = useState('');
  const [sortBy, setSortBy]         = useState('createdAt');
  const [sortOrder, setSortOrder]   = useState('desc');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [selectedUser, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete]       = useState(null);
  const [actionLoading, setActionLoading]     = useState(false);

  // Custom Toast State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ------------------------------------------------------------
  // B) FETCH FUNCTIONS
  // ------------------------------------------------------------
  const fetchStats = async () => {
    try {
      const data = await getUserStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers({
        page,
        limit: 20,
        search,
        status: statusFilter,
        plan: planFilter,
        role: roleFilter,
        sortBy,
        sortOrder,
      });
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search — wait 400ms after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, statusFilter, planFilter, roleFilter, sortBy, sortOrder]);

  useEffect(() => { fetchUsers(); }, [page]);
  useEffect(() => { fetchStats(); }, []);

  // ------------------------------------------------------------
  // C) ACTION HANDLERS
  // ------------------------------------------------------------
  const handleStatusChange = async (userId, newStatus) => {
    setActionLoading(true);
    try {
      await updateUserStatus(userId, newStatus);
      // Update user in local list immediately
      setUsers(prev => prev.map(u =>
        u._id === userId ? { ...u, status: newStatus } : u
      ));
      // Update selectedUser if open in side panel
      if (selectedUser && selectedUser._id === userId) {
        setSelected(prev => ({ ...prev, status: newStatus }));
      }
      showToast(`User status updated to ${newStatus}`, 'success');
      fetchStats(); // refresh stats counter
    } catch (err) {
      showToast('Failed to update status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(true);
    try {
      await updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u =>
        u._id === userId ? { ...u, role: newRole } : u
      ));
      if (selectedUser && selectedUser._id === userId) {
        setSelected(prev => ({ ...prev, role: newRole }));
      }
      showToast(`User role updated to ${newRole}`, 'success');
    } catch (err) {
      showToast('Failed to update role', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setActionLoading(true);
    try {
      await deleteUser(userToDelete._id);
      setUsers(prev => prev.filter(u => u._id !== userToDelete._id));
      setShowDeleteModal(false);
      setShowDetail(false);
      setSelected(null);
      setUserToDelete(null);
      showToast('User deleted successfully', 'success');
      fetchStats(); // refresh stats
      fetchUsers(); // refresh pagination count
    } catch (err) {
      showToast('Failed to delete user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetail = async (userId) => {
    try {
      const data = await getUserById(userId);
      setSelected(data.user || data);
      setShowDetail(true);
    } catch (err) {
      showToast('Failed to load user details', 'error');
    }
  };

  const handleForceRemoveDevice = async (userId, deviceId) => {
    try {
      await adminRemoveDevice(userId, deviceId);
      // Update inside panel
      setSelected(prev => {
        if (!prev) return null;
        const updatedDevices = (prev.activeDevices || []).filter(d => (d._id || d.id) !== deviceId);
        return {
          ...prev,
          activeDevices: updatedDevices,
          activeDevicesCount: updatedDevices.length
        };
      });
      // Update inside local user row list
      setUsers(prev => prev.map(u => {
        if (u._id === userId) {
          const updatedDevices = (u.devices || []).filter(d => (d._id || d.id) !== deviceId);
          return {
            ...u,
            devices: updatedDevices
          };
        }
        return u;
      }));
      showToast('Device sign-out forced successfully', 'success');
    } catch (err) {
      showToast('Failed to force device sign-out', 'error');
    }
  };

  // ------------------------------------------------------------
  // H) EXPORT USERS AS CSV
  // ------------------------------------------------------------
  const handleExportCSV = () => {
    const headers = [
      'Name', 'Email', 'Role', 'Plan', 'Status',
      'Joined', 'Last Login', 'Active Devices'
    ];
    const rows = users.map(u => [
      u.name || 'No Name',
      u.email,
      u.role,
      u.subscription?.plan || 'free',
      u.status,
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
      u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never',
      (u.devices || []).filter(d => d.isActive || d.current).length || 0,
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: '700', color: '#F5F5F0', margin: '0 0 4px 0' }}>
            Users Management
          </h1>
          <p className="admin-page-subtitle" style={{ color: '#8E8A9F', fontSize: '14px', margin: 0 }}>
            Monitor subscriber metrics, view real-time payment histories, manage concurrent sessions, and moderate user access controls.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------
      D) STATS CARDS ROW — render at top of page
      ------------------------------------------------------------ */}
      <div className="admin-stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px',
        marginBottom: '1rem',
      }}>
        {[
          { 
            label: 'Total Users', 
            value: stats?.totalUsers || 0, 
            icon: <Users size={18} />,
            color: '#3498DB'
          },
          { 
            label: 'Active', 
            value: stats?.activeUsers || 0, 
            icon: <CircleCheck size={18} />,
            color: '#2ECC71'
          },
          { 
            label: 'Suspended', 
            value: stats?.suspendedUsers || 0, 
            icon: <Ban size={18} />,
            color: '#E74C3C'
          },
          { 
            label: 'Premium', 
            value: stats?.premiumUsers || 0, 
            icon: <Crown size={18} />,
            color: '#E8B84B'
          },
          { 
            label: 'New This Week', 
            value: stats?.newThisWeek || 0, 
            icon: <TrendingUp size={18} />,
            color: '#9B59B6'
          },
          { 
            label: 'New This Month', 
            value: stats?.newThisMonth || 0, 
            icon: <Calendar size={18} />,
            color: '#1ABC9C'
          },
        ].map(stat => (
          <div 
            key={stat.label} 
            className="admin-stat-card"
            style={{
              background: '#141416',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
            }}
          >
            <div className="admin-stat-card__icon" style={{ color: stat.color, fontSize: '20px', marginBottom: '4px' }}>
              {stat.icon}
            </div>
            <div className="admin-stat-card__value" style={{ fontSize: '22px', fontWeight: '700', color: '#F5F5F0' }}>
              {stat.value}
            </div>
            <div className="admin-stat-card__label" style={{ fontSize: '12px', color: '#606068', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------------
      E) FILTERS AND SEARCH BAR
      ------------------------------------------------------------ */}
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        marginBottom: '0.5rem',
        flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div 
          className="admin-search" 
          style={{ 
            flex: 1, 
            minWidth: '240px',
            position: 'relative',
            background: '#141416',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px'
          }}
        >
          <Search size={15} className="admin-search__icon" style={{ color: '#606068', marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#F5F5F0',
              fontSize: '13.5px',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{
            height: '40px',
            background: '#141416',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            color: '#F5F5F0',
            padding: '0 12px',
            fontSize: '13px',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>

        {/* Plan filter */}
        <select
          value={planFilter}
          onChange={e => { setPlan(e.target.value); setPage(1); }}
          style={{
            height: '40px',
            background: '#141416',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            color: '#F5F5F0',
            padding: '0 12px',
            fontSize: '13px',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="basic">Basic</option>
          <option value="standard">Standard</option>
          <option value="premium">Premium</option>
        </select>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={e => { setRole(e.target.value); setPage(1); }}
          style={{
            height: '40px',
            background: '#141416',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            color: '#F5F5F0',
            padding: '0 12px',
            fontSize: '13px',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        {/* Sort */}
        <select
          value={`${sortBy}_${sortOrder}`}
          onChange={e => {
            const [by, order] = e.target.value.split('_');
            setSortBy(by);
            setSortOrder(order);
          }}
          style={{
            height: '40px',
            background: '#141416',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            color: '#F5F5F0',
            padding: '0 12px',
            fontSize: '13px',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="createdAt_desc">Newest First</option>
          <option value="createdAt_asc">Oldest First</option>
          <option value="name_asc">Name A-Z</option>
          <option value="name_desc">Name Z-A</option>
          <option value="email_asc">Email A-Z</option>
        </select>

        {/* CSV Export Button */}
        <button
          onClick={handleExportCSV}
          style={{
            height: '40px',
            padding: '0 16px',
            borderRadius: '8px',
            border: '1px solid rgba(232,184,75,0.25)',
            background: 'rgba(232,184,75,0.08)',
            color: '#E8B84B',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <Download size={14} />
          Export CSV
        </button>

        {/* Total count */}
        <span style={{ 
          fontSize: '13px', 
          color: '#606068',
          whiteSpace: 'nowrap',
          marginLeft: 'auto'
        }}>
          {total} users found
        </span>
      </div>

      {/* ------------------------------------------------------------
      F) USERS TABLE — Show all important columns
      ------------------------------------------------------------ */}
      <div 
        className="admin-table-wrapper"
        style={{
          background: '#141416',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          overflowX: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
        }}
      >
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#0D0D11', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ padding: '16px', color: '#606068', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>User</th>
              <th style={{ padding: '16px', color: '#606068', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email</th>
              <th style={{ padding: '16px', color: '#606068', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Role</th>
              <th style={{ padding: '16px', color: '#606068', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Plan</th>
              <th style={{ padding: '16px', color: '#606068', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
              <th style={{ padding: '16px', color: '#606068', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Devices</th>
              <th style={{ padding: '16px', color: '#606068', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Joined</th>
              <th style={{ padding: '16px', color: '#606068', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Last Login</th>
              <th style={{ padding: '16px', color: '#606068', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Show 5 skeleton rows
              Array(5).fill(0).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {Array(9).fill(0).map((_, j) => (
                    <td key={j} style={{ padding: '20px 16px' }}>
                      <div className="skeleton" style={{ 
                        height: '16px', 
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.03)',
                        width: '80%'
                      }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ 
                  textAlign: 'center', 
                  padding: '4rem 2rem',
                  color: '#606068',
                  fontSize: '14px'
                }}>
                  No users found matching your filters
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }} className="table-row-hover">

                  {/* Avatar + Name */}
                  <td style={{ padding: '16px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px' 
                    }}>
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          style={{ 
                            width: '36px', 
                            height: '36px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid rgba(232,184,75,0.25)',
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #E8B84B 0%, #C9962A 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: '700',
                          color: '#0D0D0F',
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}>
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <div style={{ 
                          fontWeight: '600', 
                          fontSize: '13px',
                          color: '#F5F5F0',
                        }}>
                          {user.name || 'No name'}
                        </div>
                        {user.googleId && (
                          <div style={{ 
                            fontSize: '9px', 
                            color: '#E8B84B',
                            marginTop: '2px',
                            fontWeight: '700',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase'
                          }}>
                            Google Account
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding: '16px', fontSize: '13px', color: '#A0A0A8' }}>
                    {user.email}
                  </td>

                  {/* Role badge */}
                  <td style={{ padding: '16px' }}>
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user._id, e.target.value)}
                      style={{
                        background: user.role === 'admin' 
                          ? 'rgba(232,184,75,0.12)' 
                          : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${user.role === 'admin' 
                          ? 'rgba(232,184,75,0.30)' 
                          : 'rgba(255,255,255,0.10)'}`,
                        borderRadius: '999px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: user.role === 'admin' ? '#E8B84B' : '#A0A0A8',
                        cursor: 'pointer',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        outline: 'none'
                      }}
                    >
                      <option value="user" style={{ background: '#141416', color: '#A0A0A8' }}>User</option>
                      <option value="admin" style={{ background: '#141416', color: '#E8B84B' }}>Admin</option>
                    </select>
                  </td>

                  {/* Plan badge */}
                  <td style={{ padding: '16px' }}>
                    {(() => {
                      const plan = user.subscription?.plan || 'free';
                      const colors = {
                        free:     { bg: 'rgba(255,255,255,0.06)', color: '#606068', border: 'rgba(255,255,255,0.10)' },
                        basic:    { bg: 'rgba(52,152,219,0.12)',  color: '#3498DB', border: 'rgba(52,152,219,0.30)' },
                        standard: { bg: 'rgba(155,89,182,0.12)', color: '#9B59B6', border: 'rgba(155,89,182,0.30)' },
                        premium:  { bg: 'rgba(232,184,75,0.15)', color: '#E8B84B', border: 'rgba(232,184,75,0.35)' },
                      };
                      const c = colors[plan] || colors.free;
                      return (
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '999px',
                          background: c.bg,
                          color: c.color,
                          border: `1px solid ${c.border}`,
                          fontSize: '11px',
                          fontWeight: '700',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}>
                          {plan}
                        </span>
                      );
                    })()}
                  </td>

                  {/* Status badge + quick action */}
                  <td style={{ padding: '16px' }}>
                    <select
                      value={user.status}
                      onChange={e => handleStatusChange(user._id, e.target.value)}
                      style={{
                        background: user.status === 'active'
                          ? 'rgba(46,204,113,0.10)'
                          : user.status === 'suspended'
                          ? 'rgba(231,76,60,0.10)'
                          : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${
                          user.status === 'active'    ? 'rgba(46,204,113,0.30)'  :
                          user.status === 'suspended' ? 'rgba(231,76,60,0.30)'   :
                          'rgba(255,255,255,0.10)'
                        }`,
                        borderRadius: '999px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: user.status === 'active'    ? '#2ECC71' :
                               user.status === 'suspended' ? '#E74C3C' :
                               '#606068',
                        cursor: 'pointer',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        outline: 'none'
                      }}
                    >
                      <option value="active" style={{ background: '#141416', color: '#2ECC71' }}>Active</option>
                      <option value="suspended" style={{ background: '#141416', color: '#E74C3C' }}>Suspended</option>
                      <option value="banned" style={{ background: '#141416', color: '#606068' }}>Banned</option>
                    </select>
                  </td>

                  {/* Active devices */}
                  <td style={{ padding: '16px', fontSize: '13px', color: '#A0A0A8' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px' 
                    }}>
                      <Laptop size={14} style={{ color: '#606068' }} />
                      <span>{user.devices?.length || 0}</span>
                      <span style={{ color: '#404045' }}>/</span>
                      <span style={{ color: '#606068' }}>{user.currentPlanLimits?.maxDevices || 1}</span>
                    </div>
                  </td>

                  {/* Joined date */}
                  <td style={{ padding: '16px', fontSize: '12px', color: '#606068' }}>
                    {user.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'
                    }
                  </td>

                  {/* Last login */}
                  <td style={{ padding: '16px', fontSize: '12px', color: '#606068' }}>
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Never'
                    }
                  </td>

                  {/* Action buttons */}
                  <td style={{ padding: '16px' }}>
                    <div style={{ 
                      display: 'flex', 
                      gap: '6px',
                      alignItems: 'center',
                    }}>
                      {/* View detail */}
                      <button
                        onClick={() => handleViewDetail(user._id)}
                        title="View details"
                        style={{
                          width: '30px', height: '30px',
                          borderRadius: '6px',
                          background: 'rgba(52,152,219,0.12)',
                          border: '1px solid rgba(52,152,219,0.25)',
                          color: '#3498DB',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Eye size={14} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          setUserToDelete(user);
                          setShowDeleteModal(true);
                        }}
                        title="Delete user"
                        style={{
                          width: '30px', height: '30px',
                          borderRadius: '6px',
                          background: 'rgba(231,76,60,0.10)',
                          border: '1px solid rgba(231,76,60,0.25)',
                          color: '#E74C3C',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------------------
      G) PAGINATION CONTROLS
      ------------------------------------------------------------ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        marginTop: '0',
      }}>
        <span style={{ fontSize: '13px', color: '#606068' }}>
          Showing {total === 0 ? 0 : (page - 1) * 20 + 1}–{Math.min(page * 20, total)} 
          of {total} users
        </span>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.04)',
              color: page === 1 ? '#404040' : '#A0A0A8',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
          >
            ← Previous
          </button>

          {/* Page number buttons */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                style={{
                  width: '32px', height: '32px',
                  borderRadius: '6px',
                  border: `1px solid ${page === pageNum 
                    ? 'rgba(232,184,75,0.40)' 
                    : 'rgba(255,255,255,0.08)'}`,
                  background: page === pageNum 
                    ? 'rgba(232,184,75,0.15)' 
                    : 'rgba(255,255,255,0.03)',
                  color: page === pageNum ? '#E8B84B' : '#A0A0A8',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: page === pageNum ? '700' : '400',
                  transition: 'all 0.2s'
                }}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.04)',
              color: (page === totalPages || totalPages === 0) ? '#404040' : '#A0A0A8',
              cursor: (page === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
          >
            Next →
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------
      MODALS & PANELS INTEGRATION
      ------------------------------------------------------------ */}
      {showDetail && selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          onClose={() => { setShowDetail(false); setSelected(null); }}
          handleStatusChange={handleStatusChange}
          handleForceRemoveDevice={handleForceRemoveDevice}
          setUserToDelete={setUserToDelete}
          setShowDeleteModal={setShowDeleteModal}
        />
      )}

      {showDeleteModal && userToDelete && (
        <DeleteConfirmModal
          userToDelete={userToDelete}
          setShowDeleteModal={setShowDeleteModal}
          handleDeleteConfirm={handleDeleteConfirm}
          actionLoading={actionLoading}
        />
      )}

      {/* Glassmorphic Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '12px 20px',
          borderRadius: '8px',
          background: toast.type === 'success' ? 'rgba(46,204,113,0.95)' : 'rgba(231,76,60,0.95)',
          color: '#FFFFFF',
          fontWeight: '600',
          fontSize: '14px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.25)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backdropFilter: 'blur(10px)',
          border: toast.type === 'success' ? '1px solid rgba(46,204,113,0.3)' : '1px solid rgba(231,76,60,0.3)',
          transition: 'all 0.3s ease',
          fontFamily: "'Outfit', sans-serif"
        }}>
          <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}
