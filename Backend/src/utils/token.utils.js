import { config } from '../config/index.js';


export const getSessionCookieOptions = () => ({
  httpOnly: true,
  secure: config.app.env === 'production',
  sameSite: config.app.env === 'production' ? 'none' : 'strict',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000,
});

export const setAuthSessionCookie = (res, token) => {
  res.cookie('br_session_token', token, getSessionCookieOptions());
};

export const clearAuthCookies = (res) => {
  const options = getSessionCookieOptions();
  res.clearCookie('br_session_token', options);
  res.clearCookie('br_access_token', options);
  res.clearCookie('br_refresh_token', options);
};
