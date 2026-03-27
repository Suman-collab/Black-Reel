import { useEffect, useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import StatePanel from '../components/StatePanel';
import { createBroadcast, getBroadcasts } from '../features/notifications/notifications.service';

const NotificationsManagement = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sentNotifications, setSentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadBroadcasts = async () => {
      setLoading(true);
      setError('');

      try {
        const broadcasts = await getBroadcasts();

        if (isMounted) {
          setSentNotifications(broadcasts);
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

    loadBroadcasts();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSend = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const notification = await createBroadcast({
        title,
        message,
        targetRole: 'all',
        type: 'broadcast',
      });

      setSentNotifications((current) => [notification, ...current]);
      setTitle('');
      setMessage('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <StatePanel title="Loading broadcasts" message="Fetching the latest admin messages sent to users." />;
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Platform Notifications</h1>
        <p>Broadcast messages and alerts to all active users on Black Reel.</p>
        {error ? <p style={{ color: '#ffb3b3' }}>{error}</p> : null}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        <div className="dashboard-section" style={{ backgroundColor: '#1a1a1a', padding: '2rem', borderRadius: '12px', border: '1px solid #333' }}>
          <h2 style={{ color: '#e5b33e', marginBottom: '1.5rem', fontSize: '1.25rem' }}>Compose New Broadcast</h2>

          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>Notification Title</label>
              <input
                type="text"
                className="search-input"
                placeholder="Server Maintenance Notice"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>Message Body</label>
              <textarea
                className="search-input"
                style={{ minHeight: '120px', resize: 'vertical' }}
                placeholder="Enter your message here..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
              ></textarea>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button type="submit" className="action-btn primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }} disabled={submitting}>
                <Send size={18} /> {submitting ? 'Sending...' : 'Send Broadcast'}
              </button>
              {showSuccess ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4CAF50', fontSize: '0.9rem' }}>
                  <CheckCircle2 size={16} /> Notification Sent!
                </span>
              ) : null}
            </div>
          </form>
        </div>

        <div className="dashboard-section" style={{ backgroundColor: '#1a1a1a', padding: '2rem', borderRadius: '12px', border: '1px solid #333', minHeight: '400px' }}>
          <h2 style={{ color: '#fff', marginBottom: '1.5rem', fontSize: '1.25rem' }}>Recent Broadcasts</h2>

          {sentNotifications.length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic' }}>No notifications sent yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sentNotifications.map((notice) => (
                <div key={notice.id} style={{ padding: '1rem', backgroundColor: '#222', borderRadius: '8px', borderLeft: '4px solid #e5b33e' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>{notice.title}</h3>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(notice.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#bbb', lineHeight: '1.4' }}>{notice.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsManagement;
