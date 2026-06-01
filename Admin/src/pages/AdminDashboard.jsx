import { useEffect, useState } from 'react';
import {
  Users, Film, CreditCard, Activity, Crown, Clock, Tv,
  PlayCircle, TrendingUp, AlertTriangle, BarChart3,
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import DataTable from '../components/DataTable';
import StatePanel from '../components/StatePanel';
import { getOverview } from '../features/admin/admin.service';

const formatNumber = (value) => new Intl.NumberFormat('en-IN').format(value);
const formatCurrency = (value) => `₹${new Intl.NumberFormat('en-IN').format(value)}`;
const OVERVIEW_REFRESH_MS = 24 * 60 * 60 * 1000;
const formatWatchHours = (value) => {
  const num = Number(value || 0);
  return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(num)}h`;
};

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    let refreshTimer = null;

    const loadOverview = async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }
      setError('');

      try {
        const data = await getOverview();
        if (isMounted) setOverview(data);
      } catch (apiError) {
        if (isMounted) setError(apiError.message);
      } finally {
        if (isMounted && !silent) setLoading(false);
      }
    };

    loadOverview();

    refreshTimer = setInterval(() => {
      void loadOverview({ silent: true });
    }, OVERVIEW_REFRESH_MS);

    return () => {
      isMounted = false;
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, []);

  if (loading) {
    return <StatePanel title="Loading dashboard overview" message="Aggregating platform stats, top content, and recent admin activity." />;
  }

  if (error || !overview) {
    return <StatePanel title="Dashboard unavailable" message={error || 'The overview could not be loaded.'} />;
  }

  const s = overview.stats;

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
      render: (value) => {
        const val = String(value).toLowerCase();
        let badgeClass = 'badge-gray';
        if (val === 'active') badgeClass = 'badge-green';
        if (val === 'inactive') badgeClass = 'badge-gray';
        if (val === 'banned') badgeClass = 'badge-red';
        return <span className={`badge ${badgeClass}`}>{value}</span>;
      },
    },
  ];

  const topContentColumns = [
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type' },
    { key: 'views', label: 'Total Views', render: (value) => formatNumber(value) },
    { key: 'rating', label: 'Rating' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard Overview</h1>
          <p className="admin-page-subtitle">Welcome back! Here's a glance at your platform operations today.</p>
        </div>
      </div>

      {/* ─── Primary Stats Row ──────────────────────── */}
      <div className="admin-stats-grid">
        <StatsCard
          title="Total Users"
          value={formatNumber(s.totalUsers)}
          icon={<Users size={20} />}
          trend="up"
          trendValue="All registered users"
        />
        <StatsCard
          title="Premium Users"
          value={formatNumber(s.premiumUsers || 0)}
          icon={<Crown size={20} />}
          trend="up"
          trendValue="Active subscribers"
        />
        <StatsCard
          title="Revenue"
          value={formatCurrency(s.totalRevenue || 0)}
          icon={<CreditCard size={20} />}
          trend="up"
          trendValue="Total collected"
        />
        <StatsCard
          title="Active Subscriptions"
          value={formatNumber(s.activeSubscriptions)}
          icon={<TrendingUp size={20} />}
          trend="up"
          trendValue="Currently active"
        />
      </div>

      {/* ─── Secondary Stats Row ────────────────────── */}
      <div className="admin-stats-grid">
        <StatsCard
          title="Expired Subscriptions"
          value={formatNumber(s.expiredSubscriptions || 0)}
          icon={<AlertTriangle size={20} />}
          trend={s.expiredSubscriptions > 0 ? 'up' : 'down'}
          trendValue="Cancelled / expired"
        />
        <StatsCard
          title="Total Movies"
          value={formatNumber(s.totalMovies || 0)}
          icon={<Film size={20} />}
          trend="up"
          trendValue="Published movies"
        />
        <StatsCard
          title="Total Series"
          value={formatNumber(s.totalSeries || 0)}
          icon={<Tv size={20} />}
          trend="up"
          trendValue="Parent series titles"
        />
        <StatsCard
          title="Total Episodes"
          value={formatNumber(s.totalEpisodes || 0)}
          icon={<PlayCircle size={20} />}
          trend="up"
          trendValue="All published episodes"
        />
      </div>

      {/* ─── Tertiary Stats Row ─────────────────────── */}
      <div className="admin-stats-grid">
        <StatsCard
          title="Total Content"
          value={formatNumber(s.totalContent)}
          icon={<BarChart3 size={20} />}
          trend="up"
          trendValue="All published titles"
        />
        <StatsCard
          title="Total Watch Time"
          value={formatWatchHours(s.totalWatchTimeHours)}
          icon={<Clock size={20} />}
          trend="up"
          trendValue="Estimated viewing hours"
        />
        <StatsCard
          title="Pending Reports"
          value={formatNumber(s.pendingReports)}
          icon={<Activity size={20} />}
          trend={s.pendingReports > 0 ? 'up' : 'down'}
          trendValue="Awaiting review"
        />
      </div>

      {/* ─── Data Tables ────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: 'var(--space-6)',
        marginTop: 'var(--space-2)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="admin-page-title" style={{ fontSize: 'var(--text-lg)', marginBottom: 0 }}>Recent Signups</h2>
          </div>
          <DataTable columns={recentUsersColumns} data={overview.recentUsers} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="admin-page-title" style={{ fontSize: 'var(--text-lg)', marginBottom: 0 }}>Most Watched Content</h2>
          </div>
          <DataTable columns={topContentColumns} data={overview.topContent} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
