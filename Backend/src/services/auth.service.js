import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import AppError from '../utils/AppError.js';
import { firebaseAuthAdmin, isFirebaseAdminConfigured } from '../config/firebaseAdmin.js';
import { isRestrictedAccountStatus, ACCOUNT_SUSPENDED_MESSAGE, ACCOUNT_BANNED_MESSAGE } from '../utils/accountStatus.js';
import { config } from '../config/index.js';


const buildSessionToken = (user) => {
  const secret = config.jwt.secret;
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
    { expiresIn: config.jwt.expiresIn || '1d' }
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
  avatar: user.avatar || null,
  preferences: user.preferences,
  subscription: user.subscription,
  watchedVideos: user.watchedVideos || [],
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const getAuthenticatedUser = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.status === 'suspended' || user.status === 'banned') {
    const error = new AppError('Your account has been suspended. Please contact support at support@blackshortz.com or visit /support', 403);
    error.errorCode = 'ACCOUNT_SUSPENDED';
    error.isOperational = true;
    throw error;
  }

  return user;
};


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

  if (user.status === 'suspended' || user.status === 'banned') {
    const error = new AppError('Your account has been suspended. Please contact support at support@blackshortz.com or visit /support', 403);
    error.errorCode = 'ACCOUNT_SUSPENDED';
    error.isOperational = true;
    throw error;
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

export const adminAuthWithPasswordService = async ({ email, password }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  if (!normalizedEmail || !normalizedPassword) {
    throw new AppError('Email and password are required for admin login.', 400);
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user || user.role !== 'admin') {
    throw new AppError('Invalid admin credentials.', 401);
  }

  const passwordMatches = await user.comparePassword(normalizedPassword);
  if (!passwordMatches) {
    throw new AppError('Invalid admin credentials.', 401);
  }

  if (user.status === 'suspended' || user.status === 'banned') {
    const error = new AppError('Your account has been suspended. Please contact support at support@blackshortz.com or visit /support', 403);
    error.errorCode = 'ACCOUNT_SUSPENDED';
    error.isOperational = true;
    throw error;
  }

  const sessionToken = buildSessionToken(user);

  return {
    user,
    sessionToken,
  };
};

export const googleAuthService = async ({ googleId, email, name, avatarUrl }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    throw new AppError('Google account did not provide an email address.', 400);
  }

  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    user = await User.create({
      name: name || normalizedEmail.split('@')[0] || 'User',
      email: normalizedEmail,
      googleId: googleId || undefined,
      authProvider: 'google',
      emailVerified: true,
      avatarUrl: avatarUrl || '/images/avatar.png',
      avatar: avatarUrl || null,
    });
  } else {
    const updates = {};

    if (!user.googleId && googleId) {
      updates.googleId = googleId;
    }
    if (!user.avatarUrl && avatarUrl) {
      updates.avatarUrl = avatarUrl;
    }
    if (!user.avatar && avatarUrl) {
      updates.avatar = avatarUrl;
    }
    if (!user.emailVerified) {
      updates.emailVerified = true;
    }
    if (user.authProvider !== 'google') {
      updates.authProvider = 'google';
    }

    if (Object.keys(updates).length > 0) {
      user = await User.findByIdAndUpdate(user._id, { $set: updates }, { new: true });
    }
  }

  if (user.status === 'suspended' || user.status === 'banned') {
    const error = new AppError('Your account has been suspended. Please contact support at support@blackshortz.com or visit /support', 403);
    error.errorCode = 'ACCOUNT_SUSPENDED';
    error.isOperational = true;
    throw error;
  }

  const sessionToken = buildSessionToken(user);

  return { user, sessionToken };
};

export const createSessionTokenForUser = buildSessionToken;
