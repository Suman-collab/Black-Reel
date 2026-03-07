import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import './Settings.css';

export default function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  return (
    <div className="settings-page container">
      <div className="page-header center">
        <img src="/images/Vertical%20logo/Black-Shortz.png" alt="Black Shortz Logo" className="logo-header" />
        <h1 className="page-title text-gold uppercase tracking-wider">Settings</h1>
      </div>

      <div className="settings-list-container">

        {/* Email */}
        <div className="settings-item">
          <div className="settings-item-content">
            <h3>Email</h3>
            <p>user@email.com</p>
          </div>
          <ChevronRight size={20} className="text-muted" />
        </div>

        {/* Password */}
        <div className="settings-item">
          <div className="settings-item-content">
            <h3>Password</h3>
            <p>Last updated: 2 months ago</p>
          </div>
          <ChevronRight size={20} className="text-muted" />
        </div>

        {/* Notifications */}
        <div className="settings-item">
          <div className="settings-item-content">
            <h3>Notifications</h3>
            <p>New episodes, promos & updates</p>
          </div>
          <div className={`custom-toggle ${notificationsEnabled ? 'active' : ''}`} onClick={handleToggle}>
            <div className="toggle-circle"></div>
          </div>
        </div>

        {/* Language */}
        <div className="settings-item">
          <div className="settings-item-content">
            <h3>Language</h3>
          </div>
          <div className="settings-item-action">
            <span className="text-muted">English (US)</span>
            <ChevronRight size={20} className="text-muted" />
          </div>
        </div>

        {/* Help & Support */}
        <div className="settings-item">
          <div className="settings-item-content">
            <h3>Help & Support</h3>
            <p>FAQ • Contact Support</p>
          </div>
          <ChevronRight size={20} className="text-muted" />
        </div>

        {/* Log Out */}
        <div className="settings-item logout-item">
          <h3>Log Out</h3>
        </div>

      </div>
    </div>
  );
}
