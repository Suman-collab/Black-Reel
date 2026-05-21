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
  const { isAuthenticated, logout, user, hasRestrictedAccess } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = ['/login', '/signup', '/account-suspended'].includes(location.pathname);
  const subscriptionIsActive = hasActiveSubscription(user?.subscription);
  const hasSelectedPlan = hasSelectedSubscriptionPlan(user?.subscription);
  const activePlanLabel = getNavbarPlanLabel(user?.subscription);
  const canUseProtectedActions = isAuthenticated && !hasRestrictedAccess;
  const watchlistLink = hasRestrictedAccess ? '/account-suspended' : '/watchlist';
  const profileLink = hasRestrictedAccess ? '/account-suspended' : '/profile';
  const notificationsLink = hasRestrictedAccess ? '/account-suspended' : '/notifications';
  const subscribeLink = hasRestrictedAccess ? '/account-suspended' : '/subscribe';

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setSearchOpen(false); // optional: close search on submit or keep open
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
      navigate('/subscribe');
      return;
    }

    navigate(`/checkout?plan=${planType}`);
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="nav-brand">
          <img
            src="/images/Horizontal%20logo/Black-Shortz.png"
            alt="Black Shortz Logo"
            className="nav-brand-logo"
          />
        </Link>

        {!isAuthPage && (
          <>
            <div className="nav-links">
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{t('nav.home')}</NavLink>
              <NavLink to="/categories" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{t('nav.categories')}</NavLink>
              <NavLink to="/fandom" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{t('nav.fandom')}</NavLink>
              <NavLink to={watchlistLink} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{t('nav.watchlist')}</NavLink>
            </div>

            <div className="nav-actions">
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

              {hasSelectedPlan ? (
                <div className="subscription-actions">
                  <button
                    type="button"
                    className="btn-icon subscribe-chip plan-active"
                    style={{ fontSize: '0.95rem', fontWeight: 'bold' }}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setPlanSelectorOpen(true);
                    }}
                  >
                    {activePlanLabel}
                  </button>
                  <button
                    type="button"
                    className="subscription-manage-button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setPlanSelectorOpen(true);
                    }}
                  >
                    {subscriptionIsActive ? t('nav.manageUpgrade') : t('nav.completeUpgrade')}
                  </button>
                </div>
              ) : (
                <Link
                  to={subscribeLink}
                  className="btn-icon subscribe-chip"
                  style={{ fontSize: '0.95rem', fontWeight: 'bold' }}
                >
                  {t('nav.subscribe')}
                </Link>
              )}

              {canUseProtectedActions ? (
                <>
                  <Link to={notificationsLink} aria-label="Notifications" className="btn-icon" style={{ display: 'flex', alignItems: 'center' }}>
                    <Bell size={20} />
                  </Link>
                  <Link to={profileLink} aria-label="Profile" className="btn-icon" style={{ display: 'flex', alignItems: 'center' }}>
                    <User size={20} />
                  </Link>
                  <button type="button" className="btn-icon" style={{ fontSize: '0.9rem' }} onClick={logout}>
                    {t('nav.logout')}
                  </button>
                </>
              ) : hasRestrictedAccess ? (
                <Link to="/account-suspended" className="btn-icon" style={{ fontSize: '0.95rem' }}>
                  {t('nav.accountRestricted')}
                </Link>
              ) : (
                <Link to="/login" className="btn-icon" style={{ fontSize: '0.95rem' }}>
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
