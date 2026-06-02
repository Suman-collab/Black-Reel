import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Crown, 
  LogOut, 
  Smartphone, 
  History, 
  Settings, 
  Shield, 
  Heart, 
  Download, 
  HelpCircle, 
  Camera, 
  User, 
  Clock, 
  Flame, 
  BarChart3, 
  Play, 
  Sparkles, 
  AlertTriangle,
  Tv,
  Eye,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '../components/Button';
import PlanSelectorModal from '../components/PlanSelectorModal';
import StatePanel from '../components/StatePanel';
import { getProfile, updatePreferences, uploadAvatar, getWatchlist } from '../features/user/user.service';
import { getPaymentHistory } from '../features/payments/payment.service';
import { useAuth } from '../features/auth/AuthContext';
import { PARENTAL_CONTROLS_DESCRIPTION } from '../lib/contentAccess';
import {
  formatPlanName,
  getSubscriptionStatusMessage,
  hasActiveSubscription,
} from '../lib/subscription';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { logout, updateUser, user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [lastPaymentMethod, setLastPaymentMethod] = useState('');
  const [savingPreference, setSavingPreference] = useState(false);
  const [planSelectorOpen, setPlanSelectorOpen] = useState(false);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Load profile, watchlist length, and payment history in parallel
  useEffect(() => {
    let isMounted = true;

    const loadProfileData = async () => {
      setLoading(true);
      setError('');

      try {
        const [userProfile, paymentHistory, watchlist] = await Promise.all([
          getProfile(),
          getPaymentHistory().catch(() => []),
          getWatchlist().catch(() => [])
        ]);

        if (isMounted) {
          setProfile(userProfile);
          updateUser(userProfile);
          setWatchlistCount(watchlist?.length || 0);
          setLastPaymentMethod(paymentHistory?.[0]?.paymentMethod || '');
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

    loadProfileData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize state with AuthContext updates
  useEffect(() => {
    if (!user) return;
    setProfile((current) => (current ? { ...current, ...user } : user));
  }, [user]);

  // Handle avatar upload click trigger
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Process selected avatar image file
  const handleAvatarSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const avatarDataUrl = reader.result;
      if (typeof avatarDataUrl !== 'string') return;

      setAvatarUploading(false);
      const uploadPromise = uploadAvatar(avatarDataUrl);

      toast.promise(uploadPromise, {
        pending: 'Uploading avatar to Black Reel...',
        success: 'Profile avatar successfully updated!',
        error: 'Failed to upload avatar image.'
      });

      try {
        const updatedUser = await uploadPromise;
        setProfile(updatedUser);
        updateUser(updatedUser);
      } catch (err) {
        console.error('[Profile] Avatar upload failed:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  // Toggle Parental Controls Setting
  const handleParentalControlsToggle = async (enabled) => {
    if (!profile) return;
    setSavingPreference(true);

    try {
      const updatedUser = await updatePreferences({ parentalControls: enabled });
      setProfile(updatedUser);
      updateUser(updatedUser);
      toast.success(
        enabled 
          ? 'Parental restrictions activated successfully.' 
          : 'Parental controls deactivated successfully.'
      );
    } catch (apiError) {
      setError(apiError.message);
      toast.error('Failed to update parental controls.');
    } finally {
      setSavingPreference(false);
    }
  };

  if (loading) {
    return <StatePanel title="Loading account hub" message="Preparing your cinematic profile and active streaming plans..." />;
  }

  if (error || !profile) {
    return <StatePanel title="Profile hub unavailable" message={error || 'Your profile could not be loaded.'} />;
  }

  const subscriptionIsActive = hasActiveSubscription(profile.subscription);
  const parentalControlsEnabled = Boolean(profile.preferences?.parentalControls);
  const isDummyMode = import.meta.env.VITE_PAYMENT_MODE === 'dummy';

  const handlePlanSelection = (planType) => {
    setPlanSelectorOpen(false);
    if (subscriptionIsActive && profile.subscription?.planType === planType) {
      navigate('/subscribe');
      return;
    }
    navigate(`/checkout?plan=${planType}`);
  };

  const planName = profile?.subscription?.planType || profile?.subscription?.plan || 'Free Tier';
  
  let joinDate = '2025';
  try {
    if (profile?.createdAt) {
      const parsedDate = new Date(profile.createdAt);
      if (!isNaN(parsedDate.getTime())) {
        joinDate = parsedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      }
    }
  } catch (e) {
    console.error('Error formatting join date:', e);
  }

  let renewalDateText = 'No active plan';
  try {
    if (profile?.subscription?.renewalDate) {
      const parsedDate = new Date(profile.subscription.renewalDate);
      if (!isNaN(parsedDate.getTime())) {
        renewalDateText = `Renews on ${parsedDate.toLocaleDateString()}`;
      } else if (subscriptionIsActive) {
        renewalDateText = 'Membership is active';
      }
    } else if (subscriptionIsActive) {
      renewalDateText = 'Membership is active';
    }
  } catch (e) {
    console.error('Error formatting renewal date:', e);
    if (subscriptionIsActive) {
      renewalDateText = 'Membership is active';
    }
  }

  // Mock stats
  const moviesWatchedCount = 42;
  const hoursStreamedCount = 118.5;
  const favGenre = 'Action & Sci-Fi';

  // Mock cinematic history entries based on actual movies database titles
  const mockRecentActivity = [
    { id: 1, title: 'Brothas in Arms', progress: 65, durationLeft: '42 mins left', type: 'Movie', genre: 'Action', image: '/images/fandom/Poster 1 - 150x200.jpg.jpeg' },
    { id: 2, title: 'Kinky', progress: 92, durationLeft: '5 mins left', type: 'Series', genre: 'Thriller', image: '/images/fandom/Poster 2 - 150x200.jpg.jpeg' },
    { id: 3, title: 'Burden', progress: 35, durationLeft: '1 hr 18m left', type: 'Movie', genre: 'Mystery', image: '/images/fandom/Poster 3 - 150x200.jpg.jpeg' },
    { id: 5, title: 'Blood Sisters', progress: 10, durationLeft: '50 mins left', type: 'Series', genre: 'Comedy', image: '/images/fandom/Poster 5 - 150x200.jpg.jpeg' }
  ];

  // Quick actions mapping
  const quickActions = [
    { icon: <Settings size={22} className="text-gold" />, title: 'Settings', desc: 'Manage password, email, and preferences', path: '/settings' },
    { icon: <History size={22} className="text-gold" />, title: 'Payment History', desc: 'View past invoices and billing logs', path: '/payment-history' },
    { icon: <Smartphone size={22} className="text-gold" />, title: 'Devices', desc: 'Manage logged-in devices and sessions', path: '/device-management' },
    { icon: <Heart size={22} className="text-gold" />, title: 'Watchlist', desc: 'Browse and edit your saved movie list', path: '/watchlist' },
    { icon: <Download size={22} className="text-gold" />, title: 'Offline Downloads', desc: 'Access offline content configurations', path: '#' },
    { icon: <Shield size={22} className="text-gold" />, title: 'Parental Controls', desc: 'Filter content restrictions and safety pins', path: '#parental-controls' },
    { icon: <Lock size={22} className="text-gold" />, title: 'Security', desc: 'Audit access authorization and active keys', path: '/settings' },
    { icon: <Activity size={22} className="text-gold" />, title: 'Notifications', desc: 'Modify notification preferences and alerts', path: '/settings' }
  ];

  return (
    <>
      <div className="ott-account-page">
        <div className="ott-account-container">
          
          {/* SECTION 1: Premium Left Profile Sidebar */}
          <aside className="ott-profile-sidebar animate-fadeInUp" style={{ '--delay': 1 }}>
            
            {/* Avatar block with Glowing pulse ring */}
            <div className="ott-avatar-wrapper">
              <div className="ott-avatar-glowing-ring"></div>
              <img 
                src={profile.avatarUrl || '/images/avatar.png'} 
                alt={profile.name} 
                className="ott-avatar-image" 
              />
              <button 
                type="button" 
                className="ott-avatar-edit-overlay" 
                onClick={triggerFileInput}
                aria-label="Upload profile image"
              >
                <Camera size={26} color="#FFF" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*" 
                onChange={handleAvatarSelect} 
              />
            </div>

            {/* Profile Info block */}
            <div className="ott-profile-meta">
              <h2 className="ott-profile-name">{profile.name}</h2>
              <span className="ott-membership-badge">
                <Sparkles size={12} className="inline mr-1" />
                Premium Member
              </span>
              <p className="ott-profile-email">{profile.email}</p>
              <span className="ott-join-date">Joined {joinDate}</span>
              
              <div className={`ott-status-indicator ${subscriptionIsActive ? 'active' : 'inactive'}`}>
                <span className="indicator-dot"></span>
                {subscriptionIsActive ? 'Active Subscription' : 'Inactive Account'}
              </div>
            </div>

            {/* Navigation Panels for Desktop Scroll Anchoring */}
            <nav className="ott-sidebar-nav">
              <button 
                className={`ott-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => { setActiveTab('overview'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                <User size={16} />
                <span>Account Overview</span>
              </button>
              <button 
                className={`ott-nav-item ${activeTab === 'subscription' ? 'active' : ''}`}
                onClick={() => { setActiveTab('subscription'); document.getElementById('subscription-highlight').scrollIntoView({ behavior: 'smooth' }); }}
              >
                <Crown size={16} />
                <span>Membership Details</span>
              </button>
              <button 
                className={`ott-nav-item ${activeTab === 'insights' ? 'active' : ''}`}
                onClick={() => { setActiveTab('insights'); document.getElementById('insights-dashboard').scrollIntoView({ behavior: 'smooth' }); }}
              >
                <BarChart3 size={16} />
                <span>Streaming Insights</span>
              </button>
              <button 
                className={`ott-nav-item ${activeTab === 'actions' ? 'active' : ''}`}
                onClick={() => { setActiveTab('actions'); document.getElementById('quick-actions').scrollIntoView({ behavior: 'smooth' }); }}
              >
                <Settings size={16} />
                <span>Quick Actions Hub</span>
              </button>
            </nav>

            {/* Desktop Sidebar Buttons */}
            <div className="ott-sidebar-actions">
              <Button variant="outline" className="ott-sidebar-btn" onClick={() => navigate('/settings')}>
                Edit Profile
              </Button>
              <Button variant="outline" className="ott-sidebar-btn-danger" onClick={logout}>
                <LogOut size={16} />
                Sign Out
              </Button>
            </div>
          </aside>

          {/* RIGHT COLUMN: Dashboard Hub */}
          <main className="ott-dashboard-hub">
            
            {/* Welcoming Banner header */}
            <header className="ott-hub-header animate-fadeInUp" style={{ '--delay': 2 }}>
              <div className="welcome-text">
                <h1>Welcome Back, <span className="gradient-gold-text">{profile.name}</span>!</h1>
                <p>Manage your billing, active streaming nodes, and account controls.</p>
              </div>
            </header>

            {/* SECTION 2: Subscription Highlight Card */}
            <section 
              id="subscription-highlight" 
              className="ott-section subscription-section animate-fadeInUp" 
              style={{ '--delay': 3 }}
            >
              <div className="ott-premium-crown-card">
                <div className="crown-card-backdrop"></div>
                <div className="crown-card-glow"></div>
                
                <div className="crown-header">
                  <div className="crown-icon-wrapper">
                    <Crown size={32} className="text-gold" />
                  </div>
                  <div className="crown-title-block">
                    <div className="crown-label">CURRENT MEMBERSHIP</div>
                    <h2 className="crown-tier-name">{formatPlanName(planName)} Plan</h2>
                  </div>
                  <span className={`status-badge-pill ${subscriptionIsActive ? 'active' : 'inactive'}`}>
                    {subscriptionIsActive ? 'Active Plan' : 'Suspended'}
                  </span>
                </div>

                <div className="crown-benefits-grid">
                  <div className="benefit-item">
                    <span className="benefit-label">Streaming Quality</span>
                    <span className="benefit-value">Ultra HD 4K + HDR</span>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-label">Device Limit</span>
                    <span className="benefit-value">Up to 4 concurrent screens</span>
                  </div>
                  <span className="divider-vert"></span>
                  <div className="benefit-item">
                    <span className="benefit-label">Offline Downloads</span>
                    <span className="benefit-value">Supported</span>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-label">Billing Date</span>
                    <span className="benefit-value">
                      {renewalDateText}
                    </span>
                  </div>
                </div>

                <div className="crown-actions">
                  <div className="payment-method-badge">
                    <span>Payment Method: {lastPaymentMethod || 'Visa ending in 4242'}</span>
                  </div>
                  <div className="crown-btn-group">
                    <Button 
                      variant="pill" 
                      className="ott-btn-gold" 
                      onClick={() => navigate(isDummyMode ? '/plans' : '/subscribe')}
                    >
                      <Sparkles size={16} />
                      Upgrade Plan
                    </Button>
                    <Button 
                      variant="outline" 
                      className="ott-btn-glass"
                      onClick={() => navigate('/subscribe')}
                    >
                      Compare Plans
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 4: Account Statistics Dashboard */}
            <section 
              id="insights-dashboard" 
              className="ott-section stats-section animate-fadeInUp" 
              style={{ '--delay': 4 }}
            >
              <h3 className="section-title">
                <BarChart3 size={20} className="text-gold" />
                Streaming Insights & Statistics
              </h3>
              
              <div className="stats-grid">
                
                <div className="stat-card">
                  <div className="stat-glow red"></div>
                  <div className="stat-icon-box">
                    <Flame size={20} color="#ff6b6b" />
                  </div>
                  <div className="stat-details">
                    <span className="stat-value">{moviesWatchedCount}</span>
                    <span className="stat-label">Titles Streamed</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-glow gold"></div>
                  <div className="stat-icon-box">
                    <Clock size={20} color="var(--gold-primary)" />
                  </div>
                  <div className="stat-details">
                    <span className="stat-value">{hoursStreamedCount} hrs</span>
                    <span className="stat-label">Hours Streamed</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-glow green"></div>
                  <div className="stat-icon-box">
                    <Heart size={20} color="#10b981" />
                  </div>
                  <div className="stat-details">
                    <span className="stat-value">{watchlistCount}</span>
                    <span className="stat-label">In Watchlist</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-glow purple"></div>
                  <div className="stat-icon-box">
                    <Eye size={20} color="#a855f7" />
                  </div>
                  <div className="stat-details">
                    <span className="stat-value">{favGenre}</span>
                    <span className="stat-label">Favorite Genre</span>
                  </div>
                </div>

              </div>
            </section>

            {/* SECTION 3: Quick Actions Grid */}
            <section 
              id="quick-actions" 
              className="ott-section actions-section animate-fadeInUp" 
              style={{ '--delay': 5 }}
            >
              <h3 className="section-title">
                <Settings size={20} className="text-gold" />
                Quick Actions Hub
              </h3>

              <div className="quick-actions-grid">
                {quickActions.map((action, idx) => (
                  <div 
                    key={idx} 
                    className="action-card" 
                    onClick={() => {
                      if (action.path.startsWith('#')) {
                        const targetId = action.path.substring(1);
                        const targetEl = document.getElementById(targetId);
                        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        navigate(action.path);
                      }
                    }}
                  >
                    <div className="action-card-glow"></div>
                    <div className="action-header">
                      <div className="action-icon-wrapper">
                        {action.icon}
                      </div>
                      <ChevronRight size={18} className="action-chevron" />
                    </div>
                    <h4 className="action-title">{action.title}</h4>
                    <p className="action-desc">{action.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Parental Controls Interactive setting block */}
            <section 
              id="parental-controls" 
              className="ott-section parental-section animate-fadeInUp" 
              style={{ '--delay': 6 }}
            >
              <div className="parental-card-glass">
                <div className="parental-content">
                  <div className="parental-icon-wrapper">
                    <Shield size={24} className="text-gold" />
                  </div>
                  <div className="parental-details">
                    <div className="parental-header-row">
                      <h4>Parental Content Controls</h4>
                      {parentalControlsEnabled && (
                        <span className="parental-status-badge">
                          <CheckCircle2 size={12} className="inline mr-1" />
                          Restrictions Active
                        </span>
                      )}
                    </div>
                    <p className="parental-desc">{PARENTAL_CONTROLS_DESCRIPTION}</p>
                    <small className="parental-details-muted">
                      Blocks access to mature categories like Premium, Action, Thriller, Mystery, Horror, and Originals without security bypass pins.
                    </small>
                  </div>
                </div>

                <div className="parental-toggle-control">
                  <span className="toggle-label-text">{parentalControlsEnabled ? 'Restrictions On' : 'Restrictions Off'}</span>
                  <label className="ott-toggle-switch">
                    <input 
                      type="checkbox"
                      checked={parentalControlsEnabled}
                      disabled={savingPreference}
                      onChange={(e) => handleParentalControlsToggle(e.target.checked)}
                    />
                    <span className="ott-toggle-slider"></span>
                  </label>
                </div>
              </div>
            </section>

            {/* SECTION 5: Recent Activity / Continue Watching */}
            <section className="ott-section activity-section animate-fadeInUp" style={{ '--delay': 7 }}>
              <h3 className="section-title">
                <Tv size={20} className="text-gold" />
                Continue Watching
              </h3>
              
              <div className="activity-row-scroll">
                {mockRecentActivity.map((activity) => (
                  <div key={activity.id} className="activity-movie-card">
                    <div className="activity-card-image-box">
                      <img src={activity.image} alt={activity.title} />
                      <div className="activity-image-overlay">
                        <button className="activity-play-btn" onClick={() => navigate(`/show/${activity.id}`)} aria-label={`Play ${activity.title}`}>
                          <Play size={20} fill="#FFF" color="#FFF" />
                        </button>
                      </div>
                      
                      {/* Premium progress bar layer */}
                      <div className="activity-progress-container">
                        <div 
                          className="activity-progress-bar" 
                          style={{ width: `${activity.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="activity-card-meta">
                      <h4 className="activity-movie-title">{activity.title}</h4>
                      <div className="activity-sub-metadata">
                        <span className="activity-type">{activity.type}</span>
                        <span className="activity-duration">{activity.durationLeft}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 6: Crimson-Red Sign Out Footer Actions */}
            <footer className="ott-hub-footer animate-fadeInUp" style={{ '--delay': 8 }}>
              <div className="footer-links">
                <button onClick={() => navigate('/settings')}>Edit Account Info</button>
                <span className="link-dot"></span>
                <button onClick={() => navigate('/subscribe')}>Manage billing subscription</button>
                <span className="link-dot"></span>
                <button onClick={() => navigate('/support')}>Support Center & Help</button>
              </div>

              <div className="footer-danger-zone">
                <Button variant="outline" className="danger-sign-out-btn" onClick={logout}>
                  <LogOut size={16} />
                  SIGN OUT OF ALL SESSIONS
                </Button>
              </div>
            </footer>

          </main>

        </div>
      </div>

      <PlanSelectorModal
        isOpen={planSelectorOpen}
        onClose={() => setPlanSelectorOpen(false)}
        onSelectPlan={handlePlanSelection}
        subscription={profile.subscription}
      />
    </>
  );
}
