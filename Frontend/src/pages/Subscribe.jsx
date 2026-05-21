import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { plans } from '../lib/plans';
import { formatPlanName, hasActiveSubscription } from '../lib/subscription';
import './Subscribe.css';

export default function Subscribe() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const currentSubscription = user?.subscription;
  const emailVerified = Boolean(user?.emailVerified);
  const subscriptionIsActive = hasActiveSubscription(currentSubscription);
  const currentPlanType = currentSubscription?.planType;
  const checkoutMessage = location.state?.checkoutMessage || '';

  const handleSubscribe = (planType) => {
    if (!emailVerified) {
      navigate(`/verify-email?email=${encodeURIComponent(user?.email || '')}`);
      return;
    }

    if (subscriptionIsActive && currentPlanType === planType) {
      return;
    }

    // Plan selection should only start the checkout flow. The payment API is
    // intentionally deferred until the user confirms payment on `/checkout`.
    navigate(`/checkout?plan=${planType}`);
  };

  const getPlanActionLabel = (planType) => {
    if (!subscriptionIsActive) {
      return 'Continue to Payment';
    }

    if (currentPlanType === planType) {
      return 'Current Plan';
    }

    return 'Upgrade or Switch';
  };

  return (
    <div className="subscribe-page container">
      <div className="subscribe-header">
        <h1 className="subscribe-title text-gold">Subscribe</h1>
        <p className="subscribe-subtitle">Choose the plan that&apos;s right for you</p>
        {checkoutMessage ? <p className="subscribe-feedback">{checkoutMessage}</p> : null}
        {subscriptionIsActive ? (
          <div className="current-plan-banner">
            <span className="current-plan-label">Current membership</span>
            <strong>{formatPlanName(currentPlanType)} Plan</strong>
            <p>Select another plan below if you want to upgrade or switch your subscription.</p>
          </div>
        ) : null}
        {!emailVerified ? (
          <div className="current-plan-banner" style={{ borderColor: 'rgba(239,68,68,0.4)' }}>
            <span className="current-plan-label">Verification required</span>
            <strong>Verify your email before starting a subscription.</strong>
            <p>Check your inbox, then return to continue checkout.</p>
          </div>
        ) : null}
      </div>

      <div className="pricing-cards">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`pricing-card ${plan.popular ? 'popular' : ''} ${subscriptionIsActive && currentPlanType === plan.id ? 'active-plan-card' : ''}`}
          >
            {plan.popular ? <div className="popular-badge">MOST POPULAR</div> : null}
            <h2 className="plan-name">{plan.name}</h2>
            <div className={`plan-price ${plan.popular ? 'text-gold' : ''}`}>
              <span className="currency">$</span>
              <span className="amount">{plan.price.toFixed(2)}</span>
            </div>
            <p className="plan-period">per month</p>
            <p style={{ color: 'var(--text-muted)', minHeight: '42px' }}>{plan.description}</p>
            <ul className="plan-features">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <button
              className="btn-subscribe"
              onClick={() => handleSubscribe(plan.id)}
              disabled={!emailVerified || (subscriptionIsActive && currentPlanType === plan.id)}
            >
              {getPlanActionLabel(plan.id)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
