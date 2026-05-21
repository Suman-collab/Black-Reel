export const formatPlanName = (planType) => {
  if (!planType || planType === 'none') {
    return 'Free';
  }

  return `${planType.charAt(0).toUpperCase()}${planType.slice(1)}`;
};

const INACTIVE_STATUSES = new Set(['inactive', 'pending', 'cancelled', 'failed']);
const KNOWN_STATUSES = new Set(['inactive', 'pending', 'active', 'cancelled', 'failed']);

export const getSubscriptionStatus = (subscription) => {
  const normalizedStatus = String(subscription?.status || '').trim().toLowerCase();
  return KNOWN_STATUSES.has(normalizedStatus) ? normalizedStatus : 'inactive';
};

export const hasSelectedSubscriptionPlan = (subscription) => {
  const planType = String(subscription?.planType || '').trim().toLowerCase();
  return Boolean(planType && planType !== 'none');
};

export const hasActiveSubscription = (subscription) => {
  const planType = String(subscription?.planType || '').trim().toLowerCase();
  const status = getSubscriptionStatus(subscription);

  if (!planType || planType === 'none') {
    return false;
  }

  if (!status) {
    // Backward compatibility for older sessions that stored planType without status.
    return true;
  }

  if (INACTIVE_STATUSES.has(status)) {
    return false;
  }

  return status === 'active';
};

export const getActivePlanName = (subscription) =>
  hasActiveSubscription(subscription) ? formatPlanName(subscription.planType) : 'Subscribe';

export const getNavbarPlanLabel = (subscription) => {
  if (!hasSelectedSubscriptionPlan(subscription)) {
    return 'Subscribe';
  }

  const planName = formatPlanName(subscription?.planType);
  const status = getSubscriptionStatus(subscription);

  if (status === 'pending') {
    return `${planName} (Pending)`;
  }

  if (status === 'cancelled') {
    return `${planName} (Expires Soon)`;
  }

  if (status === 'active') {
    return planName;
  }

  return `${planName} (${status.charAt(0).toUpperCase()}${status.slice(1)})`;
};

export const getSubscriptionLabel = (subscription) =>
  hasActiveSubscription(subscription) ? `${formatPlanName(subscription.planType)} Plan` : 'Free Plan';

export const getSubscriptionStatusMessage = (subscription) => {
  const status = getSubscriptionStatus(subscription);

  if (status === 'pending') {
    return 'Payment in progress. Your membership will activate after confirmation.';
  }

  if (status === 'cancelled') {
    return 'Membership cancelled. Access remains available until the current billing period ends.';
  }

  if (!hasActiveSubscription(subscription)) {
    return 'No active membership';
  }

  if (subscription?.renewalDate) {
    return `Active until ${new Date(subscription.renewalDate).toLocaleDateString()}`;
  }

  return `${formatPlanName(subscription.planType)} plan is active`;
};
