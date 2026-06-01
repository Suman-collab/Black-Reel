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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Platform Notifications</h1>
          <p className="admin-page-subtitle">Broadcast messages, announcements, and alerts directly to all registered app viewports.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 'var(--space-6)', alignItems: 'start' }}>
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'var(--gradient-gold)'
          }} />
          <h2 className="admin-page-title" style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-6)' }}>Compose New Broadcast</h2>

          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Notification Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="Platform Maintenance Notice"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Message Body</label>
              <textarea
                className="form-input"
                style={{ minHeight: '120px', resize: 'vertical', paddingTop: '12px' }}
                placeholder="Type the message contents..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
              ></textarea>
            </div>

            {error && (
              <div className="form-error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', height: '48px', padding: '0 var(--space-6)' }} disabled={submitting}>
                <Send size={16} /> {submitting ? 'Broadcasting...' : 'Publish Broadcast'}
              </button>
              {showSuccess && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#2ECC71', fontSize: 'var(--text-sm)', fontWeight: '600' }}>
                  <CheckCircle2 size={16} /> Sent successfully!
                </span>
              )}
            </div>
          </form>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-surface)',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
          minHeight: '440px'
        }}>
          <h2 className="admin-page-title" style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-3)' }}>Recent Sent Broadcasts</h2>

          {sentNotifications.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', padding: 'var(--space-4) 0' }}>No broadcasts published yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
              {sentNotifications.map((notice) => (
                <div key={notice.id} className="animate-fade-in" style={{
                  padding: 'var(--space-4)',
                  backgroundColor: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-lg)',
                  borderLeft: '3px solid var(--brand-primary)',
                  transition: 'transform var(--transition-fast)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)', gap: 'var(--space-4)' }}>
                    <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: '600' }}>{notice.title}</h3>
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{new Date(notice.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{notice.message}</p>
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

