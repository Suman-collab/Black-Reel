import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import StatePanel from '../components/StatePanel';
import {
  cancelCheckoutSession,
  confirmCheckoutSession,
  createRazorpayOrder,
  createDummyOrder,
  processDummyPayment,
} from '../features/payments/payment.service';
import { useAuth } from '../features/auth/AuthContext';
import {
  clearCheckoutDraft,
  getCheckoutDraft,
  saveCheckoutDraft,
  setCheckoutSuccessMessage,
  setCheckoutPaymentRef,
  clearCheckoutPaymentRef,
} from '../lib/checkout';
import { getPlanById } from '../lib/plans';
import { formatPlanName, hasActiveSubscription } from '../lib/subscription';
import { toast } from '../lib/toast';
import './Checkout.css';

const formatCardNumber = (value) =>
  value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim();

const detectCardBrand = (cardNumber) => {
  if (/^4/.test(cardNumber)) {
    return 'Visa';
  }

  if (/^(5[1-5]|2[2-7])/.test(cardNumber)) {
    return 'Mastercard';
  }

  if (/^3[47]/.test(cardNumber)) {
    return 'Amex';
  }

  return 'Card';
};

const normalizeExpiryDate = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const isExpiryDateValid = (value) => {
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) {
    return false;
  }

  const [month, year] = value.split('/').map((part) => Number(part));
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  return new Date(2000 + year, month, 1) > currentMonth;
};

const buildInitialFormState = (user, draft) => ({
  billingEmail: user?.email || draft?.billingEmail || '',
  cardholderName: draft?.cardholderName || user?.name || '',
  cardNumber: '',
  expiryDate: '',
  cvv: '',
});


