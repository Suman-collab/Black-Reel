import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import StatePanel from '../components/StatePanel';
import { getSubscriptions } from '../features/admin/admin.service';

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterPlan, setFilterPlan] = useState('All');

  useEffect(() => {
    let isMounted = true;

    const loadSubscriptions = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getSubscriptions();

        if (isMounted) {
          setSubscriptions(data);
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
  }, []);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((subscription) => filterPlan === 'All' || subscription.plan === filterPlan.toLowerCase());
  }, [subscriptions, filterPlan]);

  const handleExportRevenue = () => {
    if (filteredSubscriptions.length === 0) return;

    const headers = ['Transaction ID', 'User Email', 'Plan Level', 'Amount', 'Next Billing Date', 'Status'];
    const csvRows = [headers.join(',')];

    for (const subscription of filteredSubscriptions) {
      const row = [
        subscription.id,
        `"${subscription.userEmail || ''}"`,
        `"${subscription.plan}"`,
        subscription.amount,
        new Date(subscription.nextBilling).toLocaleDateString(),
        subscription.status,
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'revenue_report.csv');
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
    { key: 'id', label: 'Transaction ID' },
    { key: 'userEmail', label: 'User Email' },
    { key: 'plan', label: 'Plan Level' },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => `$${Number(value).toFixed(2)}`,
    },
    {
      key: 'nextBilling',
      label: 'Next Billing Date',
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <span className={`status-badge ${String(value).toLowerCase()}`}>{value}</span>
    }
  ];

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Subscription Management</h1>
        <p>Monitor recurring revenue and active user tiers.</p>
        {error ? <p style={{ color: '#ffb3b3' }}>{error}</p> : null}
      </div>

      <div className="page-controls">
        <select className="filter-select" value={filterPlan} onChange={(event) => setFilterPlan(event.target.value)}>
          <option value="All">All Plans</option>
          <option value="premium">Premium</option>
          <option value="standard">Standard</option>
          <option value="basic">Basic</option>
        </select>
        <button className="action-btn primary" onClick={handleExportRevenue}>Generate Revenue Report</button>
      </div>

      <DataTable columns={columns} data={filteredSubscriptions} />
    </div>
  );
};

export default SubscriptionManagement;
