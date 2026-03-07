import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { ChevronRight } from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const [parentalControls, setParentalControls] = useState(false);

  return (
    <div className="profile-page">
      <div className="profile-container">

        {/* Left Column */}
        <div className="profile-sidebar">
          <img src="/images/avatar.png" alt="Nicole Johnson" className="profile-avatar" />
          <h2 className="profile-name">Nicole Johnson</h2>
          <p className="profile-email">n.johnson@example.com</p>
        </div>

        {/* Right Column */}
        <div className="profile-settings">

          <div className="setting-card">
            <div className="setting-info">
              <span className="setting-label">Subscription</span>
            </div>
            <span className="setting-value gold">Premium</span>
          </div>

          <Link to="/settings" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="setting-card" style={{ cursor: 'pointer' }}>
              <div className="setting-info">
                <span className="setting-label">Settings</span>
              </div>
              <ChevronRight size={20} color="var(--text-muted)" />
            </div>
          </Link>

          <Link to="/payment-history" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="setting-card" style={{ cursor: 'pointer' }}>
              <div className="setting-info">
                <span className="setting-label">Payment History</span>
              </div>
              <ChevronRight size={20} color="var(--text-muted)" />
            </div>
          </Link>

          <Link to="/device-management" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="setting-card" style={{ cursor: 'pointer' }}>
              <div className="setting-info">
                <span className="setting-label">Device Management</span>
              </div>
              <ChevronRight size={20} color="var(--text-muted)" />
            </div>
          </Link>

          <div className="setting-card" style={{ cursor: 'pointer' }}>
            <div className="setting-info">
              <span className="setting-label">Email</span>
              <span className="setting-value">n.johnson@example.com</span>
            </div>
            <ChevronRight size={20} color="var(--text-muted)" />
          </div>

          <div className="setting-card">
            <div className="setting-info">
              <span className="setting-label">Password</span>
              <span className="setting-value pwd-dots">••••••••</span>
            </div>
            <Button variant="pill" onClick={() => alert('Change password dialog opened.')}>Change</Button>
          </div>

          <div className="setting-card">
            <div className="setting-info">
              <span className="setting-label">Parental Controls</span>
            </div>
            <div className="toggle-container">
              <span className="setting-value">{parentalControls ? 'On' : 'Off'}</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={parentalControls}
                  onChange={(e) => setParentalControls(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
            <Button
              variant="outline"
              className="edit-profile-btn"
              style={{ padding: '16px', flex: 1 }}
              onClick={() => alert('Edit profile dialog opened.')}
            >
              EDIT PROFILE
            </Button>

            <Button
              variant="outline"
              className="sign-out-btn"
              style={{ padding: '16px', flex: 1 }}
              onClick={() => {
                // Mock sign out logic
                window.location.href = '/login';
              }}
            >
              SIGN OUT
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
}
