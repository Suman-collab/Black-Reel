import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Tv, 
  Smartphone, 
  Laptop, 
  Tablet, 
  Monitor, 
  AlertTriangle, 
  X, 
  Check, 
  CreditCard 
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { toast } from '../lib/toast';
import './DeviceLimitModal.css';

const getPlatformIcon = (type = '') => {
  const t = String(type).toLowerCase();
  if (t === 'tv') return <Tv size={22} />;
  if (t === 'phone' || t === 'mobile') return <Smartphone size={22} />;
  if (t === 'laptop' || t === 'desktop') return <Laptop size={22} />;
  if (t === 'tablet') return <Tablet size={22} />;
  return <Monitor size={22} />;
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Last active: Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  
  if (diffMs < 60000) return 'Active now';
  
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `Active ${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Active ${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Active yesterday';
  return `Active ${diffDays} days ago`;
};

export default function DeviceLimitModal() {
  const { deviceLimitInfo, dismissDeviceLimit, swapDevice } = useAuth();
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [swapping, setSwapping] = useState(false);
  const navigate = useNavigate();

  if (!deviceLimitInfo) return null;

  const { message, data } = deviceLimitInfo;
  const maxDevices = data?.maxDevices ?? '—';
  const planId     = data?.planId     ?? 'current';
  const devices    = data?.devices    ?? [];

  const handleSwap = async () => {
    if (!selectedDeviceId) {
      toast.warning('Please select a device to remove.');
      return;
    }

    setSwapping(true);
    try {
      await swapDevice(selectedDeviceId);
      toast.success('Device replaced successfully. Signed in.');
    } catch (err) {
      toast.error(err.message || 'Failed to replace device.');
    } finally {
      setSwapping(false);
    }
  };

  const handleUpgrade = () => {
    dismissDeviceLimit();
    navigate('/plans');
  };

  return (
    <div className="dlm-overlay" onClick={dismissDeviceLimit}>
      <div className="dlm-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="dlm-close" onClick={dismissDeviceLimit} aria-label="Close">
          <X size={18} />
        </button>

        {/* Warning Indicator */}
        <div className="dlm-icon-wrap">
          <div className="dlm-icon-alert-halo">
            <AlertTriangle size={36} className="dlm-icon-alert" />
          </div>
        </div>

        <h2 className="dlm-title">Device Limit Reached</h2>
        <p className="dlm-message">
          You've reached the maximum number of registered devices allowed on your plan. 
          Remove a device from the list below to sign in on this one.
        </p>

        {/* Info Badge */}
        <div className="dlm-info-badge">
          <CreditCard size={14} />
          <span>
            {planId.toUpperCase()} PLAN LIMIT: <strong>{maxDevices} DEVICE{maxDevices !== 1 ? 'S' : ''}</strong>
          </span>
        </div>

        {/* Device Selection Grid */}
        <div className="dlm-device-list">
          {devices.map((device, index) => {
            const isSelected = selectedDeviceId === device._id;
            return (
              <div 
                key={device._id || index}
                className={`dlm-device-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedDeviceId(device._id)}
              >
                <div className="dlm-device-icon-frame">
                  {getPlatformIcon(device.type)}
                </div>
                
                <div className="dlm-device-info">
                  <div className="dlm-device-name-row">
                    <span className="dlm-device-name">
                      {device.name || `${device.browser} on ${device.os}`}
                    </span>
                    {device.current && (
                      <span className="dlm-current-pill">This Device</span>
                    )}
                  </div>
                  <div className="dlm-device-meta">
                    {device.os} • {device.browser}
                  </div>
                  <div className="dlm-device-active">
                    {formatTimeAgo(device.lastActiveAt)}
                  </div>
                </div>

                {/* Radio selection indicator */}
                <div className="dlm-radio-check">
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions Button Panel */}
        <div className="dlm-actions">
          <button 
            className="ott-btn ott-btn-primary dlm-submit" 
            onClick={handleSwap}
            disabled={swapping || !selectedDeviceId}
          >
            {swapping ? 'Swapping session...' : 'Remove & Continue'}
          </button>
          
          <button className="ott-btn ott-btn-outline" onClick={handleUpgrade}>
            Upgrade Plan
          </button>
        </div>

        <button className="dlm-cancel-link" onClick={dismissDeviceLimit}>
          Cancel Sign In
        </button>
      </div>
    </div>
  );
}
