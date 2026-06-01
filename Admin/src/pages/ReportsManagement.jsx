import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import StatePanel from '../components/StatePanel';
import { getReports, updateReportStatus } from '../features/admin/admin.service';

const ReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      setLoading(true);
      setError('');

      try {
        const queryParams = {
          page,
          limit: 20,
          status: filterStatus === 'all' ? undefined : filterStatus,
        };
        const data = await getReports(queryParams);

        if (isMounted) {
          setReports(data.reports || []);
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

    loadReports();

    return () => {
      isMounted = false;
    };
  }, [page, filterStatus]);

  const handleStatusChange = async (reportId, status) => {
    try {
      const updated = await updateReportStatus(reportId, status);
      setReports((current) => current.map((report) => (report._id === updated._id ? updated : report)));
    } catch (apiError) {
      setError(apiError.message);
    }
  };

  if (loading) {
    return <StatePanel title="Loading moderation reports" message="Fetching live report queues and moderation statuses." />;
  }

  if (error && reports.length === 0) {
    return <StatePanel title="Reports unavailable" message={error} />;
  }

  const columns = [
    { key: '_id', label: 'Report ID', render: (val) => <code style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{val}</code> },
    { key: 'contentTitle', label: 'Target Content / User' },
    { key: 'reason', label: 'Report Reason' },
    { key: 'reportedByEmail', label: 'Reported By' },
    {
      key: 'createdAt',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => (
        <select
          value={value}
          onChange={(event) => handleStatusChange(row._id, event.target.value)}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--text-xs)',
            outline: 'none'
          }}
        >
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
      )
    }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Moderation Reports</h1>
          <p className="admin-page-subtitle">Review, audit, and act upon content flagged by the community.</p>
        </div>
      </div>

      <div className="admin-page-controls">
        <select
          className="filter-select"
          value={filterStatus}
          onChange={(event) => {
            setFilterStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Reports</option>
          <option value="pending">Pending Review</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <DataTable columns={columns} data={reports} />

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', alignItems: 'center' }}>
        <button className="btn btn-ghost" style={{ height: '36px', padding: '0 var(--space-4)' }} disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Prev</button>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
        <button className="btn btn-ghost" style={{ height: '36px', padding: '0 var(--space-4)' }} disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button>
      </div>
    </div>
  );
};

export default ReportsManagement;

