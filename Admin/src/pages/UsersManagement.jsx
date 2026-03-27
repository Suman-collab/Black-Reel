import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import StatePanel from '../components/StatePanel';
import { getUsers, updateUserRole, updateUserStatus } from '../features/users/users.service';
import '../styles/UsersManagement.css';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getUsers();

        if (isMounted) {
          setUsers(data);
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search);
      const matchesFilter = filter === 'All' || user.status === filter.toLowerCase();
      return matchesSearch && matchesFilter;
    });
  }, [users, searchTerm, filter]);

  const handleUserUpdate = (updatedUser) => {
    setUsers((current) => current.map((user) => (user._id === updatedUser._id ? updatedUser : user)));
  };

  const handleRoleChange = async (userId, role) => {
    try {
      const updatedUser = await updateUserRole(userId, role);
      handleUserUpdate(updatedUser);
    } catch (apiError) {
      setError(apiError.message);
    }
  };

  const handleStatusChange = async (userId, status) => {
    try {
      const updatedUser = await updateUserStatus(userId, status);
      handleUserUpdate(updatedUser);
    } catch (apiError) {
      setError(apiError.message);
    }
  };

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) return;

    const headers = ['ID', 'Name', 'Email', 'Role', 'Joined', 'Status'];
    const csvRows = [headers.join(',')];

    for (const user of filteredUsers) {
      const row = [
        user._id,
        `"${user.name}"`,
        `"${user.email}"`,
        user.role,
        new Date(user.createdAt).toLocaleDateString(),
        user.status,
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'users_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <StatePanel title="Loading users" message="Fetching live user records from the platform." />;
  }

  if (error && users.length === 0) {
    return <StatePanel title="Users unavailable" message={error} />;
  }

  const columns = [
    { key: '_id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (value, row) => (
        <select value={value} onChange={(event) => handleRoleChange(row._id, event.target.value)} className="filter-select">
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      )
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => (
        <select value={value} onChange={(event) => handleStatusChange(row._id, event.target.value)} className="filter-select">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="banned">Banned</option>
        </select>
      )
    }
  ];

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Users Management</h1>
        <p>Manage, view, and update registered platform users.</p>
        {error ? <p style={{ color: '#ffb3b3' }}>{error}</p> : null}
      </div>

      <div className="page-controls">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="search-input"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <select className="filter-select" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Banned">Banned</option>
        </select>
        <button className="action-btn primary" onClick={handleExportCSV}>Export CSV</button>
      </div>

      <DataTable columns={columns} data={filteredUsers} />
    </div>
  );
};

export default UsersManagement;
