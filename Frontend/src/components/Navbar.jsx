import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Search as SearchIcon, User, X, Bell, Menu } from 'lucide-react';
import './Navbar.css';
import { useAuth } from '../features/auth/AuthContext';
import PlanSelectorModal from './PlanSelectorModal';
import { getNavbarPlanLabel, hasActiveSubscription, hasSelectedSubscriptionPlan } from '../lib/subscription';
import { useI18n } from '../i18n/I18nContext';

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [planSelectorOpen, setPlanSelectorOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, logout, user, hasRestrictedAccess } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAuthPage = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/account-suspended'
  ].includes(location.pathname);
  const subscriptionIsActive = hasActiveSubscription(user?.subscription);
  const hasSelectedPlan = hasSelectedSubscriptionPlan(user?.subscription);
  const activePlanLabel = getNavbarPlanLabel(user?.subscription);
  const isDummyMode = import.meta.env.VITE_PAYMENT_MODE === 'dummy';
  const canUseProtectedActions = isAuthenticated && !hasRestrictedAccess;
  const watchlistLink = hasRestrictedAccess ? '/account-suspended' : '/watchlist';
  const profileLink = hasRestrictedAccess ? '/account-suspended' : '/profile';
  const notificationsLink = hasRestrictedAccess ? '/account-suspended' : '/notifications';
  const subscribeLink = hasRestrictedAccess
    ? '/account-suspended'
    : isDummyMode
      ? '/plans'
      : '/subscribe';
  
  const hasActivePlan = user?.subscription?.status === 'active';
  const planName = user?.subscription?.planType || user?.subscription?.plan;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setSearchOpen(false); 
    }
  };

  const handlePlanSelection = (planType) => {
    setPlanSelectorOpen(false);
    setMobileMenuOpen(false);

    if (hasRestrictedAccess) {
      navigate('/account-suspended');
      return;
    }

    if (subscriptionIsActive && user?.subscription?.planType === planType) {
      navigate(isDummyMode ? '/plans' : '/subscribe');
      return;
    }

    navigate(`/checkout?plan=${planType}`);
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="navbar__logo nav-brand">
          <img
            src="/images/Horizontal%20logo/Black-Shortz.png"
            alt="Black Shortz Logo"
            className="nav-brand-logo"
          />
        </Link>

        {!isAuthPage && (
          <>
            <div className="navbar__nav nav-links">
              <NavLink to="/" className={({ isActive }) => `navbar__link nav-link ${isActive ? 'active' : ''}`}>{t('nav.home')}</NavLink>
              <NavLink to="/categories" className={({ isActive }) => `navbar__link nav-link ${isActive ? 'active' : ''}`}>{t('nav.categories')}</NavLink>
              <NavLink to="/fandom" className={({ isActive }) => `navbar__link nav-link ${isActive ? 'active' : ''}`}>{t('nav.fandom')}</NavLink>
              <NavLink to={watchlistLink} className={({ isActive }) => `navbar__link nav-link ${isActive ? 'active' : ''}`}>{t('nav.watchlist')}</NavLink>
            </div>

            <div className="navbar__actions nav-actions">
              {searchOpen ? (
                <form onSubmit={handleSearchSubmit} className="search-form active">
                  <input
                    type="text"
                    placeholder={t('nav.searchPlaceholder')}
                    className="search-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                  />
                  <button type="button" className="btn-icon close-search" aria-label="Close search" onClick={() => setSearchOpen(false)}>
                    <X size={20} />
                  </button>
                </form>
              ) : (
                <button className="btn-icon open-search" aria-label="Open search" onClick={() => setSearchOpen(true)}>
                  <SearchIcon size={20} />
                </button>
              )}

              {hasActivePlan ? (
                <div className="nav-plan-badge desktop-only-action">
                  <span className="plan-name">
                    {planName?.charAt(0).toUpperCase() + planName?.slice(1)}
                  </span>
                  <button 
                    className="btn-upgrade"
                    onClick={() => navigate(isDummyMode ? '/plans' : '/subscribe')}
                  >
                    Upgrade
                  </button>
                </div>
              ) : (
                <button 
                  className="btn btn-primary desktop-only-action"
                  onClick={() => navigate(isDummyMode ? '/plans' : '/subscribe')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '999px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #E8B84B, #F5D078)',
                    color: '#0D0D0F',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Subscribe
                </button>
              )}

              {canUseProtectedActions ? (
                <>
                  <Link to={notificationsLink} aria-label="Notifications" className="btn-icon desktop-only-action" style={{ display: 'flex', alignItems: 'center' }}>
                    <Bell size={20} />
                  </Link>
                  <Link to={profileLink} aria-label="Profile" className="desktop-only-action" style={{ display: 'flex', alignItems: 'center' }}>
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Profile" className="navbar__avatar" />
                    ) : (
                      <div className="btn-icon" style={{ display: 'flex', alignItems: 'center' }}>
                        <User size={20} />
                      </div>
                    )}
                  </Link>
                  <button type="button" className="btn-icon desktop-only-action" style={{ fontSize: '0.9rem' }} onClick={logout}>
                    {t('nav.logout')}
                  </button>
                </>
              ) : hasRestrictedAccess ? (
                <Link to="/account-suspended" className="btn-icon desktop-only-action" style={{ fontSize: '0.95rem' }}>
                  {t('nav.accountRestricted')}
                </Link>
              ) : (
                <Link to="/login" className="btn-icon desktop-only-action" style={{ fontSize: '0.95rem' }}>
                  {t('nav.signIn')}
                </Link>
              )}

              <button className="mobile-menu-btn btn-icon" aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </>
        )}

        {!isAuthPage && (
          <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <div className="mobile-nav-links">
              <NavLink to="/" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>{t('nav.home')}</NavLink>
              <NavLink to="/categories" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>{t('nav.categories')}</NavLink>
              <NavLink to="/fandom" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>{t('nav.fandom')}</NavLink>
              <NavLink to={watchlistLink} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>{t('nav.watchlist')}</NavLink>
              {canUseProtectedActions && (
                <>
                  <NavLink to={notificationsLink} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>{t('nav.notifications') || 'Notifications'}</NavLink>
                  <NavLink to={profileLink} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>{t('nav.profile') || 'Profile'}</NavLink>
                </>
              )}
              {hasSelectedPlan ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setPlanSelectorOpen(true);
                  }}
                  className="mobile-plan-button"
                >
                  {t('nav.currentPlan')}: {activePlanLabel} ({subscriptionIsActive ? t('nav.manageUpgrade') : t('nav.completeUpgrade')})
                </button>
              ) : (
                <NavLink to={subscribeLink} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>{t('nav.subscribe')}</NavLink>
              )}
              {!isAuthenticated && (
                <NavLink to="/login" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>{t('nav.signIn') || 'Sign In'}</NavLink>
              )}
              {canUseProtectedActions ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="mobile-nav-link"
                  style={{ background: 'transparent', border: 'none', textAlign: 'left' }}
                >
                  {t('nav.logout')} {user?.name ? `(${user.name.split(' ')[0]})` : ''}
                </button>
              ) : hasRestrictedAccess ? (
                <NavLink
                  to="/account-suspended"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                >
                  {t('nav.accountRestricted')}
                </NavLink>
              ) : null}
            </div>
          </div>
        )}
      </nav>

      <PlanSelectorModal
        isOpen={planSelectorOpen}
        onClose={() => setPlanSelectorOpen(false)}
        onSelectPlan={handlePlanSelection}
        subscription={user?.subscription}
      />
    </>
  );
}
