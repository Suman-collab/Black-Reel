import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { toast } from '../lib/toast';
import './Settings.css';
import Button from '../components/Button';
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

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      setLoading(true);
      setError('');

      try {
        const user = await getProfile();

        if (!isMounted) {
          return;
        }

        setProfile(user);
        setFormState({
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl || '/images/avatar.png',
          language: user.preferences?.language || codeToLabel(languageCode),
          notificationsEnabled: Boolean(user.preferences?.notificationsEnabled),
          parentalControls: Boolean(user.preferences?.parentalControls),
        });
        updateUser(user);
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

  return (
    <>
      <div className="settings-page container">
        <div className="page-header center">
          <img src="/images/Vertical%20logo/Black-Shortz.png" alt="Black Shortz Logo" className="logo-header" />
          <h1 className="page-title text-gold uppercase tracking-wider">{t('settings.title')}</h1>
        </div>

        <div className="settings-list-container">
        <div className="settings-item" style={{ display: 'block' }}>
          <div className="settings-item-content">
            <h3>{t('settings.name')}</h3>
            <input
              type="text"
              value={formState.name}
              onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
              style={{ width: '100%', marginTop: '10px', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
            />
          </div>
        </div>

        <div className="settings-item" style={{ display: 'block' }}>
          <div className="settings-item-content">
            <h3>{t('settings.email')}</h3>
            <input
              type="email"
              value={formState.email}
              onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
              style={{ width: '100%', marginTop: '10px', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
            />
          </div>
        </div>

        <div className="settings-item" style={{ display: 'block' }}>
          <div className="settings-item-content">
            <h3>{t('settings.avatar')}</h3>
            <div style={{ display: 'flex', gap: '16px', marginTop: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
              <img
                src={formState.avatarUrl || '/images/avatar.png'}
                alt={formState.name || 'Profile avatar'}
                style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #333' }}
              />
              <div style={{ flex: 1, minWidth: '240px' }}>
                <input
                  type="url"
                  value={formState.avatarUrl}
                  onChange={(event) => setFormState((current) => ({ ...current, avatarUrl: event.target.value }))}
                  placeholder="Paste an image URL"
                  style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '8px', marginBottom: '10px' }}
                />
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px 14px',
                      borderRadius: '999px',
                      border: '1px solid #444',
                      cursor: 'pointer',
                      color: '#fff',
                    }}
                  >
                    {t('settings.uploadNewImage')}
                    <input type="file" accept="image/*" onChange={handleAvatarSelect} style={{ display: 'none' }} />
                  </label>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setFormState((current) => ({ ...current, avatarUrl: '/images/avatar.png' }))}
                  >
                    {t('settings.resetDefault')}
                  </button>
                </div>
                <p style={{ margin: '10px 0 0', color: '#888', fontSize: '0.85rem' }}>
                  {t('settings.avatarHint')}
                </p>
                {avatarUploading ? <p style={{ margin: '10px 0 0', color: '#d4b872', fontSize: '0.85rem' }}>Uploading avatar...</p> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-content">
            <h3>{t('settings.notifications')}</h3>
            <p>{t('settings.notificationsDesc')}</p>
          </div>
          <div
            className={`custom-toggle ${formState.notificationsEnabled ? 'active' : ''}`}
            onClick={() => setFormState((current) => ({ ...current, notificationsEnabled: !current.notificationsEnabled }))}
          >
            <div className="toggle-circle"></div>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-content">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {t('settings.parentalControls')}
              {formState.parentalControls && (
                <span style={{ fontSize: '11px', background: 'rgba(159, 232, 112, 0.15)', color: '#9fe870', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Active
                </span>
              )}
            </h3>
            <p>{PARENTAL_CONTROLS_DESCRIPTION}</p>
            {formState.parentalControls ? (
              <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(159, 232, 112, 0.05)', border: '1px solid rgba(159, 232, 112, 0.15)', borderRadius: '8px' }}>
                <p style={{ margin: 0, color: '#9fe870', fontWeight: '600', fontSize: '13px' }}>
                  ✓ Parental controls enabled. Content rated 18+ will be hidden across the app.
                </p>
                <p style={{ margin: '4px 0 0', color: '#888', fontSize: '12px' }}>
                  Blocked ratings: 18+, R-rated, TV-MA content.
                </p>
              </div>
            ) : (
              <p style={{ marginTop: '10px', color: '#a0a0a8', fontSize: '13px' }}>
                All content is now visible.
              </p>
            )}
          </div>
          <div
            className={`custom-toggle ${formState.parentalControls ? 'active' : ''}`}
            onClick={() => setFormState((current) => ({ ...current, parentalControls: !current.parentalControls }))}
          >
            <div className="toggle-circle"></div>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-content">
            <h3>{t('settings.language')}</h3>
          </div>
          <div className="settings-item-action">
            <select
              value={labelToCode(formState.language)}
              onChange={async (event) => {
                const nextLanguageCode = event.target.value;
                const label = codeToLabel(nextLanguageCode);
                
                // 1. Instantly change local language code
                setLanguageCode(nextLanguageCode);
                setFormState((current) => ({ ...current, language: label }));
                
                // 2. Update localStorage key immediately
                localStorage.setItem('blackreel-language-code', nextLanguageCode);
                
                // 3. Optimistically update user object in AuthContext
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
                
                // 4. Save to backend user profile immediately
                try {
                  await updatePreferences({ language: label });
                  toast.success('Language updated successfully');
                } catch {
                  toast.error('Failed to save language preference.');
                }
              }}
              style={{ padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronRight size={20} className="text-muted" />
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-content">
            <h3>{t('settings.subscription')}</h3>
            <p>
              {hasActiveSubscription(profile?.subscription)
                ? getSubscriptionLabel(profile.subscription)
                : hasSelectedSubscriptionPlan(profile?.subscription)
                  ? `${getNavbarPlanLabel(profile.subscription)}`
                  : t('settings.noActivePlan')}
            </p>
          </div>
          <div className="settings-item-action">
            <span className="text-muted">{profile?.subscription?.status || 'inactive'}</span>
            <Button
              variant="outline"
              className="settings-manage-plan-btn"
              onClick={() => setPlanSelectorOpen(true)}
            >
              {hasSelectedSubscriptionPlan(profile?.subscription) ? t('settings.manageUpgrade') : t('settings.viewPlans')}
            </Button>
          </div>
        </div>



        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? t('settings.saving') : t('settings.saveSettings')}
          </Button>
          <Button variant="outline" onClick={logout}>{t('settings.logOut')}</Button>
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
