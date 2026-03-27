import React, { useEffect, useState } from 'react';
import { Smartphone, Laptop, TabletSmartphone, Tv } from 'lucide-react';
import StatePanel from '../components/StatePanel';
import { getDevices, removeDevice } from '../features/user/user.service';
import './DeviceManagement.css';

export default function DeviceManagement() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadDevices = async () => {
      setLoading(true);
      setError('');

      try {
        const items = await getDevices();

        if (isMounted) {
          setDevices(items);
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

    loadDevices();

    return () => {
      isMounted = false;
    };
  }, []);

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'phone':
        return <Smartphone size={32} color="#fff" strokeWidth={1.5} />;
      case 'laptop':
      case 'browser':
        return <Laptop size={32} color="#fff" strokeWidth={1.5} />;
      case 'tablet':
        return <TabletSmartphone size={32} color="#fff" strokeWidth={1.5} />;
      case 'tv':
        return <Tv size={32} color="#fff" strokeWidth={1.5} />;
      default:
        return <Smartphone size={32} color="#fff" strokeWidth={1.5} />;
    }
  };

  const handleRemove = async (deviceId) => {
    try {
      const updatedDevices = await removeDevice(deviceId);
      setDevices(updatedDevices);
    } catch (apiError) {
      setError(apiError.message);
    }
  };

  if (loading) {
    return <StatePanel title="Loading devices" message="Checking the devices signed into your account." />;
  }

  if (error) {
    return <StatePanel title="Devices unavailable" message={error} />;
  }

  return (
    <div className="device-page container">
      <div className="page-header center">
        <img src="/images/Horizontal%20logo/Black-Shortz.png" alt="Black Shortz Logo" className="logo-header-horizontal mb-4" />
        <h1 className="page-title text-white">Device Management</h1>
      </div>

      <div className="device-list-container">
        {devices.map((device) => (
          <div className="device-item" key={device._id || device.id}>
            <div className="device-icon-container">
              {getDeviceIcon(device.type)}
            </div>
            <div className="device-info">
              <h3 className="device-name">{device.name}</h3>
              <p className="device-meta">{device.location}</p>
              <p className="device-meta">{device.os}</p>
            </div>
            <button className="btn-remove text-gold" onClick={() => handleRemove(device._id || device.id)}>
              REMOVE
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
