import * as authService from '../services/auth.service.js';
import catchAsync from '../utils/catchAsync.js';
import { clearAuthCookies, setAuthSessionCookie } from '../utils/token.utils.js';
import { passport, hasGoogleOAuthConfig } from '../config/passport.js';
import AppError from '../utils/AppError.js';
import crypto from 'crypto';
import { config } from '../config/index.js';

const getOAuthCookieOptions = () => ({
  httpOnly: true,
  secure: config.app.env === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 10 * 60 * 1000,
});

const getDefaultFrontendRedirect = () => config.frontend.url || 'http://localhost:5173';

const getFrontendRedirectUrl = (req) => {
  const provided = String(req.query.returnTo || '').trim();
  return provided || getDefaultFrontendRedirect();
};

const appendQueryParams = (target, params = {}) => {
  const base = new URL(target);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      base.searchParams.set(key, String(value));
    }
  });
  return base.toString();
};


export const adminLogin = catchAsync(async (req, res) => {
  const payload = req.body || {};
  const hasFirebaseToken = typeof payload.firebaseIdToken === 'string' && payload.firebaseIdToken.trim().length > 0;
  const { user, sessionToken } = hasFirebaseToken
    ? await authService.adminAuthService(payload)
    : await authService.adminAuthWithPasswordService(payload);

  setAuthSessionCookie(res, sessionToken);

  res.status(200).json({
    success: true,
    data: {
      user: authService.serializeUser(user),
    },
  });
});

export const getMe = catchAsync(async (req, res) => {
  const user = await authService.getAuthenticatedUser(req.user.id);
  res.status(200).json({
    success: true,
    data: {
      user: authService.serializeUser(user),
    },
  });
});

export const logout = catchAsync(async (req, res) => {
  clearAuthCookies(res);
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

export const beginGoogleAuth = (req, res, next) => {
  if (!hasGoogleOAuthConfig) {
    next(new AppError('Google sign-in is not configured on this server.', 503));
    return;
  }

  const frontendRedirect = getFrontendRedirectUrl(req);
  const state = crypto.randomBytes(18).toString('hex');
  res.cookie('br_google_oauth_state', state, getOAuthCookieOptions());
  res.cookie('br_google_oauth_return_to', encodeURIComponent(frontendRedirect), getOAuthCookieOptions());

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state,
    prompt: 'select_account',
  })(req, res, next);
};

export const handleGoogleCallback = (req, res, next) => {
  const redirectTarget = req.cookies?.br_google_oauth_return_to
    ? decodeURIComponent(req.cookies.br_google_oauth_return_to)
    : getDefaultFrontendRedirect();
  const oauthState = String(req.cookies?.br_google_oauth_state || '');
  const returnedState = String(req.query?.state || '');

  res.clearCookie('br_google_oauth_state', { path: '/' });
  res.clearCookie('br_google_oauth_return_to', { path: '/' });

  if (!oauthState || !returnedState || oauthState !== returnedState) {
    res.redirect(appendQueryParams(redirectTarget, { oauthError: 'Google sign-in state validation failed. Please retry.' }));
    return;
  }

  if (req.query?.error === 'access_denied') {
    res.redirect(appendQueryParams(redirectTarget, { oauthError: 'Google sign-in was cancelled.' }));
    return;
  }

  passport.authenticate('google', { session: false }, async (error, googleProfile) => {
    try {
      if (error) {
        res.redirect(appendQueryParams(redirectTarget, { oauthError: error.message || 'Google sign-in failed.' }));
        return;
      }

      if (!googleProfile?.email) {
        res.redirect(
          appendQueryParams(redirectTarget, {
            oauthError: 'Google account did not provide an email address. Please use another sign-in method.',
          })
        );
        return;
      }

      const { user, sessionToken } = await authService.googleAuthService(googleProfile);
      setAuthSessionCookie(res, sessionToken);

      res.redirect(
        appendQueryParams(redirectTarget, {
          oauthSuccess: 'true',
          userEmail: user.email,
        })
      );
    } catch (callbackError) {
      res.redirect(
        appendQueryParams(redirectTarget, {
          oauthError: callbackError.message || 'Google sign-in failed. Please try again.',
        })
      );
    }
  })(req, res, next);
};
