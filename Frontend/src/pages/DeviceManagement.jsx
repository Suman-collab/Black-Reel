import React, { useEffect, useState, useCallback } from 'react';
import {
  Smartphone, Laptop, TabletSmartphone, Tv, Monitor,
  Trash2, LogOut, RefreshCw, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import StatePanel from '../components/StatePanel';
import { getDevices, removeDevice, signOutAllDevices } from '../features/user/user.service';
import { useNavigate } from 'react-router-dom';
import './DeviceManagement.css';

const DEVICE_ICONS = {
  phone:   <Smartphone   size={28} strokeWidth={1.5} />,
  laptop:  <Laptop       size={28} strokeWidth={1.5} />,
  tablet:  <TabletSmartphone size={28} strokeWidth={1.5} />,
  tv:      <Tv           size={28} strokeWidth={1.5} />,
  browser: <Monitor      size={28} strokeWidth={1.5} />,
};

const getDeviceIcon = (type) => DEVICE_ICONS[type] || DEVICE_ICONS.browser;

const timeAgo = (date) => {
  if (!date) return 'Unknown';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2)   return 'Active now';
  if (mins < 60)  return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export default function DeviceManagement() {
  const [devices,    setDevices]    = useState([]);
  const [maxDevices, setMaxDevices] = useState(null);
  const [planId,     setPlanId]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [removing,   setRemoving]   = useState(null); 
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();

  const loadDevices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getDevices();
      setDevices(result.devices   || []);
      setMaxDevices(result.maxDevices ?? null);
      setPlanId(result.planId     || '');
    } catch (err) {
      setError(err.message || 'Could not load devices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDevices(); }, [loadDevices]);

  const handleRemove = async (deviceId) => {
    setRemoving(deviceId);
    setError('');
    try {
      await removeDevice(deviceId);
      setDevices(prev => prev.filter(d => (d._id || d.id) !== deviceId));
    } catch (err) {
      setError(err.message || 'Could not remove device.');
    } finally {
      setRemoving(null);
    }
  };

  const handleSignOutAll = async () => {
    if (!window.confirm('Sign out from ALL devices? You will need to log in again.')) return;
    setSigningOut(true);
    setError('');
    try {
      await signOutAllDevices();
      
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Could not sign out all devices.');
      setSigningOut(false);
    }
  };

  if (loading) {
    return <StatePanel title="Loading devices" message="Checking devices signed into your account…" />;
  }

  const usedSlots = devices.length;
  const pctUsed   = maxDevices ? Math.round((usedSlots / maxDevices) * 100) : 0;

  return (
    <div className="dm-page container">
      {}
      <div className="dm-header">
        <div className="dm-header-left">
          <ShieldCheck size={28} className="dm-header-icon" />
          <div>
            <h1 className="dm-title">Device Management</h1>
            <p className="dm-subtitle">Manage the devices signed into your Black Reel account</p>
          </div>
        </div>
        <button
          className="dm-btn dm-btn-refresh"
          onClick={loadDevices}
          disabled={loading}
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? 'dm-spin' : ''} />
          Refresh
        </button>
      </div>

      {}
      {maxDevices !== null && (
        <div className="dm-quota-card">
          <div className="dm-quota-info">
            <span className="dm-quota-label">
              Devices used <span className="dm-quota-count">{usedSlots} / {maxDevices}</span>
            </span>
            <span className="dm-plan-badge">{planId || 'free'} plan</span>
          </div>
          <div className="dm-quota-bar">
            <div
              className={`dm-quota-fill ${usedSlots >= maxDevices ? 'dm-quota-full' : ''}`}
              style={{ width: `${Math.min(pctUsed, 100)}%` }}
            />
          </div>
          {usedSlots >= maxDevices && (
            <p className="dm-quota-warning">
              <AlertTriangle size={14} /> Device limit reached.{' '}
              <button className="dm-link" onClick={() => navigate('/plans')}>Upgrade your plan</button>{' '}
              for more devices.
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="dm-error">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Device list */}
      {devices.length === 0 ? (
        <div className="dm-empty">
          <Monitor size={48} className="dm-empty-icon" />
          <p>No devices found. Sign in from a device to see it here.</p>
        </div>
      ) : (
        <div className="dm-list">
          {devices.map((device) => {
            const id = device._id || device.id;
            return (
              <div key={id} className={`dm-item ${device.current ? 'dm-item-current' : ''}`}>
                <div className={`dm-device-icon dm-icon-${device.type || 'browser'}`}>
                  {getDeviceIcon(device.type)}
                </div>
                <div className="dm-device-info">
                  <div className="dm-device-name-row">
                    <h3 className="dm-device-name">{device.name}</h3>
                    {device.current && <span className="dm-current-badge">This device</span>}
                  </div>
                  <p className="dm-device-meta">
                    {device.os}{device.location && device.location !== 'Web session' ? ` · ${device.location}` : ''}
                  </p>
                  <p className="dm-device-time">{timeAgo(device.lastActiveAt)}</p>
                </div>
                {!device.current && (
                  <button
                    className="dm-btn dm-btn-remove"
                    onClick={() => handleRemove(id)}
                    disabled={removing === id}
                    title="Remove device"
                  >
                    {removing === id
                      ? <RefreshCw size={16} className="dm-spin" />
                      : <Trash2    size={16} />}
                    <span className="dm-btn-label">Remove</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {}
      {devices.length > 0 && (
        <div className="dm-footer">
          <button
            className="dm-btn dm-btn-signout-all"
            onClick={handleSignOutAll}
            disabled={signingOut}
          >
            <LogOut size={16} />
            {signingOut ? 'Signing out…' : 'Sign out from all devices'}
          </button>
        </div>
      )}
    </div>
  );
}
