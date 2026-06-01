const RESTRICTED_ACCOUNT_STATUSES = new Set(['banned']);

export const isRestrictedAccountStatus = (status = '') =>
  RESTRICTED_ACCOUNT_STATUSES.has(String(status).trim().toLowerCase());

export const DEFAULT_SUSPENSION_MESSAGE =
  'Your account is currently suspended. Protected features are unavailable until support reviews the restriction.';
