import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, X, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import './DeviceLimitModal.css';


export default function DeviceLimitModal() {
  const { deviceLimitInfo, dismissDeviceLimit } = useAuth();
  const navigate = useNavigate();

  if (!deviceLimitInfo) return null;

  const { message, data } = deviceLimitInfo;
  const maxDevices = data?.maxDevices ?? '—';
  const planId     = data?.planId     ?? 'current';

  const handleManageDevices = () => {
    dismissDeviceLimit();
    navigate('/device-management');
  };

  const handleUpgrade = () => {
    dismissDeviceLimit();
    navigate('/plans');
  };

  return (
    <div className="dlm-overlay" onClick={dismissDeviceLimit}>
      <div className="dlm-card" onClick={(e) => e.stopPropagation()}>
        {}
        <button className="dlm-close" onClick={dismissDeviceLimit} aria-label="Close">
          <X size={18} />
        </button>

        {/* Icon + header */}
        <div className="dlm-icon-wrap">
          <AlertTriangle size={32} className="dlm-icon-alert" />
        </div>
        <h2 className="dlm-title">Device Limit Reached</h2>
        <p className="dlm-message">{message}</p>

        {/* Info pill */}
        <div className="dlm-info-pill">
          <Monitor size={16} />
          <span>
            Your <strong>{planId}</strong> plan allows&nbsp;
            <strong>{maxDevices} device{maxDevices !== 1 ? 's' : ''}</strong>
          </span>
        </div>

        {}
        <div className="dlm-actions">
          <button className="dlm-btn dlm-btn-primary" onClick={handleManageDevices}>
            Manage Devices
            <ArrowRight size={16} />
          </button>
          <button className="dlm-btn dlm-btn-secondary" onClick={handleUpgrade}>
            Upgrade Plan
          </button>
        </div>

        <p className="dlm-hint">
          Remove an old device to sign in on this one, or upgrade your plan for more devices.
        </p>
      </div>
    </div>
  );
}
