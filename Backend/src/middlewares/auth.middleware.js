import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import AppError from '../utils/AppError.js';
import { ACCOUNT_SUSPENDED_MESSAGE, isRestrictedAccountStatus } from '../utils/accountStatus.js';
import { logBlockedAccessAttempt } from '../utils/securityAudit.js';
import catchAsync from '../utils/catchAsync.js';
import { isFirebaseAdminConfigured, firebaseAuthAdmin } from '../config/firebaseAdmin.js';
import { setAuthSessionCookie } from '../utils/token.utils.js';

const extractBearerToken = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }

  return null;
};

// Fixed: cookie-first token extraction for HttpOnly-session auth.
const extractSessionToken = (req) => req.cookies?.br_session_token || null;

const getSessionSecret = () => process.env.JWT_SECRET;

const loadUserWithRestrictionCheck = async (req, user) => {
  if (!user) {
    throw new AppError('The user account linked to this session was not found.', 401);
  }

  if (isRestrictedAccountStatus(user.status)) {
    logBlockedAccessAttempt({
      userId: user._id,
      email: user.email,
      status: user.status,
      path: req.originalUrl,
      method: req.method,
      reason: 'restricted_account',
    });
    throw new AppError(ACCOUNT_SUSPENDED_MESSAGE, 403);
  }

  return user;
};

const resolveFromSessionCookie = async (req) => {
  const sessionToken = extractSessionToken(req);
  if (!sessionToken) {
    return null;
  }

  const secret = getSessionSecret();
  if (!secret) {
    throw new AppError('Server auth configuration is incomplete.', 500);
  }

  try {
    const decoded = jwt.verify(sessionToken, secret);
    const user = await User.findById(decoded.sub);

    if (!user) {
      return null;
    }

    if ((user.tokenVersion || 0) !== Number(decoded.tokenVersion || 0)) {
      return null;
    }

    return await loadUserWithRestrictionCheck(req, user);
  } catch {
    return null;
  }
};

const upsertFirebaseUser = async (decoded) => {
  const normalizedEmail = String(decoded.email || '').toLowerCase().trim();
  if (!normalizedEmail) {
    throw new AppError('Authenticated Firebase user does not have an email.', 400);
  }

  let user = await User.findOne({
    $or: [{ firebaseUid: decoded.uid }, { email: normalizedEmail }],
  });

  if (!user) {
    user = await User.create({
      name: decoded.name || normalizedEmail.split('@')[0] || 'User',
      email: normalizedEmail,
      firebaseUid: decoded.uid,
      emailVerified: Boolean(decoded.email_verified),
      authProvider: decoded.firebase?.sign_in_provider === 'google.com' ? 'google' : 'local',
      avatarUrl: decoded.picture || '/images/avatar.png',
    });
  } else {
    const nextValues = {};

    if (!user.firebaseUid) {
      nextValues.firebaseUid = decoded.uid;
    }
    if (!user.emailVerified && decoded.email_verified) {
      nextValues.emailVerified = true;
    }
    if ((!user.avatarUrl || user.avatarUrl === '/images/avatar.png') && decoded.picture) {
      nextValues.avatarUrl = decoded.picture;
    }
    if (user.authProvider === 'local' && decoded.firebase?.sign_in_provider === 'google.com') {
      nextValues.authProvider = 'google';
      if (!user.googleId) {
        nextValues.googleId = decoded.uid;
      }
    }

    if (Object.keys(nextValues).length > 0) {
      user = await User.findByIdAndUpdate(user._id, { $set: nextValues }, { new: true });
    }
  }

  return user;
};

const resolveFromFirebaseBearer = async (req, res, { strict }) => {
  const token = extractBearerToken(req);
  if (!token) {
    return null;
  }

  if (!isFirebaseAdminConfigured || !firebaseAuthAdmin) {
    if (strict) {
      throw new AppError('Firebase Admin is not configured on this server.', 503);
    }
    return null;
  }

  try {
    const decoded = await firebaseAuthAdmin.verifyIdToken(token, true);
    const user = await upsertFirebaseUser(decoded);
    const { createSessionTokenForUser } = await import('../services/auth.service.js');
    const sessionToken = createSessionTokenForUser(user);
    setAuthSessionCookie(res, sessionToken);
    return await loadUserWithRestrictionCheck(req, user);
  } catch {
    if (strict) {
      throw new AppError('Invalid or expired Firebase session token.', 401);
    }
    return null;
  }
};

// Fixed: optional auth now no-ops safely when no token/cookie is provided.
const resolveAuthenticatedUser = async (req, res, { requireToken = true } = {}) => {
  const userFromCookie = await resolveFromSessionCookie(req);
  if (userFromCookie) {
    return userFromCookie;
  }

  if (!extractSessionToken(req) && !extractBearerToken(req) && !requireToken) {
    return null;
  }

  const userFromBearer = await resolveFromFirebaseBearer(req, res, { strict: requireToken });
  if (userFromBearer) {
    return userFromBearer;
  }

  if (requireToken) {
    throw new AppError('You are not logged in. Please sign in to continue.', 401);
  }

  return null;
};

export const protect = catchAsync(async (req, res, next) => {
  req.user = await resolveAuthenticatedUser(req, res, { requireToken: true });
  next();
});

// Fixed: token verification failures for optional auth no longer throw; request stays public.
export const optionalProtect = catchAsync(async (req, res, next) => {
  if (!extractSessionToken(req) && !extractBearerToken(req)) {
    req.user = null;
    next();
    return;
  }

  req.user = await resolveAuthenticatedUser(req, res, { requireToken: false });
  next();
});

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
