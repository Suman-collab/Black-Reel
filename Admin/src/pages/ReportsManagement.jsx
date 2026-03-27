import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import StatePanel from '../components/StatePanel';
import { getReports, updateReportStatus } from '../features/admin/admin.service';

const ReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getReports();

        if (isMounted) {
          setReports(data);
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
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => filterStatus === 'all' || report.status === filterStatus);
  }, [reports, filterStatus]);

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
    { key: '_id', label: 'Report ID' },
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
        <select value={value} onChange={(event) => handleStatusChange(row._id, event.target.value)} className="filter-select">
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
      )
    }
  ];

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Moderation Reports</h1>
        <p>Review and act upon content flagged by the community.</p>
        {error ? <p style={{ color: '#ffb3b3' }}>{error}</p> : null}
      </div>

      <div className="page-controls">
        <select className="filter-select" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
          <option value="all">All Reports</option>
          <option value="pending">Pending Review</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <DataTable columns={columns} data={filteredReports} />
    </div>
  );
};

export default ReportsManagement;
