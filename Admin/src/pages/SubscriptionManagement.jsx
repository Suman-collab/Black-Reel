import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import StatePanel from '../components/StatePanel';
import { getSubscriptions } from '../features/admin/admin.service';
import { TrendingUp, CreditCard, AlertOctagon, Layers } from 'lucide-react';

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterPlan, setFilterPlan] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterMode, setFilterMode] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isDummyMode = import.meta.env.VITE_PAYMENT_MODE === 'dummy';

  useEffect(() => {
    let isMounted = true;

    const loadSubscriptions = async () => {
      setLoading(true);
      setError('');

      try {
        const queryParams = {
          page,
          limit: 100, 
          plan: filterPlan === 'All' ? undefined : filterPlan.toLowerCase(),
        };
        const data = await getSubscriptions(queryParams);

        if (isMounted) {
          setSubscriptions(data.subscriptions || []);
          setTotalPages(data.totalPages || 1);
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

    loadSubscriptions();

    return () => {
      isMounted = false;
    };
  }, [page, filterPlan]);

  
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      const matchStatus = filterStatus === 'All' 
        ? true 
        : filterStatus === 'Success' 
          ? (sub.status === 'success' || sub.status === 'completed')
          : (sub.status === 'failed');

      const matchMode = filterMode === 'All'
        ? true
        : sub.paymentMode?.toLowerCase() === filterMode.toLowerCase();

      return matchStatus && matchMode;
    });
  }, [subscriptions, filterStatus, filterMode]);

  
  const summaryMetrics = useMemo(() => {
    const successfulSubs = subscriptions.filter(s => s.status === 'success' || s.status === 'completed');
    const failedSubs = subscriptions.filter(s => s.status === 'failed');
    
    const totalRevenue = successfulSubs.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalTransactions = subscriptions.length;
    const failedCount = failedSubs.length;

    
    const planCounts = {};
    successfulSubs.forEach(s => {
      const planName = s.plan || s.planType || 'Basic';
      planCounts[planName] = (planCounts[planName] || 0) + 1;
    });
    
    let popularPlan = 'None';
    let maxCount = 0;
    Object.entries(planCounts).forEach(([plan, count]) => {
      if (count > maxCount) {
        maxCount = count;
        popularPlan = plan;
      }
    });

    return {
      totalRevenue,
      totalTransactions,
      failedCount,
      popularPlan
    };
  }, [subscriptions]);

  const handleExportRevenue = () => {
    if (filteredSubscriptions.length === 0) return;

    const headers = ['Transaction ID', 'User Name', 'User Email', 'Plan Level', 'Amount', 'Payment Mode', 'Status', 'Date'];
    const csvRows = [headers.join(',')];

    for (const sub of filteredSubscriptions) {
      const row = [
        sub.transactionId || sub.id,
        `"${sub.userName || 'Guest'}"`,
        `"${sub.userEmail || ''}"`,
        `"${sub.plan || sub.planType}"`,
        sub.amount,
        sub.paymentMode || 'dummy',
        sub.status,
        new Date(sub.createdAt || sub.completedAt || sub.paidAt).toLocaleDateString(),
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'subscription_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <StatePanel title="Loading subscriptions" message="Pulling recurring billing and active plan data." />;
  }

  if (error && subscriptions.length === 0) {
    return <StatePanel title="Subscriptions unavailable" message={error} />;
  }

  const columns = [
    {
      key: 'userEmail',
      label: 'User Name / Email',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{row.userName || 'Anonymous'}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{row.userEmail || 'no-email@blackreel.com'}</div>
        </div>
      )
    },
    { 
      key: 'plan', 
      label: 'Plan',
      render: (value, row) => {
        const p = (row.plan || row.planType || 'BASIC').toLowerCase();
        let badgeClass = 'badge-gray';
        if (p === 'basic') badgeClass = 'badge-basic';
        if (p === 'standard') badgeClass = 'badge-standard';
        if (p === 'premium') badgeClass = 'badge-premium';
        return <span className={`badge ${badgeClass}`}>{p.toUpperCase()}</span>;
      }
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value, row) => {
        const currencySymbol = '₹';
        return <strong style={{ color: 'var(--text-primary)' }}>{currencySymbol}{Number(value).toFixed(2)}</strong>;
      },
    },
    {
      key: 'paymentMode',
      label: 'Mode',
      render: (value) => (
        <span className="badge badge-gold">
          {(value || 'dummy').toUpperCase()}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const isSuccess = String(value).toLowerCase() === 'success' || String(value).toLowerCase() === 'completed';
        return (
          <span className={`badge ${isSuccess ? 'badge-green' : 'badge-red'}`}>
            {isSuccess ? 'Success' : 'Failed'}
          </span>
        );
      }
    },
    {
      key: 'transactionId',
      label: 'Transaction ID',
      render: (value, row) => <code style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{value || row.id}</code>
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (value, row) => new Date(value || row.completedAt || row.paidAt).toLocaleDateString(),
    }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {isDummyMode && (
        <div style={{
          background: 'rgba(232, 184, 75, 0.12)',
          color: 'var(--text-gold)',
          padding: '12px 20px',
          borderRadius: 'var(--radius-xl)',
          fontWeight: '600',
          border: '1px solid rgba(232, 184, 75, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: 'var(--text-sm)'
        }}>
          <span>⚠️</span> TEST MODE — Razorpay/Stripe details simulated via sandbox.
        </div>
      )}

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Subscription Management</h1>
          <p className="admin-page-subtitle">Monitor recurring revenue, audit logs, and active payment channels.</p>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon"><TrendingUp size={20} /></div>
          <div className="admin-stat-card__value" style={{ color: 'var(--text-gold)' }}>₹{summaryMetrics.totalRevenue.toFixed(2)}</div>
          <div className="admin-stat-card__label">TOTAL REVENUE</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon"><CreditCard size={20} /></div>
          <div className="admin-stat-card__value">{summaryMetrics.totalTransactions}</div>
          <div className="admin-stat-card__label">TOTAL TRANSACTIONS</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon"><AlertOctagon size={20} style={{ color: '#E74C3C' }} /></div>
          <div className="admin-stat-card__value" style={{ color: '#E74C3C' }}>{summaryMetrics.failedCount}</div>
          <div className="admin-stat-card__label">FAILED TRANSACTIONS</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon"><Layers size={20} style={{ color: '#2ECC71' }} /></div>
          <div className="admin-stat-card__value" style={{ color: '#2ECC71' }}>{summaryMetrics.popularPlan.toUpperCase()}</div>
          <div className="admin-stat-card__label">POPULAR PLAN</div>
        </div>
      </div>

      <div className="admin-page-controls">
        {/* Plan Filter */}
        <select
          className="filter-select"
          value={filterPlan}
          onChange={(event) => {
            setFilterPlan(event.target.value);
            setPage(1);
          }}
        >
          <option value="All">All Plans</option>
          <option value="premium">Premium</option>
          <option value="standard">Standard</option>
          <option value="basic">Basic</option>
        </select>

        {/* Status Filter */}
        <select
          className="filter-select"
          value={filterStatus}
          onChange={(event) => {
            setFilterStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="All">All Statuses</option>
          <option value="Success">Success</option>
          <option value="Failed">Failed</option>
        </select>

        {}
        <select
          className="filter-select"
          value={filterMode}
          onChange={(event) => {
            setFilterMode(event.target.value);
            setPage(1);
          }}
        >
          <option value="All">All Modes</option>
          <option value="Dummy">Dummy</option>
          <option value="Stripe">Stripe</option>
          <option value="Razorpay">Razorpay</option>
        </select>

        <button className="btn btn-primary" onClick={handleExportRevenue} style={{ marginLeft: 'auto', height: '44px', padding: '0 var(--space-4)', fontSize: 'var(--text-sm)' }}>
          Generate Revenue Report
        </button>
      </div>

      <DataTable columns={columns} data={filteredSubscriptions} />

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', alignItems: 'center' }}>
        <button className="btn btn-ghost" style={{ height: '36px', padding: '0 var(--space-4)' }} disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Prev</button>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
        <button className="btn btn-ghost" style={{ height: '36px', padding: '0 var(--space-4)' }} disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button>
      </div>
    </div>
  );
};

export default SubscriptionManagement;

