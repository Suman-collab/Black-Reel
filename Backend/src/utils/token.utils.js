// Fixed: standardized secure cookie settings for server-issued session auth tokens.
export const getSessionCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000,
});

export const setAuthSessionCookie = (res, token) => {
  res.cookie('br_session_token', token, getSessionCookieOptions());
};

export const clearAuthCookies = (res) => {
  res.clearCookie('br_session_token', { path: '/' });
  res.clearCookie('br_access_token', { path: '/' });
  res.clearCookie('br_refresh_token', { path: '/' });
};
