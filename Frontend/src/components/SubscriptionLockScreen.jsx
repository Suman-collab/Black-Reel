import { Play, Lock, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SubscriptionLockScreen = ({
  content,
  onWatchTrailer,
  backgroundImage,
}) => {
  const navigate = useNavigate();
  const isDummyMode = import.meta.env.VITE_PAYMENT_MODE === 'dummy';

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      aspectRatio: '16 / 9',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Blurred background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: backgroundImage
          ? `url(${backgroundImage})`
          : 'linear-gradient(135deg, #0a0a0e, #1a1a22)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(20px) brightness(0.3)',
        transform: 'scale(1.1)',
      }} />

      {/* Dark overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        padding: '32px',
        textAlign: 'center',
      }}>
        {/* Lock icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(229, 9, 20, 0.15)',
          border: '2px solid rgba(229, 9, 20, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 2s ease infinite',
        }}>
          <Lock size={28} color="#e50914" />
        </div>

        {/* Title */}
        <div>
          <h3 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '700',
            color: '#fff',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}>
            Premium Content
          </h3>
          <p style={{
            margin: '8px 0 0',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.6)',
            maxWidth: '360px',
          }}>
            Subscribe to unlock full access to{' '}
            <strong style={{ color: '#fff' }}>{content?.title || 'this content'}</strong>{' '}
            and thousands of movies & shows.
          </p>
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: '4px',
        }}>
          {/* Watch Trailer */}
          {(content?.trailerUrl || content?.videoUrl) && (
            <button
              onClick={() => onWatchTrailer?.()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              }}
            >
              <Play size={16} fill="#fff" />
              Watch Trailer
            </button>
          )}

          {/* Subscribe Now */}
          <button
            onClick={() => navigate(isDummyMode ? '/plans' : '/subscribe')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #e50914, #b81d24)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(229,9,20,0.3)',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(229,9,20,0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(229,9,20,0.3)';
            }}
          >
            <Crown size={16} />
            Subscribe Now
          </button>

          {/* Upgrade Plan (for existing free users) */}
          <button
            onClick={() => navigate(isDummyMode ? '/plans' : '/subscribe')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid rgba(229,9,20,0.3)',
              background: 'rgba(229,9,20,0.08)',
              color: '#e50914',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(229,9,20,0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(229,9,20,0.08)';
            }}
          >
            Upgrade Plan
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default SubscriptionLockScreen;
