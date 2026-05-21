import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StatePanel from '../components/StatePanel';
import './CheckoutSuccess.css';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.successMessage || 'Payment completed successfully.';
  const payment = location.state?.payment || null;
  const planName = location.state?.planName || 'Subscription';

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
