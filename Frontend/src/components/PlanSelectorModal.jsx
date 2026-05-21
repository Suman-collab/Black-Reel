import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';
import { plans, getPlanById } from '../lib/plans';
import { getActivePlanName, hasActiveSubscription } from '../lib/subscription';
import './PlanSelectorModal.css';

const getPlanActionLabel = (currentPlan, targetPlan, hasSubscription) => {
  if (!hasSubscription) {
    return 'Choose Plan';
  }

  if (currentPlan?.id === targetPlan.id) {
    return 'Current Plan';
  }

  if (!currentPlan) {
    return 'Choose Plan';
  }

  if (targetPlan.price > currentPlan.price) {
    return 'Upgrade';
  }

  if (targetPlan.price < currentPlan.price) {
    return 'Downgrade';
  }

  return 'Switch Plan';
};

export default function PlanSelectorModal({ isOpen, onClose, onSelectPlan, subscription }) {
  const subscriptionIsActive = hasActiveSubscription(subscription);
  const currentPlan = getPlanById(subscription?.planType);
  const renewalLabel = subscription?.renewalDate
    ? new Date(subscription.renewalDate).toLocaleDateString()
    : null;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="plan-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="plan-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Manage subscription"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="plan-modal-header">
          <div>
            <p className="plan-modal-kicker">Membership</p>
            <h2>Manage your plan</h2>
            <p className="plan-modal-copy">
              {subscriptionIsActive
                ? `Your current plan is ${getActivePlanName(subscription)}${renewalLabel ? ` and renews on ${renewalLabel}.` : '.'}`
                : 'Pick a plan to unlock premium features and continue to checkout.'}
            </p>
          </div>
          <button type="button" className="plan-modal-close" onClick={onClose} aria-label="Close plan selector">
            <X size={18} />
          </button>
        </div>

        <div className="plan-modal-grid">
          {plans.map((plan) => {
            const isCurrentPlan = subscriptionIsActive && subscription?.planType === plan.id;

            return (
              <section
                key={plan.id}
                className={`plan-modal-card ${plan.popular ? 'popular' : ''} ${isCurrentPlan ? 'current' : ''}`}
              >
                <div className="plan-modal-card-top">
                  <div>
                    <p className="plan-modal-card-title">{plan.name}</p>
                    <p className="plan-modal-card-price">${plan.price.toFixed(2)} / month</p>
                  </div>
                  {isCurrentPlan ? <span className="plan-modal-current-pill">Current</span> : null}
                </div>

                <p className="plan-modal-card-description">{plan.description}</p>

                <ul className="plan-modal-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                <Button
                  variant={isCurrentPlan ? 'outline' : 'primary'}
                  type="button"
                  disabled={isCurrentPlan}
                  onClick={() => onSelectPlan(plan.id)}
                >
                  {getPlanActionLabel(currentPlan, plan, subscriptionIsActive)}
                </Button>
              </section>
            );
          })}
        </div>

        <p className="plan-modal-footer">
          Switching plans keeps your account intact and sends you through the existing checkout flow before activation.
        </p>
      </div>
    </div>
  );
}
