import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import axios from 'axios';
import { hasActiveSubscription } from '../lib/subscription';
import './Subscribe.css';

export default function Plans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plansList, setPlansList] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get('/api/v1/payments/plans');
        if (response.data?.success) {
          setPlansList(response.data.plans);
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
        
        setPlansList([
          {
            id: 'basic',
            name: 'Basic',
            price: 99,
            currency: 'INR',
            features: ['HD Streaming', '1 Screen', 'Mobile & Tablet'],
          },
          {
            id: 'standard',
            name: 'Standard',
            price: 199,
            currency: 'INR',
            features: ['Full HD Streaming', '2 Screens', 'All Devices', 'Downloads'],
            popular: true,
          },
          {
            id: 'premium',
            name: 'Premium',
            price: 299,
            currency: 'INR',
            features: ['4K + HDR', '4 Screens', 'All Devices', 'Downloads', 'Dolby Audio'],
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleGetStarted = (planId) => {
    if (!user) {
      navigate('/login', { state: { from: '/plans' } });
      return;
    }

    if (hasActiveSubscription(user.subscription) && user.subscription?.planType === planId) {
      setErrorMsg('You already have this subscription plan active.');
      return;
    }

    navigate(`/checkout?plan=${planId}`);
  };

  if (loading) {
    return (
      <div className="subscribe-page container text-center" style={{ padding: '80px 20px' }}>
        <h2 className="text-gold">Loading plans...</h2>
      </div>
    );
  }

  return (
    <div className="subscribe-page container animate-fade-in-up">
      <div className="subscribe-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="subscribe-title text-gold" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)' }}>Choose Your Plan</h1>
        <p className="subscribe-subtitle" style={{ color: 'var(--text-secondary)' }}>Simulate our premium experience end-to-end</p>
        {errorMsg && <p className="error-message" style={{ color: '#ef4444', marginTop: '10px', fontSize: '1.1rem' }}>⚠️ {errorMsg}</p>}
      </div>

      <div className="plans-grid">
        {plansList.map((plan) => {
          const isPopular = plan.id === 'standard' || plan.popular;
          const currentSubscriptionIsActive = hasActiveSubscription(user?.subscription);
          const isCurrentPlan = user?.subscription?.planType === plan.id && currentSubscriptionIsActive;

          return (
            <div
              key={plan.id}
              className={`plan-card ${isPopular ? 'plan-card--featured' : ''} ${isCurrentPlan ? 'active-plan-card' : ''}`}
            >
              {isPopular && <div className="plan-card__badge">MOST POPULAR</div>}
              <h2 className="plan-card__name">{plan.name}</h2>
              <div className="plan-card__price">
                <span className="plan-card__price-amount">
                  ₹{plan.price}
                </span>
                <span className="plan-card__price-period">/ month</span>
              </div>
              
              <ul className="plan-card__features">
                {plan.features?.map((feature, idx) => (
                  <li key={idx} className="plan-card__feature">
                    <span className="plan-card__feature-icon">✓</span> {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`btn ${isCurrentPlan ? 'btn-outline' : 'btn-primary'} btn-block`}
                onClick={() => handleGetStarted(plan.id)}
                disabled={isCurrentPlan}
                style={{ marginTop: 'auto' }}
              >
                {isCurrentPlan ? 'Current Plan' : 'Get Started'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
