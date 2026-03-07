import React, { useState } from 'react';
import './Notifications.css';

export default function Notifications() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const notificationData = [
    { type: 'System', message: 'Your password was changed successfully.', time: '2h' },
    { type: 'New Episode', message: 'Your True Calling - Episode 10 is now available.', time: 'Yesterday' },
    { type: 'Promotion', message: 'Get 15% off your next month with code $AVE15!', time: 'Yesterday' },
    { type: 'New Episode', message: 'Guns And Roses - Episode 8 is now available.', time: 'Yesterday' },
    { type: 'System', message: 'Your email address has been updated.', time: 'Yesterday' },
  ];

  const handleToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

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
          {notificationData.map((notif, index) => (
            <div className="notification-item" key={index}>
              <div className="notif-badge">{notif.type}</div>
              <div className="notif-content">
                <p>{notif.message}</p>
              </div>
              <div className="notif-time">{notif.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
