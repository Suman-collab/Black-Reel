import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import StatePanel from '../components/StatePanel';
import { getPaymentHistory } from '../features/payments/payment.service';
import { useAuth } from '../features/auth/AuthContext';
import { consumeCheckoutSuccessMessage } from '../lib/checkout';
import './PaymentHistory.css';

export default function PaymentHistory() {
  const location = useLocation();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      return;
    }

    setSuccessMessage(consumeCheckoutSuccessMessage());
  }, [location.state]);

  useEffect(() => {
    refreshUser().catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <div className="payment-history-page container">
      <div className="page-header center">
        <img src="/images/Vertical%20logo/Black-Shortz.png" alt="Black Shortz Logo" className="logo-header" />
        <h1 className="page-title text-gold">Payment History</h1>
        {successMessage ? (
          <p className="payment-success-banner">{successMessage}</p>
        ) : null}
      </div>

      <div className="payment-table-container">
        <table className="payment-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((payment) => (
              <tr key={payment.id}>
                <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                <td>{payment.plan} Membership</td>
                <td>{payment.paymentMethod}</td>
                <td>${payment.amount.toFixed(2)}</td>
                <td className="text-gold">{payment.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {history.length === 0 ? <p style={{ marginTop: '20px' }}>No payments yet. Subscribe to a plan to start your billing history.</p> : null}
      </div>
    </div>
  );
}
