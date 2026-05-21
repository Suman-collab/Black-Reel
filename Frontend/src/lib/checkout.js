const CHECKOUT_DRAFT_PREFIX = 'blackreel-checkout-draft:';
const CHECKOUT_SUCCESS_MESSAGE_KEY = 'blackreel-checkout-success-message';
const CHECKOUT_PAYMENT_REF_KEY = 'blackreel-checkout-payment-ref';

const readSessionValue = (key) => {
  try {
    const rawValue = sessionStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    sessionStorage.removeItem(key);
    return null;
  }
};

const writeSessionValue = (key, value) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage issues so checkout can still continue in-memory.
  }
};

const removeSessionValue = (key) => {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Ignore storage issues so cleanup failures do not block navigation.
  }
};

export const getCheckoutDraft = (planType) => readSessionValue(`${CHECKOUT_DRAFT_PREFIX}${planType}`);

export const saveCheckoutDraft = (planType, draft) => {
  writeSessionValue(`${CHECKOUT_DRAFT_PREFIX}${planType}`, draft);
};

export const clearCheckoutDraft = (planType) => {
  removeSessionValue(`${CHECKOUT_DRAFT_PREFIX}${planType}`);
};

export const setCheckoutSuccessMessage = (message) => {
  writeSessionValue(CHECKOUT_SUCCESS_MESSAGE_KEY, message);
};

export const consumeCheckoutSuccessMessage = () => {
  const message = readSessionValue(CHECKOUT_SUCCESS_MESSAGE_KEY);
  removeSessionValue(CHECKOUT_SUCCESS_MESSAGE_KEY);
  return typeof message === 'string' ? message : '';
};

// Fixed: persist checkout payment reference for success-page refresh recovery.
export const setCheckoutPaymentRef = (value) => {
  writeSessionValue(CHECKOUT_PAYMENT_REF_KEY, value);
};

export const getCheckoutPaymentRef = () => readSessionValue(CHECKOUT_PAYMENT_REF_KEY);

export const clearCheckoutPaymentRef = () => {
  removeSessionValue(CHECKOUT_PAYMENT_REF_KEY);
};