const DUMMY_PLANS = {
  basic: { id: 'basic', name: 'Basic', price: 99, currency: 'INR', features: ['HD Streaming', '1 Screen', 'Mobile & Tablet'] },
  standard: { id: 'standard', name: 'Standard', price: 199, currency: 'INR', features: ['Full HD Streaming', '2 Screens', 'All Devices', 'Downloads'], popular: true },
  premium: { id: 'premium', name: 'Premium', price: 299, currency: 'INR', features: ['4K + HDR', '4 Screens', 'All Devices', 'Downloads', 'Dolby Audio'] },
};

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateUser, refreshUser, logout } = useAuth();
  const planType = searchParams.get('plan') || '';
  const querySessionId = searchParams.get('session') || '';

  const isDummyMode = import.meta.env.VITE_PAYMENT_MODE === 'dummy';

  
  const selectedPlan = useMemo(() => {
    if (isDummyMode) {
      return DUMMY_PLANS[planType] || null;
    }
    return getPlanById(planType);
  }, [planType, isDummyMode]);

  const selectedPlanId = selectedPlan?.id || '';
  const currentSubscription = user?.subscription;
  const samePlanSelected =
    selectedPlan &&
    hasActiveSubscription(currentSubscription) &&
    currentSubscription.planType === selectedPlan.id;

  const [formState, setFormState] = useState(() =>
    buildInitialFormState(user, selectedPlan ? getCheckoutDraft(selectedPlan.id) : null)
  );
  const [submitting, setSubmitting] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [checkoutSessionId, setCheckoutSessionId] = useState('');
  const [, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showTestCards, setShowTestCards] = useState(true);

  

  useEffect(() => {
    if (!selectedPlanId) {
      return;
    }

    const savedDraft = getCheckoutDraft(selectedPlanId);
    const restoredSessionId = querySessionId || savedDraft?.checkoutSessionId || '';
    setFormState(buildInitialFormState(user, savedDraft));
    setCheckoutSessionId(restoredSessionId);
    setNotice(
      savedDraft
        ? `We restored your billing details after reload. For security, please re-enter your card number, expiry date, and CVV.${restoredSessionId ? ' Your checkout session is also restored.' : ''}`
        : ''
    );
    setError('');
  }, [selectedPlanId, user, querySessionId]);

  useEffect(() => {
    if (!selectedPlanId) {
      return;
    }

    saveCheckoutDraft(selectedPlanId, {
      billingEmail: formState.billingEmail,
      cardholderName: formState.cardholderName,
      checkoutSessionId,
    });
  }, [selectedPlanId, formState.billingEmail, formState.cardholderName, checkoutSessionId]);

  useEffect(() => {
    if (!selectedPlanId || checkoutSessionId) {
      return;
    }

    let isMounted = true;

    const startCheckoutSession = async () => {
      setSessionLoading(true);
      setError('');

      try {
        if (isDummyMode) {
          const order = await createDummyOrder(selectedPlanId);
          if (isMounted) {
            setCheckoutSessionId(order.orderId);
            setCheckoutPaymentRef({ checkoutSessionId: order.orderId, planName: selectedPlan?.name || '' });
          }
        } else {
          const order = await createRazorpayOrder({
            planType: selectedPlanId,
            billingEmail: user?.email,
          });

          if (isMounted) {
            setCheckoutSessionId(order.checkoutSessionId);
            setCheckoutPaymentRef({ checkoutSessionId: order.checkoutSessionId, planName: selectedPlan?.name || '' });
          }
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError.message || 'Unable to start checkout. Please try again.');
        }
      } finally {
        if (isMounted) {
          setSessionLoading(false);
        }
      }
    };

    startCheckoutSession();

    return () => {
      isMounted = false;
    };
  }, [selectedPlanId, checkoutSessionId, user?.email, isDummyMode]);

  if (!selectedPlan) {
    return (
      <StatePanel
        title="Choose a plan first"
        message="Pick the membership you want before continuing to checkout."
        actionLabel="View Plans"
        onAction={() => navigate(isDummyMode ? '/plans' : '/subscribe')}
      />
    );
  }

  if (samePlanSelected) {
    return (
      <StatePanel
        title={`${formatPlanName(selectedPlan.id)} is already active`}
        message="Choose a different plan if you want to upgrade or switch your membership."
        actionLabel="Manage Plans"
        onAction={() => navigate(isDummyMode ? '/plans' : '/subscribe')}
      />
    );
  }

  const handleCancel = async () => {
    if (checkoutSessionId && !isDummyMode) {
      try {
        await cancelCheckoutSession({
          checkoutSessionId,
          reason: 'Checkout cancelled by user',
        });
      } catch {
        // best-effort cancellation before leaving checkout
      }
    }

    clearCheckoutDraft(selectedPlan.id);
    setCheckoutSessionId('');
    clearCheckoutPaymentRef();
    navigate(isDummyMode ? '/plans' : '/subscribe', {
      replace: true,
      state: {
        checkoutMessage: 'Payment cancelled. Your subscription has not been changed.',
      },
    });
  };

  const handleLogout = async () => {
    if (logout) {
      await logout();
      navigate('/login');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    if (!checkoutSessionId) {
      toast.warning('Checkout session is not ready yet. Please wait a moment and try again.');
      setSubmitting(false);
      return;
    }

    const billingEmail = user?.email || formState.billingEmail.trim().toLowerCase();
    const cardholderName = formState.cardholderName.trim();
    const cleanCardNumber = formState.cardNumber.replace(/\D/g, '');
    const cleanCvv = formState.cvv.replace(/\D/g, '');

    if (!billingEmail) {
      toast.warning('Enter the billing email you want to use for this subscription.');
      setSubmitting(false);
      return;
    }

    if (!cardholderName) {
      toast.warning('Enter the cardholder name to continue.');
      setSubmitting(false);
      return;
    }

    if (cleanCardNumber.length !== 16) {
      toast.warning('Card number must be exactly 16 digits.');
      setSubmitting(false);
      return;
    }

    if (!formState.expiryDate || formState.expiryDate.length !== 5) {
      toast.warning('Use a valid expiry date in MM/YY format.');
      setSubmitting(false);
      return;
    }

    if (!isExpiryDateValid(formState.expiryDate)) {
      toast.warning('Use a valid future expiry date in MM/YY format.');
      setSubmitting(false);
      return;
    }

    const [monthStr, yearStr] = formState.expiryDate.split('/');
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    if (month < 1 || month > 12) {
      toast.warning('Expiry month must be between 01 and 12.');
      setSubmitting(false);
      return;
    }

    if (cleanCvv.length < 3 || cleanCvv.length > 4) {
      toast.warning('CVV must be 3 or 4 digits.');
      setSubmitting(false);
      return;
    }

    try {
      if (isDummyMode) {
        const payload = {
          orderId: checkoutSessionId,
          planId: selectedPlanId,
          cardNumber: cleanCardNumber,
          expiryMonth: month,
          expiryYear: year + 2000,
          cvv: cleanCvv,
          cardholderName,
        };

        const result = await processDummyPayment(payload);

        if (!result.success) {
          toast.error(result.message || 'Payment was declined. Please try again.');
          setSubmitting(false);
          return;
        }

        const successMessage = `${selectedPlan.name} plan activated successfully.`;
        clearCheckoutDraft(selectedPlan.id);
        setCheckoutSessionId('');
        setCheckoutSuccessMessage(successMessage);
        
        
        const mockPaymentObj = {
          id: result.transactionId,
          transactionId: result.transactionId,
          orderId: result.orderId,
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          amount: selectedPlan.price,
          currency: selectedPlan.currency || 'INR',
          status: 'success',
          cardLast4: cleanCardNumber.slice(-4),
          cardBrand: detectCardBrand(cleanCardNumber),
          paidAt: new Date().toISOString(),
          nextBillingDate: result.subscriptionEnd,
        };

        setCheckoutPaymentRef({
          checkoutSessionId,
          paymentId: result.transactionId,
          planName: selectedPlan.name,
          payment: mockPaymentObj
        });

        updateUser((currentUser) => {
          if (!currentUser) return currentUser;
          return {
            ...currentUser,
            subscription: {
              ...currentUser.subscription,
              planType: selectedPlan.id,
              status: 'active',
              startedAt: new Date().toISOString(),
              renewalDate: result.subscriptionEnd,
            },
          };
        });

        await refreshUser().catch(() => null);

        navigate('/checkout/success', {
          replace: true,
          state: {
            successMessage,
            payment: mockPaymentObj,
            planName: selectedPlan.name,
          },
        });

      } else {
        const paymentMethod = `Razorpay ${detectCardBrand(cleanCardNumber)} ending ${cleanCardNumber.slice(-4)}`;
        const payment = await confirmCheckoutSession({
          checkoutSessionId,
          paymentMethod,
        });
        const successMessage = `${selectedPlan.name} plan activated successfully.`;

        clearCheckoutDraft(selectedPlan.id);
        setCheckoutSessionId('');
        setCheckoutSuccessMessage(successMessage);
        setCheckoutPaymentRef({ checkoutSessionId, paymentId: payment.id, planName: selectedPlan.name, payment });

        updateUser((currentUser) => {
          if (!currentUser) return currentUser;
          return {
            ...currentUser,
            subscription: {
              ...currentUser.subscription,
              planType: selectedPlan.id,
              status: 'active',
              startedAt: new Date().toISOString(),
              renewalDate: payment.nextBillingDate || currentUser.subscription?.renewalDate,
            },
          };
        });

        await refreshUser().catch(() => null);

        navigate('/checkout/success', {
          replace: true,
          state: {
            successMessage,
            payment,
            planName: selectedPlan.name,
          },
        });
      }
    } catch (apiError) {
      toast.error(apiError.message || 'Payment processing encountered an error.');
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitDisabled = submitting || sessionLoading || !checkoutSessionId;
  const currencySymbol = '₹';
  let submitLabel = `Pay ${currencySymbol}${selectedPlan.price}`;

  if (sessionLoading) {
    submitLabel = 'Preparing Checkout...';
  } else if (submitting) {
    submitLabel = 'Processing Payment...';
  }

  return (
    <div className="checkout-page container">
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

      <div className="checkout-layout">
        <section className="checkout-panel checkout-form-panel">
          <p className="checkout-kicker">Secure Checkout</p>
          <h1 className="checkout-title">Complete your {selectedPlan.name} membership</h1>
          <p className="checkout-copy">
            Your subscription and billing are tied to the logged-in account for security and account consistency.
          </p>
          <p className="checkout-note">
            Secure payment confirmation requires valid account details and an active checkout session.
          </p>
          {notice ? <p className="checkout-restored-message">{notice}</p> : null}

          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Billing email</label>
              <div>
                <input
                  type="email"
                  className="form-input"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.7, cursor: 'not-allowed', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  You are subscribing as: <strong>{user?.email}</strong>
                  <br />
                  <button type="button" onClick={handleLogout} className="checkout-back-link" style={{ padding: 0, marginTop: '4px', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-primary)' }}>
                    Please log out to use a different account
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Cardholder name</label>
              <input
                type="text"
                className="form-input"
                value={formState.cardholderName}
                onChange={(event) => setFormState((current) => ({ ...current, cardholderName: event.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Card number</label>
              <input
                type="text"
                className="form-input"
                inputMode="numeric"
                autoComplete="cc-number"
                value={formState.cardNumber}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, cardNumber: formatCardNumber(event.target.value) }))
                }
                placeholder="4242 4242 4242 4242"
                required
              />
            </div>

            <div className="checkout-row" style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Expiry</label>
                <input
                  type="text"
                  className="form-input"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  value={formState.expiryDate}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      expiryDate: normalizeExpiryDate(event.target.value),
                    }))
                  }
                  placeholder="MM/YY"
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">CVV</label>
                <input
                  type="password"
                  className="form-input"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={formState.cvv}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      cvv: event.target.value.replace(/\D/g, '').slice(0, 4),
                    }))
                  }
                  placeholder="123"
                  required
                />
              </div>
            </div>



            {isDummyMode && (
              <div className="test-cards-box" style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(212, 184, 114, 0.2)',
                borderRadius: '12px',
                marginTop: '10px',
                overflow: 'hidden'
              }}>
                <button
                  type="button"
                  onClick={() => setShowTestCards(!showTestCards)}
                  style={{
                    width: '100%',
                    background: 'rgba(212, 184, 114, 0.08)',
                    border: 'none',
                    padding: '10px 14px',
                    color: '#dfa13d',
                    fontWeight: 'bold',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>💳 Test Cards for Dummy Mode</span>
                  <span>{showTestCards ? '▲' : '▼'}</span>
                </button>

                {showTestCards && (
                  <div style={{ padding: '12px 14px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                      <strong>CARD NUMBER</strong>
                      <strong>SIMULATED RESULT</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <code style={{ color: '#4ade80' }}>4242 4242 4242 4242</code>
                      <span style={{ color: '#4ade80' }}>✅ Always succeeds (Visa)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <code style={{ color: '#4ade80' }}>5555 5555 5555 4444</code>
                      <span style={{ color: '#4ade80' }}>✅ Always succeeds (Mastercard)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <code style={{ color: '#f87171' }}>4000 0000 0000 0002</code>
                      <span style={{ color: '#f87171' }}>❌ Card declined</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <code style={{ color: '#f87171' }}>4000 0000 0000 9995</code>
                      <span style={{ color: '#f87171' }}>❌ Insufficient funds</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <code style={{ color: '#f87171' }}>4000 0000 0000 0069</code>
                      <span style={{ color: '#f87171' }}>❌ Expired card</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <code style={{ color: '#f87171' }}>4000 0000 0000 0127</code>
                      <span style={{ color: '#f87171' }}>❌ Incorrect CVC</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                      Use any future expiry date (e.g. 12/28) and any 3-digit CVV.
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="checkout-actions" style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <Button variant="primary" type="submit" disabled={isSubmitDisabled} className="btn-block">
                {submitLabel}
              </Button>
              <button type="button" className="btn btn-ghost btn-block" onClick={handleCancel}>
                Cancel payment
              </button>
            </div>
          </form>
        </section>

        <aside className="checkout-panel checkout-summary-panel">
          <p className="checkout-kicker">Order Summary</p>
          <h2 className="checkout-summary-title">{selectedPlan.name}</h2>
          <p className="checkout-summary-price">{currencySymbol}{selectedPlan.price} / month</p>
          <ul className="checkout-benefits">
            {selectedPlan.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <div className="checkout-summary-meta">
            <div>
              <span>Account</span>
              <strong>{user?.email}</strong>
            </div>
            <div>
              <span>Current plan</span>
              <strong>{formatPlanName(currentSubscription?.planType)}</strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
