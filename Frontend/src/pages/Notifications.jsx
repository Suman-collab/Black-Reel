import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  AlertCircle, 
  Sparkles, 
  Compass, 
  Trash2, 
  Settings,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getNotifications, updateNotificationPreferences } from '../features/notifications/notification.service';
import { getProfile } from '../features/user/user.service';
import { useAuth } from '../features/auth/AuthContext';
import './Notifications.css';

// Shimmering skeleton loaders for cinematic loading experience
function NotificationSkeleton() {
  return (
    <div className="notifications-skeleton">
      {[1, 2, 3].map((i) => (
        <div className="skeleton-item animate-fadeInUp" key={i} style={{ '--delay': i }}>
          <div className="skeleton-badge shimmer"></div>
          <div className="skeleton-content">
            <div className="skeleton-line shimmer width-80"></div>
            <div className="skeleton-line shimmer width-50 mt-2"></div>
          </div>
          <div className="skeleton-action shimmer"></div>
        </div>
      ))}
    </div>
  );
}

// Inline error view with a retry trigger
function NotificationError({ message, onRetry }) {
  return (
    <div className="error-retry-card animate-fadeInUp">
      <div className="error-icon-box">
        <AlertCircle size={36} color="#ff6b6b" />
      </div>
      <h4 className="error-title">Unable to Load Notifications</h4>
      <p className="error-desc">{message || 'We could not fetch your account alerts. Please check your network connection.'}</p>
      <button className="ott-retry-btn" onClick={onRetry}>
        <RefreshCw size={16} className="inline mr-2" />
        Retry Connection
      </button>
    </div>
  );
}

// Premium OTT Empty State Card Component
function EmptyNotifications({ onBrowse, onSettings }) {
  return (
    <div className="empty-notif-card animate-fadeInUp">
      <div className="empty-glow-overlay"></div>
      
      <div className="empty-bell-wrapper">
        <div className="bell-glow-pulse"></div>
        <Bell size={48} className="empty-bell-icon" />
      </div>

      <h3 className="empty-title">No Notifications Yet</h3>
      <p className="empty-desc">
        You're all caught up. New updates, releases, watchlist alerts, and account notifications will appear here.
      </p>

      <div className="empty-actions">
        <button className="ott-btn ott-btn-gold" onClick={onBrowse}>
          <Compass size={16} className="inline mr-2" />
          Browse Content
        </button>
        <button className="ott-btn ott-btn-glass" onClick={onSettings}>
          <Settings size={16} className="inline mr-2" />
          Notification Settings
        </button>
      </div>
    </div>
  );
}

export default function Notifications() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Primary loader function
  const loadNotificationsData = async () => {
    setLoading(true);
    setError('');

    try {
      const [userProfile, items] = await Promise.all([
        getProfile(), 
        getNotifications()
      ]);

      setNotificationsEnabled(Boolean(userProfile.preferences?.notificationsEnabled));
      setNotifications(items);
      updateUser(userProfile);
    } catch (apiError) {
      setError(apiError.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotificationsData();
  }, []);

  // Handle Toggle Settings Switch
  const handleToggle = async () => {
    const nextValue = !notificationsEnabled;
    setNotificationsEnabled(nextValue);

    try {
      const preferences = await updateNotificationPreferences(nextValue);
      updateUser((currentUser) => ({
        ...currentUser,
        preferences: {
          ...currentUser.preferences,
          ...preferences,
        },
      }));
      toast.success(
        nextValue 
          ? 'Notifications enabled successfully!' 
          : 'Notifications muted successfully.'
      );
    } catch (apiError) {
      setNotificationsEnabled(!nextValue);
      setError(apiError.message);
      toast.error('Failed to update notification settings.');
    }
  };

  // Process manual deletion with fade transition timing
  const handleDelete = (id) => {
    setNotifications((current) =>
      current.map((n) => (n.id === id ? { ...n, isDeleting: true } : n))
    );

    setTimeout(() => {
      setNotifications((current) => current.filter((n) => n.id !== id));
      toast.info('Notification removed.');
    }, 250);
  };

  return (
    <div className="notifications-page container">
      
      {/* Header Container */}
      <div className="page-header center animate-fadeInUp" style={{ '--delay': 1 }}>
        <h1 className="page-title text-gold">Notifications</h1>
      </div>

      <div className="notifications-list-container animate-fadeInUp" style={{ '--delay': 2 }}>
        
        {/* Toggle Panel Section */}
        <div className="notifications-toggle-header">
          <span className="toggle-label-text">Enable Updates & Alerts</span>
          <div 
            className={`custom-toggle ${notificationsEnabled ? 'active' : ''}`} 
            onClick={handleToggle}
            aria-label="Toggle notifications configuration"
          >
            <div className="toggle-circle"></div>
          </div>
        </div>

        {/* Dynamic Conditional Core rendering */}
        <div className="notifications-content-panel">
          {loading ? (
            <NotificationSkeleton />
          ) : error ? (
            <NotificationError message={error} onRetry={loadNotificationsData} />
          ) : notifications.length === 0 ? (
            <EmptyNotifications 
              onBrowse={() => navigate('/categories')} 
              onSettings={() => navigate('/profile')} 
            />
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div className={`notification-item ${notification.isDeleting ? 'deleting' : ''}`} key={notification.id}>
                  <div className="notif-badge">
                    {notification.type ? notification.type.replace('_', ' ') : 'ALERT'}
                  </div>
                  <div className="notif-content">
                    <p>{notification.message}</p>
                  </div>
                  <div className="notif-action-section">
                    <div className="notif-time">
                      {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : 'Recent'}
                    </div>
                    <button
                      className="notif-delete-btn"
                      aria-label="Delete notification"
                      onClick={() => handleDelete(notification.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
