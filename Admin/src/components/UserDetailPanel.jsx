import React from 'react';

const InfoRow = ({ label, value }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    fontSize: '13px'
  }}>
    <span style={{ color: '#606068', fontWeight: '500' }}>{label}</span>
    <span style={{ color: '#F5F5F0', fontWeight: '600' }}>{value || '—'}</span>
  </div>
);

export default function UserDetailPanel({
  user,
  onClose,
  handleStatusChange,
  handleForceRemoveDevice,
  setUserToDelete,
  setShowDeleteModal,
}) {
  if (!user) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Safe checks for arrays
  const watchlistCount = user.watchlistCount || 0;
  const activeDevices = user.activeDevices || [];
  const payments = user.payments || [];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 900,
      display: 'flex',
      justifyContent: 'flex-end',
      fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          transition: 'all 0.3s'
        }}
      />

      {/* Side Panel */}
      <div style={{
        position: 'relative',
        zIndex: 901,
        width: '100%',
        maxWidth: '480px',
        height: '100%',
        background: '#0D0D11',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        {/* A) HEADER — Avatar, name, email, status badge */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Avatar */}
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #E8B84B, #C9962A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', fontWeight: '700', color: '#0D0D0F',
              flexShrink: 0,
              border: '2px solid rgba(232,184,75,0.30)',
              overflow: 'hidden',
            }}>
              {user.avatar 
                ? <img src={user.avatar} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt={user.name} />
                : user.name?.charAt(0).toUpperCase() || 'U'
              }
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#F5F5F0', margin: 0 }}>
                {user.name}
              </h3>
              <p style={{ fontSize: '13px', color: '#606068', margin: '2px 0 0' }}>
                {user.email}
              </p>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                {/* Status badge */}
                <span style={{
                  padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: '700',
                  background: user.status === 'active' ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)',
                  color: user.status === 'active' ? '#2ECC71' : '#E74C3C',
                  border: `1px solid ${user.status === 'active' ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)'}`,
                  textTransform: 'uppercase'
                }}>
                  {user.status}
                </span>
                {/* Plan badge */}
                <span style={{
                  padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: '700',
                  background: 'rgba(232,184,75,0.1)',
                  color: '#E8B84B',
                  border: '1px solid rgba(232,184,75,0.2)',
                  textTransform: 'uppercase'
                }}>
                  {user.subscription?.plan || 'free'}
                </span>
                {/* Role badge */}
                <span style={{
                  padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: '700',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#A0A0A8',
                  border: '1px solid rgba(255,255,255,0.1)',
                  textTransform: 'uppercase'
                }}>
                  {user.role}
                </span>
              </div>
            </div>
            {/* Close button */}
            <button 
              onClick={onClose} 
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#A0A0A8',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                transition: 'all 0.2s'
              }}
            >
              <i className="ti ti-x" />
            </button>
          </div>
        </div>

        {/* B) INFO GRID — Key account data */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h4 style={{ fontSize: '11px', fontWeight: '700', color: '#606068', 
                       letterSpacing: '0.10em', textTransform: 'uppercase',
                       marginBottom: '12px', margin: '0 0 12px 0' }}>
            Account Info
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'User ID',      value: user._id?.slice(-8) },
              { label: 'Joined',       value: formatDate(user.createdAt) },
              { label: 'Last Login',   value: formatDate(user.lastLogin) || 'Never' },
              { label: 'Auth Method',  value: user.googleId ? 'Google' : 'Email' },
              { label: 'Verified',     value: user.emailVerified ? 'Yes' : 'No' },
              { label: 'Watchlist',    value: `${watchlistCount} items` },
            ].map(item => (
              <div key={item.label} style={{
                background: '#141416',
                borderRadius: '8px',
                padding: '10px 12px',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ fontSize: '10px', color: '#606068', 
                             textTransform: 'uppercase', letterSpacing: '0.08em',
                             marginBottom: '4px', fontWeight: '600' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '13px', color: '#F5F5F0', fontWeight: '500' }}>
                  {item.value || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* C) SUBSCRIPTION SECTION */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h4 style={{ 
            fontSize: '11px', fontWeight: '700', color: '#606068', 
            letterSpacing: '0.10em', textTransform: 'uppercase',
            margin: '0 0 12px 0' 
          }}>Subscription</h4>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <InfoRow label="Plan"       value={user.subscription?.plan || 'Free'} />
            <InfoRow label="Status"     value={user.subscription?.status || 'Inactive'} />
            <InfoRow label="Start Date" value={formatDate(user.subscription?.startedAt)} />
            <InfoRow label="Renewal Date"   value={formatDate(user.subscription?.renewalDate)} />
          </div>
        </div>

        {/* D) ACTIVE DEVICES SECTION */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h4 style={{ 
            fontSize: '11px', fontWeight: '700', color: '#606068', 
            letterSpacing: '0.10em', textTransform: 'uppercase',
            margin: '0 0 12px 0'
          }}>
            Active Devices ({activeDevices.filter(d => d.current || d.isActive).length} / {user.currentPlanLimits?.maxDevices || 1})
          </h4>

          {activeDevices.length === 0 ? (
            <p style={{ color: '#606068', fontSize: '13px', margin: 0 }}>No active devices</p>
          ) : (
            activeDevices.map(device => (
              <div key={device._id || device.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: '#141416',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className={`ti ti-${
                    device.type === 'phone'    ? 'device-mobile'  :
                    device.type === 'tablet'   ? 'device-tablet'  :
                    device.type === 'tv'       ? 'device-tv'      :
                    'device-laptop'
                  }`} style={{ fontSize: '18px', color: '#A0A0A8' }} />
                  <div>
                    <div style={{ fontSize: '13px', color: '#F5F5F0', fontWeight: '500' }}>
                      {device.name} {device.current && <span style={{ color: '#2ECC71', fontSize: '10px', marginLeft: '6px' }}>● active</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: '#606068', marginTop: '2px' }}>
                      {device.location} · Last: {formatDate(device.lastActiveAt)}
                    </div>
                  </div>
                </div>
                {/* Force sign out button */}
                <button
                  onClick={() => handleForceRemoveDevice(user._id, device._id || device.id)}
                  title="Force sign out this device"
                  disabled={device.current}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: device.current ? 'rgba(255,255,255,0.02)' : 'rgba(231,76,60,0.10)',
                    border: `1px solid ${device.current ? 'rgba(255,255,255,0.04)' : 'rgba(231,76,60,0.25)'}`,
                    color: device.current ? '#404040' : '#E74C3C',
                    cursor: device.current ? 'not-allowed' : 'pointer',
                    fontSize: '11px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                >
                  Sign Out
                </button>
              </div>
            ))
          )}
        </div>

        {/* E) PAYMENT HISTORY SECTION */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flex: 1 }}>
          <h4 style={{ 
            fontSize: '11px', fontWeight: '700', color: '#606068', 
            letterSpacing: '0.10em', textTransform: 'uppercase',
            margin: '0 0 12px 0'
          }}>Payment History</h4>
          
          {payments.length === 0 ? (
            <p style={{ color: '#606068', fontSize: '13px', margin: 0 }}>No payments yet</p>
          ) : (
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ color: '#606068', textAlign: 'left', padding: '6px 0', fontWeight: '600' }}>Date</th>
                  <th style={{ color: '#606068', textAlign: 'left', padding: '6px 0', fontWeight: '600' }}>Plan</th>
                  <th style={{ color: '#606068', textAlign: 'right', padding: '6px 0', fontWeight: '600' }}>Amount</th>
                  <th style={{ color: '#606068', textAlign: 'right', padding: '6px 0', fontWeight: '600' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '8px 0', color: '#A0A0A8' }}>
                      {formatDate(payment.paidAt || payment.createdAt)}
                    </td>
                    <td style={{ padding: '8px 0', color: '#F5F5F0' }}>
                      {payment.planName || payment.planType}
                    </td>
                    <td style={{ padding: '8px 0', color: '#F5F5F0', textAlign: 'right' }}>
                      ₹{payment.amount}
                    </td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '10px',
                        fontWeight: '700',
                        background: payment.status === 'success' || payment.status === 'completed'
                          ? 'rgba(46,204,113,0.12)'
                          : 'rgba(231,76,60,0.12)',
                        color: payment.status === 'success' || payment.status === 'completed' ? '#2ECC71' : '#E74C3C',
                        border: `1px solid ${payment.status === 'success' || payment.status === 'completed'
                          ? 'rgba(46,204,113,0.25)'
                          : 'rgba(231,76,60,0.25)'}`,
                        textTransform: 'uppercase'
                      }}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* F) ADMIN ACTIONS FOOTER IN PANEL */}
        <div style={{ 
          padding: '1.5rem', 
          display: 'flex', 
          gap: '10px', 
          flexWrap: 'wrap',
          background: '#08080A',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          position: 'sticky',
          bottom: 0
        }}>
          {/* Suspend toggle */}
          <button
            onClick={() => handleStatusChange(
              user._id,
              user.status === 'active' ? 'suspended' : 'active'
            )}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${user.status === 'active'
                ? 'rgba(231,76,60,0.30)'
                : 'rgba(46,204,113,0.30)'}`,
              background: user.status === 'active'
                ? 'rgba(231,76,60,0.10)'
                : 'rgba(46,204,113,0.10)',
              color: user.status === 'active' ? '#E74C3C' : '#2ECC71',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            {user.status === 'active' ? '🚫 Suspend User' : '✓ Activate User'}
          </button>

          {/* Delete user */}
          <button
            onClick={() => {
              setUserToDelete(user);
              setShowDeleteModal(true);
            }}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(231,76,60,0.30)',
              background: 'rgba(231,76,60,0.10)',
              color: '#E74C3C',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            🗑 Delete User
          </button>
        </div>

      </div>
    </div>
  );
}
