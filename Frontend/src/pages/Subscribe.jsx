import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToPlan } from '../features/payments/payment.service';
import { useAuth } from '../features/auth/AuthContext';
import './Subscribe.css';

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: '4.99',
    description: 'A starter plan for casual watching.',
    features: ['Watch on 1 device', 'Access to all originals', 'Ad-supported'],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '7.99',
    description: 'Best for regular streaming on multiple devices.',
    features: ['Watch on 2 devices', 'Access to all originals', 'Ad-free'],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '9.99',
    description: 'Full premium access for families and binge-watchers.',
    features: ['Watch on 4 devices', 'Access to all originals', 'Ad-free'],
  },
];

export default function Subscribe() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState('');
  const [error, setError] = useState('');

  const handleSubscribe = async (planType) => {
    setLoadingPlan(planType);
    setError('');

    try {
      await subscribeToPlan(planType);
      await refreshUser();
      navigate('/payment-history');
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoadingPlan('');
    }
  };

  return (
    <div className="subscribe-page container">
      <div className="subscribe-header">
        <h1 className="subscribe-title text-gold">Subscribe</h1>
        <p className="subscribe-subtitle">Choose the plan that&apos;s right for you</p>
        {error ? <p style={{ color: '#ffb3b3', marginTop: '16px' }}>{error}</p> : null}
      </div>

      <div className="pricing-cards">
        {plans.map((plan) => (
          <div key={plan.id} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
            {plan.popular ? <div className="popular-badge">MOST POPULAR</div> : null}
            <h2 className="plan-name">{plan.name}</h2>
            <div className={`plan-price ${plan.popular ? 'text-gold' : ''}`}>
              <span className="currency">$</span>
              <span className="amount">{plan.price}</span>
            </div>
            <p className="plan-period">per month</p>
            <p style={{ color: 'var(--text-muted)', minHeight: '42px' }}>{plan.description}</p>
            <ul className="plan-features">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <button className="btn-subscribe" onClick={() => handleSubscribe(plan.id)} disabled={loadingPlan === plan.id}>
              {loadingPlan === plan.id ? 'PROCESSING...' : 'SUBSCRIBE'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
