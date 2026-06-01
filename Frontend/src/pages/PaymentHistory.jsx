import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StatePanel from '../components/StatePanel';
import { getPaymentHistory } from '../features/payments/payment.service';
import { useAuth } from '../features/auth/AuthContext';
import { consumeCheckoutSuccessMessage } from '../lib/checkout';
import { formatPlanName, hasActiveSubscription } from '../lib/subscription';
import './PaymentHistory.css';

export default function PaymentHistory() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');

  const isDummyMode = import.meta.env.VITE_PAYMENT_MODE === 'dummy';

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      return;
    }

    setSuccessMessage(consumeCheckoutSuccessMessage());
  }, [location.state]);

  useEffect(() => {
    refreshUser().catch(() => null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      setLoading(true);
      setError('');

      try {
        const paymentHistory = await getPaymentHistory();

        if (isMounted) {
          setHistory(paymentHistory);
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <StatePanel title="Loading payment history" message="Fetching your subscription invoices and billing timeline." />;
  }

  if (error) {
    return <StatePanel title="Billing history unavailable" message={error} />;
  }

  const currentSubscription = user?.subscription;
  const subscriptionIsActive = hasActiveSubscription(currentSubscription);

  return (
    <div className="payment-history-page container">
      {isDummyMode && (
        <div style={{
          background: '#fef08a',
          color: '#854d0e',
          padding: '12px 20px',
          borderRadius: '12px',
          fontWeight: 'bold',
          marginBottom: '24px',
          border: '1px solid #fef08a',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '1rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <span>⚠️</span> TEST MODE — No real payments will be processed
        </div>
      )}

      <div className="page-header center">
        <h1 className="page-title text-gold" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Billing & Subscriptions</h1>
        <p className="page-subtitle" style={{ color: 'var(--text-muted)' }}>Manage your membership and view invoices</p>
        {successMessage ? (
          <p className="payment-success-banner" style={{
            background: 'rgba(74,222,128,0.15)',
            border: '1px solid rgba(74,222,128,0.3)',
            color: '#4ade80',
            padding: '12px',
            borderRadius: '12px',
            marginTop: '16px'
          }}>{successMessage}</p>
        ) : null}
      </div>

      {}
      <div className="subscription-summary-box" style={{
        background: 'linear-gradient(145deg, rgba(30, 30, 30, 0.98), rgba(17, 17, 17, 0.98))',
        border: '1px solid rgba(212, 184, 114, 0.18)',
        borderRadius: '18px',
        padding: '24px',
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.2)'
      }}>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>CURRENT PLAN</span>
          <strong style={{ fontSize: '20px', color: '#fff' }}>
            {subscriptionIsActive ? `${formatPlanName(currentSubscription?.planType)} Membership` : 'No Active Membership'}
          </strong>
          {subscriptionIsActive && (
            <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span>Status: </span>
              <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{currentSubscription?.status?.toUpperCase()}</span>
              {currentSubscription?.renewalDate && (
                <span style={{ marginLeft: '12px' }}>
                  | Renewal Date: <strong>{new Date(currentSubscription.renewalDate).toLocaleDateString()}</strong>
                </span>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate(isDummyMode ? '/plans' : '/subscribe')}
          style={{
            background: 'var(--gold-primary)',
            color: '#000',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {subscriptionIsActive ? 'Change Plan' : 'View Plans'}
        </button>
      </div>

      {}
      <div className="payment-table-container">
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#fff' }}>Billing Invoices</h2>
        <table className="payment-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Plan</th>
              <th>Transaction ID</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((payment) => {
              const isSuccess = payment.status === 'success' || payment.status === 'completed';
              const currencySymbol = '₹';
              return (
                <tr key={payment.id || payment._id}>
                  <td>{new Date(payment.createdAt || payment.paidAt).toLocaleDateString()}</td>
                  <td>{payment.plan || payment.planName || formatPlanName(payment.planType)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{payment.transactionId}</td>
                  <td>{payment.paymentMethod || 'Card payment'}</td>
                  <td>{currencySymbol}{payment.amount}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: isSuccess ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: isSuccess ? '#4ade80' : '#f87171'
                    }}>
                      {isSuccess ? 'Success' : 'Failed'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {history.length === 0 ? (
          <p style={{ marginTop: '20px', color: 'var(--text-muted)' }}>No payment history. Subscribe to a plan to start your billing history.</p>
        ) : null}
      </div>
    </div>
  );
}
