import React from 'react';
import { Smartphone, Laptop, TabletSmartphone, Tv } from 'lucide-react';
import './DeviceManagement.css';

export default function DeviceManagement() {
  const devices = [
    { id: 1, name: "John's iPhone", location: 'Oakland, CA', os: 'iOS 17.4', type: 'phone', current: true },
    { id: 2, name: "Dinner's MacBook Pro", location: 'Los Angeles, CA', os: 'macOS Ventura 13', type: 'laptop' },
    { id: 3, name: "Joy Sliderdroid", location: 'San Antonio, TX', os: 'Android 14', type: 'android' },
    { id: 4, name: "Living Room TV", location: 'Atlanta, GA', os: 'Smart TV', type: 'tv' },
  ];

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'phone': return <Smartphone size={32} color="#fff" strokeWidth={1.5} />;
      case 'laptop': return <Laptop size={32} color="#fff" strokeWidth={1.5} />;
      case 'android': return <TabletSmartphone size={32} color="#fff" strokeWidth={1.5} />;
      case 'tv': return <Tv size={32} color="#fff" strokeWidth={1.5} />;
      default: return <Smartphone size={32} color="#fff" strokeWidth={1.5} />;
    }
  };

  const handleRemove = (id) => {
    alert(`Remove device ${id} dialog opened.`);
  };

  return (
    <div className="device-page container">
      <div className="page-header center">
        <img src="/images/Horizontal%20logo/Black-Shortz.png" alt="Black Shortz Logo" className="logo-header-horizontal mb-4" />
        <h1 className="page-title text-white">Device Managemennt</h1>
      </div>

      <div className="device-list-container">
        {devices.map((device) => (
          <div className="device-item" key={device.id}>
            <div className="device-icon-container">
              {getDeviceIcon(device.type)}
            </div>
            <div className="device-info">
              <h3 className="device-name">{device.name}</h3>
              <p className="device-meta">{device.location}</p>
              <p className="device-meta">{device.os}</p>
            </div>
            <button className="btn-remove text-gold" onClick={() => handleRemove(device.id)}>
              REMOVE
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
