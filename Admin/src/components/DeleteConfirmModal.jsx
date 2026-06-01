import React from 'react';

export default function DeleteConfirmModal({
  userToDelete,
  setShowDeleteModal,
  handleDeleteConfirm,
  actionLoading,
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: '#18181C',
        border: '1px solid rgba(231,76,60,0.30)',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: "'Outfit', 'Inter', sans-serif"
      }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
        <h3 style={{ fontSize: '18px', color: '#F5F5F0', marginBottom: '8px', fontWeight: '700' }}>
          Delete User?
        </h3>
        <p style={{ fontSize: '13px', color: '#A0A0A8', marginBottom: '4px' }}>
          You are about to permanently delete:
        </p>
        <p style={{ fontSize: '15px', color: '#E74C3C', fontWeight: '600', marginBottom: '16px' }}>
          {userToDelete?.name} ({userToDelete?.email})
        </p>
        <p style={{ fontSize: '12px', color: '#606068', marginBottom: '24px', lineHeight: '1.5' }}>
          This will also delete all their payment history and 
          device records. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowDeleteModal(false)}
            style={{
              flex: 1, padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.05)',
              color: '#A0A0A8', cursor: 'pointer',
              fontSize: '14px', fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteConfirm}
            disabled={actionLoading}
            style={{
              flex: 1, padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: '#E74C3C',
              color: 'white', cursor: 'pointer',
              fontSize: '14px', fontWeight: '700',
              boxShadow: '0 4px 12px rgba(231,76,60,0.2)',
              transition: 'all 0.2s',
              opacity: actionLoading ? 0.6 : 1
            }}
          >
            {actionLoading ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
