import React, { useEffect, useState } from 'react';
import './Notifications.css';
import StatePanel from '../components/StatePanel';
import { getNotifications, updateNotificationPreferences } from '../features/notifications/notification.service';
import { getProfile } from '../features/user/user.service';
import { useAuth } from '../features/auth/AuthContext';

export default function Notifications() {
  const { updateUser } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      setLoading(true);
      setError('');

      try {
        const [user, items] = await Promise.all([getProfile(), getNotifications()]);

        if (isMounted) {
          setNotificationsEnabled(Boolean(user.preferences?.notificationsEnabled));
          setNotifications(items);
          updateUser(user);
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

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

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
    } catch (apiError) {
      setNotificationsEnabled(!nextValue);
      setError(apiError.message);
    }
  };

  if (loading) {
    return <StatePanel title="Loading notifications" message="Checking your broadcasts, updates, and alerts." />;
  }

  if (error) {
    return <StatePanel title="Notifications unavailable" message={error} />;
  }

  return (
    <div className="notifications-page container">
      <div className="page-header center">
        <img src="/images/Horizontal%20logo/Black-Shortz.png" alt="Black Shortz Logo" className="logo-header-horizontal" />
        <h1 className="page-title text-gold mt-4">Notifications</h1>
      </div>

      <div className="notifications-list-container">
        <div className="notifications-toggle-header">
          <span>Notifications</span>
          <div className={`custom-toggle ${notificationsEnabled ? 'active' : ''}`} onClick={handleToggle}>
            <div className="toggle-circle"></div>
          </div>
        </div>

        <div className="notifications-list">
          {notifications.map((notification) => (
            <div className="notification-item" key={notification.id}>
              <div className="notif-badge">{notification.type.replace('_', ' ')}</div>
              <div className="notif-content">
                <p>{notification.message}</p>
              </div>
              <div className="notif-time">{new Date(notification.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
