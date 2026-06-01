import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StatePanel from '../components/StatePanel';
import { getPaymentHistory } from '../features/payments/payment.service';
import { clearCheckoutPaymentRef, getCheckoutPaymentRef } from '../lib/checkout';
import './CheckoutSuccess.css';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(location.state?.payment || null);
  const [planName, setPlanName] = useState(location.state?.planName || 'Subscription');
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || 'Payment completed successfully.');

  const isDummyMode = import.meta.env.VITE_PAYMENT_MODE === 'dummy';

  useEffect(() => {
    let isMounted = true;

    const hydratePayment = async () => {
      if (location.state?.payment) {
        setLoading(false);
        clearCheckoutPaymentRef();
        return;
      }

      const storedRef = getCheckoutPaymentRef();
      if (storedRef?.payment) {
        if (!isMounted) return;
        setPayment(storedRef.payment);
        setPlanName(storedRef.planName || planName);
        setLoading(false);
        clearCheckoutPaymentRef();
        return;
      }

      try {
        const history = await getPaymentHistory();
        if (!isMounted) return;
        const latest = history[0] || null;
        setPayment(latest);
        if (storedRef?.planName) {
          setPlanName(storedRef.planName);
        }
        if (latest) {
          setSuccessMessage('Payment completed successfully.');
          clearCheckoutPaymentRef();
        }
      } catch {
        
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    hydratePayment();

    return () => {
      isMounted = false;
    };
  }, [location.state, planName]);

  if (loading) {
    return <StatePanel title="Finalizing your receipt" message="Loading your latest payment confirmation..." />;
  }

  if (!payment) {
    return (
      <StatePanel
        title="No payment session found"
        message="We could not find a recent checkout result. Please retry subscription checkout."
        actionLabel="Back to Plans"
        onAction={() => navigate(isDummyMode ? '/plans' : '/subscribe')}
      />
    );
  }

  const currencySymbol = '₹';
  
  
  const expiryDate = payment.nextBillingDate || payment.renewalDate || (() => {
    const d = new Date(payment.paidAt || new Date());
    d.setDate(d.getDate() + 30);
    return d;
  })();

  return (
    <div className="checkout-success-page container">
      <div className="checkout-success-card" style={{ maxWidth: '600px', margin: '40px auto' }}>
        <div className="success-icon-container" style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            background: 'rgba(74, 222, 128, 0.1)',
            borderRadius: '50%',
            color: '#4ade80',
            fontSize: '48px'
          }}>
            ✓
          </div>
        </div>

        <p className="checkout-success-kicker" style={{ textAlign: 'center' }}>
          {isDummyMode ? 'Dummy Gateway Demo' : 'Razorpay Secure'}
        </p>
        <h1 className="checkout-success-title" style={{ textAlign: 'center' }}>Payment Successful!</h1>
        <p className="checkout-success-message" style={{ textAlign: 'center' }}>{successMessage}</p>

        <div className="checkout-success-summary" style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '16px',
          padding: '20px',
          margin: '24px 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Plan</span>
            <strong style={{ display: 'block', color: '#fff', fontSize: '16px', marginTop: '4px' }}>{planName}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Amount Paid</span>
            <strong style={{ display: 'block', color: '#fff', fontSize: '16px', marginTop: '4px' }}>{currencySymbol}{payment.amount}</strong>
          </div>
          <div style={{ gridColumn: 'span 2', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Transaction ID</span>
            <strong style={{ display: 'block', color: '#fff', fontSize: '14px', marginTop: '4px', wordBreak: 'break-all' }}>{payment.transactionId}</strong>
          </div>
          <div style={{ gridColumn: 'span 2', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Subscription Ends On</span>
            <strong style={{ display: 'block', color: '#fff', fontSize: '14px', marginTop: '4px' }}>
              {new Date(expiryDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
            </strong>
          </div>
        </div>

        <div className="checkout-success-actions" style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            className="checkout-success-btn primary"
            onClick={() => navigate('/profile')}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: 'bold',
              border: 'none',
              background: 'var(--gold-primary)',
              color: '#000',
              cursor: 'pointer'
            }}
          >
            View Billing History
          </button>
          <button
            type="button"
            className="checkout-success-btn secondary"
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: 'bold',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Start Watching
          </button>
        </div>
      </div>
    </div>
  );
}
