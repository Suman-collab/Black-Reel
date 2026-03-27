import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Button from '../components/Button';
import StatePanel from '../components/StatePanel';
import { getProfile, updatePreferences } from '../features/user/user.service';
import { useAuth } from '../features/auth/AuthContext';
import './Profile.css';

const formatPlan = (planType) => {
  if (!planType || planType === 'none') {
    return 'Free';
  }

  return `${planType.charAt(0).toUpperCase()}${planType.slice(1)}`;
};

export default function Profile() {
  const { logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [savingPreference, setSavingPreference] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setError('');

      try {
        const user = await getProfile();

        if (isMounted) {
          setProfile(user);
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

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleParentalControlsToggle = async (enabled) => {
    if (!profile) {
      return;
    }

    setSavingPreference(true);

    try {
      const updatedUser = await updatePreferences({ parentalControls: enabled });
      setProfile(updatedUser);
      updateUser(updatedUser);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSavingPreference(false);
    }
  };

  if (loading) {
    return <StatePanel title="Loading your profile" message="Fetching your account, subscription, and preferences." />;
  }

  if (error || !profile) {
    return <StatePanel title="Profile unavailable" message={error || 'Your profile could not be loaded.'} />;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-sidebar">
          <img src={profile.avatarUrl || '/images/avatar.png'} alt={profile.name} className="profile-avatar" />
          <h2 className="profile-name">{profile.name}</h2>
          <p className="profile-email">{profile.email}</p>
          <Button variant="pill" style={{ marginTop: '12px' }} onClick={() => window.location.assign('/settings')}>
            Change Avatar
          </Button>
        </div>

        <div className="profile-settings">
          <div className="setting-card">
            <div className="setting-info">
              <span className="setting-label">Subscription</span>
            </div>
            <span className="setting-value gold">{formatPlan(profile.subscription?.planType)}</span>
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

          <div className="setting-card">
            <div className="setting-info">
              <span className="setting-label">Email</span>
              <span className="setting-value">{profile.email}</span>
            </div>
            <ChevronRight size={20} color="var(--text-muted)" />
          </div>

          <div className="setting-card">
            <div className="setting-info">
              <span className="setting-label">Password</span>
              <span className="setting-value pwd-dots">********</span>
            </div>
            <Button variant="pill" onClick={() => window.location.assign('/settings')}>Manage</Button>
          </div>

          <div className="setting-card">
            <div className="setting-info">
              <span className="setting-label">Parental Controls</span>
            </div>
            <div className="toggle-container">
              <span className="setting-value">{profile.preferences?.parentalControls ? 'On' : 'Off'}</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={Boolean(profile.preferences?.parentalControls)}
                  disabled={savingPreference}
                  onChange={(event) => handleParentalControlsToggle(event.target.checked)}
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
              onClick={() => window.location.assign('/settings')}
            >
              EDIT PROFILE
            </Button>

            <Button
              variant="outline"
              className="sign-out-btn"
              style={{ padding: '16px', flex: 1 }}
              onClick={logout}
            >
              SIGN OUT
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
