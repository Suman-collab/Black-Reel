export const ACCOUNT_SUSPENDED_MESSAGE = 'This account has been suspended. Please contact support at support@blackreel.com.';
export const ACCOUNT_BANNED_MESSAGE = 'Your account has been banned. Please contact customer support.';

export const isRestrictedAccountStatus = (status = '') => {
  const normalizedStatus = String(status).trim().toLowerCase();
  return normalizedStatus === 'banned';
};

export const isBanned = (status = '') => String(status).trim().toLowerCase() === 'banned';
export const isSuspended = (status = '') => String(status).trim().toLowerCase() === 'suspended';
