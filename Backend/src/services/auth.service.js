import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import AppError from '../utils/AppError.js';
import { firebaseAuthAdmin, isFirebaseAdminConfigured } from '../config/firebaseAdmin.js';
import { isRestrictedAccountStatus, ACCOUNT_SUSPENDED_MESSAGE } from '../utils/accountStatus.js';

// Fixed: centralized secure session token generation for HttpOnly cookie auth.
const buildSessionToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('Server auth configuration is incomplete.', 500);
  }

  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
      tokenVersion: user.tokenVersion || 0,
    },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

export const serializeUser = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  emailVerified: Boolean(user.emailVerified),
  authProvider: user.authProvider,
  googleId: user.googleId || null,
  firebaseUid: user.firebaseUid || null,
  avatarUrl: user.avatarUrl,
  preferences: user.preferences,
  subscription: user.subscription,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const getAuthenticatedUser = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (isRestrictedAccountStatus(user.status)) {
    throw new AppError(ACCOUNT_SUSPENDED_MESSAGE, 403);
  }

  return user;
};

// Fixed: added dedicated admin Firebase token verification with custom admin claim enforcement.
export const adminAuthService = async ({ firebaseIdToken }) => {
  if (!isFirebaseAdminConfigured || !firebaseAuthAdmin) {
    throw new AppError('Firebase Admin is not configured on this server.', 503);
  }

  if (!firebaseIdToken || typeof firebaseIdToken !== 'string') {
    throw new AppError('firebaseIdToken is required for admin login.', 400);
  }

  let decoded;
  try {
    decoded = await firebaseAuthAdmin.verifyIdToken(firebaseIdToken, true);
  } catch {
    throw new AppError('Invalid or expired Firebase ID token.', 401);
  }

  const hasAdminClaim = decoded.admin === true || decoded.role === 'admin';
  if (!hasAdminClaim) {
    throw new AppError('Admin privileges are required for this login.', 403);
  }

  const normalizedEmail = String(decoded.email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new AppError('Authenticated Firebase user does not have an email.', 400);
  }

  let user = await User.findOne({
    $or: [{ firebaseUid: decoded.uid }, { email: normalizedEmail }],
  });

  if (!user) {
    user = await User.create({
      name: decoded.name || normalizedEmail.split('@')[0] || 'Admin',
      email: normalizedEmail,
      firebaseUid: decoded.uid,
      authProvider: decoded.firebase?.sign_in_provider === 'google.com' ? 'google' : 'local',
      emailVerified: Boolean(decoded.email_verified),
      role: 'admin',
      avatarUrl: decoded.picture || '/images/avatar.png',
    });
  }

  if (isRestrictedAccountStatus(user.status)) {
    throw new AppError(ACCOUNT_SUSPENDED_MESSAGE, 403);
  }

  if (user.role !== 'admin') {
    user.role = 'admin';
    await user.save();
  }

  const sessionToken = buildSessionToken(user);

  return {
    user,
    sessionToken,
  };
};

export const createSessionTokenForUser = buildSessionToken;
