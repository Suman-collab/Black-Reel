import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Button from '../components/Button';
import PlanSelectorModal from '../components/PlanSelectorModal';
import StatePanel from '../components/StatePanel';
import { getProfile, updatePreferences } from '../features/user/user.service';
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
  const { logout, updateUser, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [lastPaymentMethod, setLastPaymentMethod] = useState('');
  const [savingPreference, setSavingPreference] = useState(false);
  const [planSelectorOpen, setPlanSelectorOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setError('');

      try {
        const [user, paymentHistory] = await Promise.all([getProfile(), getPaymentHistory().catch(() => [])]);

        if (isMounted) {
          setProfile(user);
          updateUser(user);
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

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfile((current) => (current ? { ...current, ...user } : user));
  }, [user]);

  const handleParentalControlsToggle = async (enabled) => {
    if (!profile) {
      return;
    }

    setSavingPreference(true);

    try {
      const updatedUser = await updatePreferences({ parentalControls: enabled });
      setProfile(updatedUser);
      updateUser(updatedUser);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSavingPreference(false);
    }
  };

  if (loading) {
    return <StatePanel title="Loading your profile" message="Fetching your account, subscription, and preferences." />;
  }

  if (error || !profile) {
    return <StatePanel title="Profile unavailable" message={error || 'Your profile could not be loaded.'} />;
  }

  const subscriptionIsActive = hasActiveSubscription(profile.subscription);
  const parentalControlsEnabled = Boolean(profile.preferences?.parentalControls);

  const handlePlanSelection = (planType) => {
    setPlanSelectorOpen(false);

    if (subscriptionIsActive && profile.subscription?.planType === planType) {
      navigate('/subscribe');
      return;
    }

    navigate(`/checkout?plan=${planType}`);
  };

  const hasActivePlan = profile?.subscription?.status === 'active';
  const planName = profile?.subscription?.planType || profile?.subscription?.plan;
  const isDummyMode = import.meta.env.VITE_PAYMENT_MODE === 'dummy';

  return (
    <>
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-sidebar">
            <img src={profile.avatarUrl || '/images/avatar.png'} alt={profile.name} className="profile-avatar" />
            <h2 className="profile-name">{profile.name}</h2>
            <p className="profile-email">{profile.email}</p>
            <Button variant="pill" style={{ marginTop: '12px' }} onClick={() => navigate('/settings')}>
              Change Avatar
            </Button>
          </div>

          <div className="profile-settings">
            <div className="setting-card subscription-card">
              <div className="setting-info">
                <span className="setting-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Subscription
                  {hasActivePlan && (
                    <span className="badge-gold" style={{ fontSize: '11px', background: 'rgba(212,184,114,0.15)', color: '#D4B872', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      {planName}
                    </span>
                  )}
                </span>
                <span className="setting-value">{getSubscriptionStatusMessage(profile.subscription)}</span>
              </div>
              <div className="setting-card-action subscription-card-action">
                {hasActivePlan ? (
                  <Button variant="pill" onClick={() => navigate(isDummyMode ? '/plans' : '/subscribe')}>
                    Upgrade Plan
                  </Button>
                ) : (
                  <Button variant="pill" onClick={() => navigate(isDummyMode ? '/plans' : '/subscribe')}>
                    Choose a Plan
                  </Button>
                )}
              </div>
            </div>

            <div className="setting-card subscription-card">
              <div className="setting-info">
                <span className="setting-label">Billing</span>
                <span className="setting-value">
                  {profile.subscription?.renewalDate
                    ? `Renews on ${new Date(profile.subscription.renewalDate).toLocaleDateString()}`
                    : subscriptionIsActive
                      ? `${formatPlanName(profile.subscription?.planType)} membership is active`
                      : 'No renewal date available'}
                </span>
                <small style={{ color: 'var(--text-muted)' }}>
                  Payment method: {lastPaymentMethod || 'No confirmed payment method yet'}
                </small>
              </div>
            </div>

            <Link to="/settings" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="setting-card" style={{ cursor: 'pointer' }}>
                <div className="setting-info">
                  <span className="setting-label">Settings</span>
                </div>
                <ChevronRight size={20} color="var(--text-muted)" />
              </div>
            </Link>

            <Link to="/payment-history" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="setting-card" style={{ cursor: 'pointer' }}>
                <div className="setting-info">
                  <span className="setting-label">Payment History</span>
                </div>
                <ChevronRight size={20} color="var(--text-muted)" />
              </div>
            </Link>

            <Link to="/device-management" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="setting-card" style={{ cursor: 'pointer' }}>
                <div className="setting-info">
                  <span className="setting-label">Device Management</span>
                </div>
                <ChevronRight size={20} color="var(--text-muted)" />
              </div>
            </Link>

            <div className="setting-card">
              <div className="setting-info">
                <span className="setting-label">Email</span>
                <span className="setting-value">{profile.email}</span>
              </div>
              <ChevronRight size={20} color="var(--text-muted)" />
            </div>

            <div className="setting-card">
              <div className="setting-info">
                <span className="setting-label">Password</span>
                <span className="setting-value pwd-dots">********</span>
              </div>
              <Button variant="pill" onClick={() => navigate('/settings')}>Manage</Button>
            </div>

            <div className="setting-card">
              <div className="setting-info">
                <span className="setting-label">Parental Controls</span>
                <span className="setting-value">{PARENTAL_CONTROLS_DESCRIPTION}</span>
                {parentalControlsEnabled ? <span className="profile-parental-badge">Restrictions active</span> : null}
                <small style={{ color: 'var(--text-muted)' }}>
                  Affected content: Premium, Action, Thriller, Mystery, Horror, and Originals categories.
                </small>
              </div>
              <div className="toggle-container">
                <span className="setting-value">{parentalControlsEnabled ? 'On' : 'Off'}</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={parentalControlsEnabled}
                    disabled={savingPreference}
                    onChange={(event) => handleParentalControlsToggle(event.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
              <Button
                variant="outline"
                className="edit-profile-btn"
                style={{ padding: '16px', flex: 1 }}
                onClick={() => navigate('/settings')}
              >
                EDIT PROFILE
              </Button>

              <Button
                variant="outline"
                className="sign-out-btn"
                style={{ padding: '16px', flex: 1 }}
                onClick={logout}
              >
                SIGN OUT
              </Button>
            </div>
          </div>
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
