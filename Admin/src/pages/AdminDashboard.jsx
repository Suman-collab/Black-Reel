import { useEffect, useState } from 'react';
import { Users, Film, CreditCard, Activity } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import DataTable from '../components/DataTable';
import StatePanel from '../components/StatePanel';
import { getOverview } from '../features/admin/admin.service';
import '../styles/AdminDashboard.css';

const formatNumber = (value) => new Intl.NumberFormat().format(value);

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadOverview = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getOverview();

        if (isMounted) {
          setOverview(data);
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

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <StatePanel title="Loading dashboard overview" message="Aggregating platform stats, top content, and recent admin activity." />;
  }

  if (error || !overview) {
    return <StatePanel title="Dashboard unavailable" message={error || 'The overview could not be loaded.'} />;
  }

  const recentUsersColumns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'joinDate',
      label: 'Joined',
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`status-badge ${String(value).toLowerCase()}`}>{value}</span>
      )
    }
  ];

  const topContentColumns = [
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type' },
    { key: 'views', label: 'Total Views', render: (value) => formatNumber(value) },
    { key: 'rating', label: 'Rating' }
  ];

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome back, here&apos;s what&apos;s happening today.</p>
      </div>

      <div className="stats-grid">
        <StatsCard
          title="Total Users"
          value={formatNumber(overview.stats.totalUsers)}
          icon={<Users size={24} />}
          trend="up"
          trendValue="Live user count"
        />
        <StatsCard
          title="Total Content"
          value={formatNumber(overview.stats.totalContent)}
          icon={<Film size={24} />}
          trend="up"
          trendValue="Published titles"
        />
        <StatsCard
          title="Active Subscriptions"
          value={formatNumber(overview.stats.activeSubscriptions)}
          icon={<CreditCard size={24} />}
          trend="up"
          trendValue="Users on paid plans"
        />
        <StatsCard
          title="Pending Reports"
          value={formatNumber(overview.stats.pendingReports)}
          icon={<Activity size={24} />}
          trend={overview.stats.pendingReports > 0 ? 'up' : 'down'}
          trendValue={`Revenue: $${overview.stats.totalRevenue.toFixed(2)}`}
        />
      </div>

      <div className="dashboard-tables-grid">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Users</h2>
          </div>
          <DataTable columns={recentUsersColumns} data={overview.recentUsers} />
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Top Performing Content</h2>
          </div>
          <DataTable columns={topContentColumns} data={overview.topContent} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
