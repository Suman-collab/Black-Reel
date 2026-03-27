import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import './Settings.css';
import Button from '../components/Button';
import StatePanel from '../components/StatePanel';
import { getProfile, updatePreferences, updateProfile } from '../features/user/user.service';
import { useAuth } from '../features/auth/AuthContext';

export default function Settings() {
  const { logout, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    avatarUrl: '/images/avatar.png',
    language: 'English (US)',
    notificationsEnabled: true,
    parentalControls: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      setLoading(true);
      setError('');

      try {
        const user = await getProfile();

        if (!isMounted) {
          return;
        }

        setProfile(user);
        setFormState({
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl || '/images/avatar.png',
          language: user.preferences?.language || 'English (US)',
          notificationsEnabled: Boolean(user.preferences?.notificationsEnabled),
          parentalControls: Boolean(user.preferences?.parentalControls),
        });
        updateUser(user);
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

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAvatarSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    if (file.size > 350 * 1024) {
      setError('Please choose an image smaller than 350 KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormState((current) => ({
        ...current,
        avatarUrl: reader.result,
      }));
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const [updatedProfile] = await Promise.all([
        updateProfile({ name: formState.name, email: formState.email, avatarUrl: formState.avatarUrl }),
        updatePreferences({
          language: formState.language,
          notificationsEnabled: formState.notificationsEnabled,
          parentalControls: formState.parentalControls,
        }),
      ]);

      setProfile(updatedProfile);
      updateUser(updatedProfile);
      setSuccess('Settings saved successfully.');
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <StatePanel title="Loading settings" message="Fetching your account details and preferences." />;
  }

  if (error && !profile) {
    return <StatePanel title="Settings unavailable" message={error} />;
  }

  return (
    <div className="settings-page container">
      <div className="page-header center">
        <img src="/images/Vertical%20logo/Black-Shortz.png" alt="Black Shortz Logo" className="logo-header" />
        <h1 className="page-title text-gold uppercase tracking-wider">Settings</h1>
      </div>

      <div className="settings-list-container">
        <div className="settings-item" style={{ display: 'block' }}>
          <div className="settings-item-content">
            <h3>Name</h3>
            <input
              type="text"
              value={formState.name}
              onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
              style={{ width: '100%', marginTop: '10px', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
            />
          </div>
        </div>

        <div className="settings-item" style={{ display: 'block' }}>
          <div className="settings-item-content">
            <h3>Email</h3>
            <input
              type="email"
              value={formState.email}
              onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
              style={{ width: '100%', marginTop: '10px', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
            />
          </div>
        </div>

        <div className="settings-item" style={{ display: 'block' }}>
          <div className="settings-item-content">
            <h3>Avatar</h3>
            <div style={{ display: 'flex', gap: '16px', marginTop: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
              <img
                src={formState.avatarUrl || '/images/avatar.png'}
                alt={formState.name || 'Profile avatar'}
                style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #333' }}
              />
              <div style={{ flex: 1, minWidth: '240px' }}>
                <input
                  type="url"
                  value={formState.avatarUrl}
                  onChange={(event) => setFormState((current) => ({ ...current, avatarUrl: event.target.value }))}
                  placeholder="Paste an image URL"
                  style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '8px', marginBottom: '10px' }}
                />
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px 14px',
                      borderRadius: '999px',
                      border: '1px solid #444',
                      cursor: 'pointer',
                      color: '#fff',
                    }}
                  >
                    Upload New Image
                    <input type="file" accept="image/*" onChange={handleAvatarSelect} style={{ display: 'none' }} />
                  </label>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setFormState((current) => ({ ...current, avatarUrl: '/images/avatar.png' }))}
                  >
                    Reset Default
                  </button>
                </div>
                <p style={{ margin: '10px 0 0', color: '#888', fontSize: '0.85rem' }}>
                  Use an image URL or upload JPG, PNG, or WebP up to 350 KB.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-content">
            <h3>Notifications</h3>
            <p>New episodes, promos & updates</p>
          </div>
          <div
            className={`custom-toggle ${formState.notificationsEnabled ? 'active' : ''}`}
            onClick={() => setFormState((current) => ({ ...current, notificationsEnabled: !current.notificationsEnabled }))}
          >
            <div className="toggle-circle"></div>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-content">
            <h3>Parental Controls</h3>
            <p>Restrict mature content on this profile</p>
          </div>
          <div
            className={`custom-toggle ${formState.parentalControls ? 'active' : ''}`}
            onClick={() => setFormState((current) => ({ ...current, parentalControls: !current.parentalControls }))}
          >
            <div className="toggle-circle"></div>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-content">
            <h3>Language</h3>
          </div>
          <div className="settings-item-action">
            <select
              value={formState.language}
              onChange={(event) => setFormState((current) => ({ ...current, language: event.target.value }))}
              style={{ padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
            >
              <option>English (US)</option>
              <option>English (UK)</option>
              <option>Spanish</option>
            </select>
            <ChevronRight size={20} className="text-muted" />
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-content">
            <h3>Subscription</h3>
            <p>{profile?.subscription?.planType === 'none' ? 'No active plan' : `${profile.subscription.planType} plan`}</p>
          </div>
          <div className="settings-item-action">
            <span className="text-muted">{profile?.subscription?.status || 'inactive'}</span>
            <ChevronRight size={20} className="text-muted" />
          </div>
        </div>

        {error ? <p style={{ color: '#ffb3b3' }}>{error}</p> : null}
        {success ? <p style={{ color: '#9fe870' }}>{success}</p> : null}

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button variant="outline" onClick={logout}>Log Out</Button>
        </div>
      </div>
    </div>
  );
}
