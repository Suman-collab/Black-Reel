export const ACCOUNT_SUSPENDED_MESSAGE = 'This account has been suspended. Please contact support at support@blackreel.com.';

export const isRestrictedAccountStatus = (status = '') => {
  const normalizedStatus = String(status).trim().toLowerCase();
  return normalizedStatus === 'banned' || normalizedStatus === 'suspended' || normalizedStatus === 'inactive';
};
