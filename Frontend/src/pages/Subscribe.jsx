import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { plans } from '../lib/plans';
import { formatPlanName, hasActiveSubscription } from '../lib/subscription';
import './Subscribe.css';

export default function Subscribe() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isSuspended } = useAuth();
  const currentSubscription = user?.subscription;
  const emailVerified = Boolean(user?.emailVerified);
  const subscriptionIsActive = hasActiveSubscription(currentSubscription);
  const currentPlanType = currentSubscription?.planType;
  const checkoutMessage = location.state?.checkoutMessage || '';

  const handleSubscribe = (planType) => {
    if (isSuspended) {
      return;
    }

    if (!emailVerified) {
      navigate(`/verify-email?email=${encodeURIComponent(user?.email || '')}`);
      return;
    }

    if (subscriptionIsActive && currentPlanType === planType) {
      return;
    }

    navigate(`/checkout?plan=${planType}`);
  };

  const getPlanActionLabel = (planType) => {
    if (isSuspended) {
      return 'Subscription Blocked';
    }

    if (!subscriptionIsActive) {
      return 'Continue to Payment';
    }

    if (currentPlanType === planType) {
      return 'Current Plan';
    }

    return 'Upgrade or Switch';
  };

  return (
    <div className="subscribe-page container animate-fade-in-up">
      <div className="subscribe-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="subscribe-title text-gold" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)' }}>Subscribe</h1>
        <p className="subscribe-subtitle" style={{ color: 'var(--text-secondary)' }}>Choose the plan that&apos;s right for you</p>
        {checkoutMessage ? <p className="subscribe-feedback" style={{ color: 'var(--brand-primary)', marginTop: '10px' }}>{checkoutMessage}</p> : null}
        {isSuspended ? (
          <div className="current-plan-banner" style={{ margin: '20px auto', maxWidth: '600px', background: 'rgba(255, 107, 107, 0.08)', border: '1px solid rgba(255, 107, 107, 0.3)', borderRadius: '12px', padding: '16px' }}>
            <span className="current-plan-label" style={{ fontSize: '11px', color: '#FF6B6B', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Account Suspended</span>
            <strong style={{ fontSize: '1.2rem', color: '#FF6B6B' }}>Your account is suspended. You cannot purchase or renew subscriptions.</strong>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Please contact customer support to resolve your account status.</p>
            <a
              href="mailto:support@blackreel.com?subject=Suspended%20Account%20Subscription%20Inquiry"
              className="btn btn-outline"
              style={{
                display: 'inline-block',
                marginTop: '12px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#FF6B6B',
                border: '1px solid #FF6B6B',
                borderRadius: '4px',
                textDecoration: 'none',
                textAlign: 'center'
              }}
            >
              Contact Customer Support
            </a>
          </div>
        ) : null}
        {subscriptionIsActive ? (
          <div className="current-plan-banner" style={{ margin: '20px auto', maxWidth: '600px', background: 'var(--gradient-gold-soft)', border: '1px solid var(--border-gold)', borderRadius: '12px', padding: '16px' }}>
            <span className="current-plan-label" style={{ fontSize: '11px', color: 'var(--text-gold)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Current membership</span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>{formatPlanName(currentPlanType)} Plan</strong>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Select another plan below if you want to upgrade or switch your subscription.</p>
          </div>
        ) : null}
        {!emailVerified && !isSuspended ? (
          <div className="current-plan-banner" style={{ margin: '20px auto', maxWidth: '600px', background: 'rgba(231,76,60,0.05)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: '12px', padding: '16px' }}>
            <span className="current-plan-label" style={{ fontSize: '11px', color: '#E74C3C', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Verification required</span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>Verify your email before starting a subscription.</strong>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Check your inbox, then return to continue checkout.</p>
          </div>
        ) : null}
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${plan.popular ? 'plan-card--featured' : ''} ${subscriptionIsActive && currentPlanType === plan.id ? 'active-plan-card' : ''}`}
          >
            {plan.popular ? <div className="plan-card__badge">MOST POPULAR</div> : null}
            <h2 className="plan-card__name">{plan.name}</h2>
            <div className="plan-card__price">
              <span className="plan-card__price-amount">
                ₹{plan.price}
              </span>
              <span className="plan-card__price-period">/ month</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', minHeight: '42px', fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }}>{plan.description}</p>
            <ul className="plan-card__features">
              {plan.features.map((feature) => (
                <li key={feature} className="plan-card__feature">
                  <span className="plan-card__feature-icon">✓</span> {feature}
                </li>
              ))}
            </ul>
            <button
              className={`btn ${subscriptionIsActive && currentPlanType === plan.id ? 'btn-outline' : 'btn-primary'} btn-block`}
              onClick={() => handleSubscribe(plan.id)}
              disabled={isSuspended || !emailVerified || (subscriptionIsActive && currentPlanType === plan.id)}
              style={{ marginTop: 'auto' }}
            >
              {getPlanActionLabel(plan.id)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
