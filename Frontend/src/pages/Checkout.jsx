import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import StatePanel from '../components/StatePanel';
import {
  cancelCheckoutSession,
  createRazorpayOrder,
  verifyRazorpayPayment,
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

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateUser, refreshUser, logout } = useAuth();
  const planType = searchParams.get('plan') || '';
  const querySessionId = searchParams.get('session') || '';
  const selectedPlan = useMemo(() => getPlanById(planType), [planType]);
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
  const [razorpayOrderId, setRazorpayOrderId] = useState('');
  const [checkoutSessionId, setCheckoutSessionId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

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

    // Only persist non-sensitive fields across reloads. Card details stay in
    // memory so a refresh never leaves payment data behind in browser storage.
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
        const order = await createRazorpayOrder({
          planType: selectedPlanId,
          billingEmail: user?.email,
        });

        if (isMounted) {
          setCheckoutSessionId(order.checkoutSessionId);
          setRazorpayOrderId(order.orderId);
          // Fixed: store payment reference for refresh-safe success page rendering.
          setCheckoutPaymentRef({ checkoutSessionId: order.checkoutSessionId, planName: selectedPlan?.name || '' });
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
  }, [selectedPlanId, checkoutSessionId, user?.email]);

  if (!selectedPlan) {
    return (
      <StatePanel
        title="Choose a plan first"
        message="Pick the membership you want before continuing to checkout."
        actionLabel="View Plans"
        onAction={() => navigate('/subscribe')}
      />
    );
  }

  if (samePlanSelected) {
    return (
      <StatePanel
        title={`${formatPlanName(selectedPlan.id)} is already active`}
        message="Choose a different plan if you want to upgrade or switch your membership."
        actionLabel="Manage Plans"
        onAction={() => navigate('/subscribe')}
      />
    );
  }

  const handleCancel = async () => {
    if (checkoutSessionId) {
      try {
        await cancelCheckoutSession({
          checkoutSessionId,
          reason: 'Checkout cancelled by user',
        });
      } catch {
        // Ignore cancellation API failures and continue returning to plans.
      }
    }

    clearCheckoutDraft(selectedPlan.id);
      setCheckoutSessionId('');
      setRazorpayOrderId('');
      clearCheckoutPaymentRef();
    navigate('/subscribe', {
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
      setError('Checkout session is not ready yet. Please wait a moment and try again.');
      setSubmitting(false);
      return;
    }

    const billingEmail = user?.email || formState.billingEmail.trim().toLowerCase();
    const cardholderName = formState.cardholderName.trim();
    const cleanCardNumber = formState.cardNumber.replace(/\D/g, '');
    const cleanCvv = formState.cvv.replace(/\D/g, '');

    if (!billingEmail) {
      setError('Enter the billing email you want to use for this subscription.');
      setSubmitting(false);
      return;
    }

    if (!cardholderName) {
      setError('Enter the cardholder name to continue.');
      setSubmitting(false);
      return;
    }

    if (cleanCardNumber.length < 12) {
      setError('Enter a valid card number to continue.');
      setSubmitting(false);
      return;
    }

    if (!isExpiryDateValid(formState.expiryDate)) {
      setError('Use a valid future expiry date in MM/YY format.');
      setSubmitting(false);
      return;
    }

    if (cleanCvv.length < 3) {
      setError('Enter a valid security code.');
      setSubmitting(false);
      return;
    }

    try {
      const paymentMethod = `Razorpay ${detectCardBrand(cleanCardNumber)} ending ${cleanCardNumber.slice(-4)}`;
      const mockPaymentId = `pay_${Date.now()}_${cleanCardNumber.slice(-4)}`;
      const mockSignature = `mocksig_${razorpayOrderId || checkoutSessionId}_${mockPaymentId}`;

      const payment = await verifyRazorpayPayment({
        checkoutSessionId,
        razorpay_order_id: razorpayOrderId || `order_${checkoutSessionId}`,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
        paymentMethod,
      });
      const successMessage = `${selectedPlan.name} plan activated successfully.`;

      clearCheckoutDraft(selectedPlan.id);
      setCheckoutSessionId('');
      setRazorpayOrderId('');
      setCheckoutSuccessMessage(successMessage);
      setCheckoutPaymentRef({ checkoutSessionId, paymentId: payment.id, planName: selectedPlan.name, payment });

      updateUser((currentUser) => {
        if (!currentUser) {
          return currentUser;
        }

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

      // Pull canonical profile data from API so all surfaces (navbar/profile/
      // settings) reflect exactly what backend stored.
      await refreshUser().catch(() => null);

      navigate('/checkout/success', {
        replace: true,
        state: {
          successMessage,
          payment,
          planName: selectedPlan.name,
        },
      });
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitDisabled = submitting || sessionLoading || !checkoutSessionId;
  let submitLabel = `Pay $${selectedPlan.price.toFixed(2)}`;

  if (sessionLoading) {
    submitLabel = 'Preparing Checkout...';
  } else if (submitting) {
    submitLabel = 'Processing Payment...';
  }

  return (
    <div className="checkout-page container">
      <div className="checkout-layout">
        <section className="checkout-panel checkout-form-panel">
          <p className="checkout-kicker">Secure Checkout</p>
          <h1 className="checkout-title">Complete your {selectedPlan.name} membership</h1>
          <p className="checkout-copy">
            Your subscription and billing are tied to the logged-in account for security and account consistency.
          </p>
          <p className="checkout-note">
            Demo Razorpay pipeline: enter valid-looking details, then we simulate Razorpay order verification and show a success screen.
          </p>
          {notice ? <p className="checkout-restored-message">{notice}</p> : null}

          <form className="checkout-form" onSubmit={handleSubmit}>
            <label className="checkout-field">
              <span>Billing email</span>
              {user?.email ? (
                <div>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  />
                  <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    You are subscribing as: <strong>{user.email}</strong>
                    <br />
                    <button type="button" onClick={handleLogout} className="checkout-back-link" style={{ padding: 0, marginTop: '4px', fontSize: '13px' }}>
                      Please log out to use a different account
                    </button>
                  </div>
                </div>
              ) : (
                <input
                  type="email"
                  value={formState.billingEmail}
                  onChange={(event) => setFormState((current) => ({ ...current, billingEmail: event.target.value }))}
                  required
                />
              )}
            </label>

            <label className="checkout-field">
              <span>Cardholder name</span>
              <input
                type="text"
                value={formState.cardholderName}
                onChange={(event) => setFormState((current) => ({ ...current, cardholderName: event.target.value }))}
                required
              />
            </label>

            <label className="checkout-field">
              <span>Card number</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                value={formState.cardNumber}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, cardNumber: formatCardNumber(event.target.value) }))
                }
                placeholder="4242 4242 4242 4242"
                required
              />
            </label>

            <div className="checkout-row">
              <label className="checkout-field">
                <span>Expiry</span>
                <input
                  type="text"
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
              </label>

              <label className="checkout-field">
                <span>CVV</span>
                <input
                  type="password"
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
              </label>
            </div>

            {error ? <p className="checkout-error">{error}</p> : null}

            <div className="checkout-actions">
              <Button variant="primary" type="submit" disabled={isSubmitDisabled}>
                {submitLabel}
              </Button>
              <button type="button" className="checkout-back-link checkout-cancel-button" onClick={handleCancel}>
                Cancel payment
              </button>
            </div>
          </form>
        </section>

        <aside className="checkout-panel checkout-summary-panel">
          <p className="checkout-kicker">Order Summary</p>
          <h2 className="checkout-summary-title">{selectedPlan.name}</h2>
          <p className="checkout-summary-price">${selectedPlan.price.toFixed(2)} / month</p>
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

