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

      // Fixed: fallback fetch for refresh-safe success page.
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
        // handled by empty state below
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
        onAction={() => navigate('/subscribe')}
      />
    );
  }

  return (
    <div className="checkout-success-page container">
      <div className="checkout-success-card">
        <p className="checkout-success-kicker">Razorpay Demo</p>
        <h1 className="checkout-success-title">Payment Successful</h1>
        <p className="checkout-success-message">{successMessage}</p>

        <div className="checkout-success-summary">
          <div>
            <span>Plan</span>
            <strong>{planName}</strong>
          </div>
          <div>
            <span>Amount</span>
            <strong>${Number(payment.amount || 0).toFixed(2)}</strong>
          </div>
          <div>
            <span>Transaction</span>
            <strong>{payment.transactionId}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong className="checkout-success-status">{payment.status}</strong>
          </div>
        </div>

        <div className="checkout-success-actions">
          <button type="button" className="checkout-success-btn primary" onClick={() => navigate('/payment-history')}>
            View Payment History
          </button>
          <button type="button" className="checkout-success-btn secondary" onClick={() => navigate('/')}>
            Continue Watching
          </button>
        </div>
      </div>
    </div>
  );
}
