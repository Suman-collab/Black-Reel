import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Settings as SettingsIcon, 
  Shield, 
  CreditCard, 
  Sparkles, 
  LogOut, 
  Check, 
  Languages, 
  Bell, 
  Eye 
} from 'lucide-react';
import { toast } from '../lib/toast';
import './Settings.css';
import PlanSelectorModal from '../components/PlanSelectorModal';
import StatePanel from '../components/StatePanel';
import { getProfile, updatePreferences, updateProfile, uploadAvatar } from '../features/user/user.service';
import { useAuth } from '../features/auth/AuthContext';
import { PARENTAL_CONTROLS_DESCRIPTION } from '../lib/contentAccess';
import { getNavbarPlanLabel, getSubscriptionLabel, hasActiveSubscription, hasSelectedSubscriptionPlan } from '../lib/subscription';
import { useI18n } from '../i18n/I18nContext';
import { LANGUAGE_OPTIONS, codeToLabel, labelToCode } from '../i18n/translations';

export default function Settings() {
  const navigate = useNavigate();
  const { logout, updateUser, user } = useAuth();
  const { t, languageCode, setLanguageCode } = useI18n();
  const [profile, setProfile] = useState(null);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    avatarUrl: '/images/avatar.png',
    language: 'English (US)',
    notificationsEnabled: true,
    parentalControls: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [planSelectorOpen, setPlanSelectorOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      setLoading(true);
      setError('');

      try {
        const userProfile = await getProfile();

        if (!isMounted) {
          return;
        }

        setProfile(userProfile);
        setFormState({
          name: userProfile.name,
          email: userProfile.email,
          avatarUrl: userProfile.avatarUrl || '/images/avatar.png',
          language: userProfile.preferences?.language || codeToLabel(languageCode),
          notificationsEnabled: Boolean(userProfile.preferences?.notificationsEnabled),
          parentalControls: Boolean(userProfile.preferences?.parentalControls),
        });
        updateUser(userProfile);
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

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfile((current) => (current ? { ...current, ...user } : user));
    setFormState((current) => ({
      ...current,
      parentalControls: Boolean(user.preferences?.parentalControls),
    }));
  }, [user]);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.warning('Please choose a valid image file.');
      return;
    }

    if (file.size > 350 * 1024) {
      toast.warning('Please choose an image smaller than 350 KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const avatarDataUrl = reader.result;

      if (typeof avatarDataUrl !== 'string') {
        toast.error('Unable to read this image file.');
        return;
      }

      setAvatarUploading(true);
      setError('');

      const uploadPromise = uploadAvatar(avatarDataUrl);

      toast.promise(uploadPromise, {
        pending: 'Uploading avatar image...',
        success: 'Avatar uploaded successfully.',
        error: 'Failed to upload avatar.'
      });

      try {
        const updatedUser = await uploadPromise;
        setProfile(updatedUser);
        updateUser(updatedUser);
        setFormState((current) => ({
          ...current,
          avatarUrl: updatedUser.avatarUrl || current.avatarUrl,
        }));
      } catch {
        // upload errors are surfaced through toast.promise
      } finally {
        setAvatarUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    const savePromise = (async () => {
      await updateProfile({ name: formState.name, email: formState.email, avatarUrl: formState.avatarUrl });
      await updatePreferences({
        language: formState.language,
        notificationsEnabled: formState.notificationsEnabled,
        parentalControls: formState.parentalControls,
      });

      const refreshedUser = await getProfile();
      return refreshedUser;
    })();

    toast.promise(savePromise, {
      pending: 'Saving your profile preferences...',
      success: t('settings.saveSuccess') || 'Preferences saved successfully!',
      error: 'Failed to save settings.'
    });

    try {
      const refreshedUser = await savePromise;

      setProfile(refreshedUser);
      updateUser(refreshedUser);
      setFormState({
        name: refreshedUser.name,
        email: refreshedUser.email,
        avatarUrl: refreshedUser.avatarUrl || '/images/avatar.png',
        language: refreshedUser.preferences?.language || codeToLabel(languageCode),
        notificationsEnabled: Boolean(refreshedUser.preferences?.notificationsEnabled),
        parentalControls: Boolean(refreshedUser.preferences?.parentalControls),
      });
    } catch {
      // save errors are surfaced through toast.promise
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <StatePanel title="Loading settings" message="Fetching your account details and preferences." />;
  }

  if (error && !profile) {
    return <StatePanel title="Settings unavailable" message={error} />;
  }

  const handlePlanSelection = (planType) => {
    setPlanSelectorOpen(false);

    if (hasActiveSubscription(profile?.subscription) && profile?.subscription?.planType === planType) {
      navigate('/subscribe');
      return;
    }

    navigate(`/checkout?plan=${planType}`);
  };

  const isPremiumMember = hasActiveSubscription(profile?.subscription);
  const currentPlanLabel = isPremiumMember
    ? getNavbarPlanLabel(profile.subscription)
    : hasSelectedSubscriptionPlan(profile?.subscription)
      ? getNavbarPlanLabel(profile.subscription)
      : t('settings.noActivePlan');

  const planBenefits = {
    free: [
      'SD (480p) Streaming Quality',
      '1 Screen / Device Limit',
      'Web Browser Streaming Access Only',
    ],
    basic: [
      '720p HD Streaming Quality',
      '1 Screen / Device Limit',
      'Mobile Devices & Tablets Support',
    ],
    standard: [
      '1080p Full HD Streaming Quality',
      '2 Concurrent Screens Support',
      'All Compatible Devices Supported',
      'Offline Downloads & Saves Enabled',
    ],
    premium: [
      'Ultra HD 4K & HDR Cinema Quality',
      '4 Concurrent Screens Support',
      'All Compatible Devices Supported',
      'Offline Downloads & Saves Enabled',
      'Immersive Dolby Atmos Sound Support',
    ],
  };

  const rawPlanType = profile?.subscription?.planType || profile?.subscription?.plan || 'free';
  const activePlanId = isPremiumMember ? String(rawPlanType).toLowerCase() : 'free';
  const currentBenefitsList = planBenefits[activePlanId] || planBenefits['free'];

  return (
    <>
      <div className="settings-page container">
        <div className="page-header center">
          <img src="/images/Vertical%20logo/Black-Shortz.png" alt="Black Shortz Logo" className="logo-header" />
          <h1 className="page-title text-gold uppercase tracking-wider">{t('settings.title')}</h1>
        </div>

        <div className="settings-grid-layout">
          {/* Left Column: Profile & Billing */}
          <div className="settings-pane-left">
            {/* 1. Profile Identity Card */}
            <div className="ott-card ott-profile-card">
              <div className="ott-avatar-wrapper" onClick={triggerFileInput}>
                <img
                  src={formState.avatarUrl || '/images/avatar.png'}
                  alt={formState.name || 'Profile avatar'}
                  className="ott-avatar-img"
                />
                <div className="ott-avatar-overlay">
                  <Camera size={22} />
                  <span>Edit</span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  onChange={handleAvatarSelect} 
                  style={{ display: 'none' }} 
                />
              </div>

              <h2 className="ott-profile-name">{formState.name || 'User Profile'}</h2>
              <p className="ott-profile-email">{formState.email}</p>

              {isPremiumMember ? (
                <span className="ott-badge-premium">
                  <Sparkles size={12} fill="var(--text-inverse)" />
                  {profile?.subscription?.planType?.toUpperCase() || 'PREMIUM'} MEMBER
                </span>
              ) : (
                <span className="ott-badge-premium" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', boxShadow: 'none' }}>
                  FREE ACCOUNT
                </span>
              )}

              {avatarUploading && (
                <p style={{ margin: '14px 0 0', color: 'var(--brand-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                  Uploading avatar image...
                </p>
              )}
            </div>

            {/* 2. Netflix-Style Subscription Card */}
            <div className="ott-card ott-subscription-card">
              <h3 className="ott-card-title">
                <CreditCard size={18} />
                {t('settings.subscription')}
              </h3>
              <p className="ott-card-desc">Manage plan details and billing configurations</p>

              <div className="subscription-billing-grid">
                <div className="subscription-billing-row">
                  <span className="subscription-billing-label">Status</span>
                  <span className="subscription-billing-value" style={{ color: isPremiumMember ? '#2ecc71' : 'var(--text-secondary)' }}>
                    {(profile?.subscription?.status || 'inactive').toUpperCase()}
                  </span>
                </div>
                <div className="subscription-billing-row">
                  <span className="subscription-billing-label">Current Plan</span>
                  <span className="subscription-billing-value" style={{ color: 'var(--brand-primary)' }}>
                    {currentPlanLabel}
                  </span>
                </div>
                {profile?.subscription?.renewalDate && (
                  <div className="subscription-billing-row">
                    <span className="subscription-billing-label">Renewal Date</span>
                    <span className="subscription-billing-value">
                      {new Date(profile.subscription.renewalDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="subscription-benefits-list">
                {currentBenefitsList.map((benefit, idx) => (
                  <div key={idx} className="subscription-benefit-item">
                    <Check size={14} />
                    <span>{benefit}</span>
                  </div>
                ))}
                <div className="subscription-benefit-item">
                  <Check size={14} />
                  <span>All Exclusive Content & Shows Included</span>
                </div>
              </div>

              <div className="subscription-actions">
                <button
                  type="button"
                  className="ott-btn ott-btn-primary"
                  onClick={() => setPlanSelectorOpen(true)}
                >
                  {hasSelectedSubscriptionPlan(profile?.subscription) ? t('settings.manageUpgrade') : t('settings.viewPlans')}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Account Forms & Settings */}
          <div className="settings-pane-right">
            {/* 3. Account Information */}
            <div className="ott-card ott-account-card">
              <h3 className="ott-card-title">
                <SettingsIcon size={18} />
                Account Credentials
              </h3>
              <p className="ott-card-desc">Edit primary profile details and avatar locations</p>

              <div className="ott-form-grid">
                <div className="ott-form-group">
                  <label className="ott-label">{t('settings.name')}</label>
                  <input
                    type="text"
                    className="ott-input"
                    value={formState.name}
                    onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="ott-form-group">
                  <label className="ott-label">{t('settings.email')}</label>
                  <input
                    type="email"
                    className="ott-input"
                    value={formState.email}
                    onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="ott-form-group">
                  <label className="ott-label">Avatar Image URL</label>
                  <input
                    type="url"
                    className="ott-input"
                    value={formState.avatarUrl}
                    onChange={(event) => setFormState((current) => ({ ...current, avatarUrl: event.target.value }))}
                    placeholder="Paste direct picture address link"
                  />
                  <div className="ott-url-actions">
                    <button
                      type="button"
                      className="ott-btn ott-btn-outline"
                      onClick={() => setFormState((current) => ({ ...current, avatarUrl: '/images/avatar.png' }))}
                      style={{ padding: '8px 16px', fontSize: '12px' }}
                    >
                      {t('settings.resetDefault')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Preferences & Systems */}
            <div className="ott-card ott-preferences-card">
              <h3 className="ott-card-title">
                <Languages size={18} />
                System Preferences
              </h3>
              <p className="ott-card-desc">Configure streaming languages and user control locks</p>

              <div className="ott-preference-item">
                <div className="ott-preference-info">
                  <span className="ott-preference-title">
                    <Languages size={16} />
                    {t('settings.language')}
                  </span>
                  <span className="ott-preference-desc">Select your preferred system audio and translation language.</span>
                </div>
                <div className="ott-select-wrapper" style={{ width: '180px' }}>
                  <select
                    className="ott-select"
                    value={labelToCode(formState.language)}
                    onChange={async (event) => {
                      const nextLanguageCode = event.target.value;
                      const label = codeToLabel(nextLanguageCode);
                      
                      setLanguageCode(nextLanguageCode);
                      setFormState((current) => ({ ...current, language: label }));
                      
                      localStorage.setItem('blackreel-language-code', nextLanguageCode);
                      
                      updateUser((curr) => {
                        if (!curr) return curr;
                        return {
                          ...curr,
                          preferences: {
                            ...curr.preferences,
                            language: label
                          }
                        };
                      });
                      
                      try {
                        await updatePreferences({ language: label });
                        toast.success('Language updated successfully');
                      } catch {
                        toast.error('Failed to save language preference.');
                      }
                    }}
                  >
                    {LANGUAGE_OPTIONS.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ott-preference-item">
                <div className="ott-preference-info">
                  <span className="ott-preference-title">
                    <Bell size={16} />
                    {t('settings.notifications')}
                  </span>
                  <span className="ott-preference-desc">{t('settings.notificationsDesc')}</span>
                </div>
                <div
                  className={`ott-toggle ${formState.notificationsEnabled ? 'active' : ''}`}
                  onClick={() => setFormState((current) => ({ ...current, notificationsEnabled: !current.notificationsEnabled }))}
                >
                  <div className="ott-toggle-circle"></div>
                </div>
              </div>

              <div className="ott-preference-item" style={{ border: 'none', paddingBottom: 0 }}>
                <div className="ott-preference-info">
                  <span className="ott-preference-title">
                    <Eye size={16} />
                    {t('settings.parentalControls')}
                    {formState.parentalControls && (
                      <span className="ott-preference-badge">Active</span>
                    )}
                  </span>
                  <span className="ott-preference-desc">{PARENTAL_CONTROLS_DESCRIPTION}</span>
                  {formState.parentalControls ? (
                    <div className="ott-preference-alert">
                      <p style={{ margin: 0, fontWeight: '700' }}>
                        ✓ Parental controls enabled. Content rated 18+ will be hidden across the app.
                      </p>
                      <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '11px' }}>
                        Blocked ratings: 18+, R-rated, TV-MA content.
                      </p>
                    </div>
                  ) : (
                    <p style={{ marginTop: '10px', color: 'var(--text-secondary)', fontSize: '12px', margin: '4px 0 0' }}>
                      All content ratings are visible.
                    </p>
                  )}
                </div>
                <div
                  className={`ott-toggle ${formState.parentalControls ? 'active' : ''}`}
                  onClick={() => setFormState((current) => ({ ...current, parentalControls: !current.parentalControls }))}
                >
                  <div className="ott-toggle-circle"></div>
                </div>
              </div>
            </div>

            {/* 5. Danger Zone */}
            <div className="ott-card ott-danger-card">
              <h3 className="ott-card-title">
                <Shield size={18} />
                Danger Zone
              </h3>
              <p className="ott-card-desc">Sign out or terminate the active profile session</p>

              <div className="ott-preference-item" style={{ border: 'none', padding: '8px 0 0' }}>
                <div className="ott-preference-info">
                  <span className="ott-preference-title" style={{ color: '#E74C3C' }}>Sign Out of Session</span>
                  <span className="ott-preference-desc">Close session and return to authentication gateway screen.</span>
                </div>
                <button type="button" className="ott-btn ott-btn-danger" onClick={logout}>
                  <LogOut size={16} />
                  {t('settings.logOut')}
                </button>
              </div>
            </div>

            {/* 6. Persistent Actions Panel */}
            <div className="ott-actions-bar">
              <button
                type="button"
                className="ott-btn ott-btn-primary"
                onClick={handleSave}
                disabled={saving}
                style={{ minWidth: '180px' }}
              >
                {saving ? t('settings.saving') : t('settings.saveSettings')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <PlanSelectorModal
        isOpen={planSelectorOpen}
        onClose={() => setPlanSelectorOpen(false)}
        onSelectPlan={handlePlanSelection}
        subscription={profile?.subscription}
      />
    </>
  );
}
