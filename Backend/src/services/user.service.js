import User from '../models/user.model.js';
import AppError from '../utils/AppError.js';
import Content from '../models/content.model.js';
import mongoose from 'mongoose';
import { z } from 'zod';
import { validate } from '../utils/validate.js';
import { mapContent } from './content.service.js';
import { isRestrictedAccountStatus } from '../utils/accountStatus.js';
import { logSuspensionAction } from '../utils/securityAudit.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { escapeRegex, normalizeSearchTerm } from '../utils/search.js';

const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().trim().email('Please provide a valid email').optional(),
    avatarUrl: z.string().trim().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Please provide at least one field to update',
  });

const preferenceUpdateSchema = z
  .object({
    notificationsEnabled: z.boolean().optional(),
    parentalControls: z.boolean().optional(),
    language: z.enum(['English (US)', 'English (UK)', 'Spanish']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Please provide at least one preference to update',
  });

const userRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
});

const userStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'banned']),
});

const avatarUploadSchema = z.object({
  avatarDataUrl: z
    .string()
    .trim()
    .min(30, 'Avatar image payload is required')
    .regex(/^data:image\/(png|jpe?g|webp);base64,/i, 'Avatar must be PNG, JPG, or WebP data URL'),
});

const buildUserFilters = ({ search, status }) => {
  const filters = {};

  if (status && status !== 'all') {
    filters.status = status;
  }

  if (search) {
    
    const normalizedSearch = normalizeSearchTerm(search);
    if (normalizedSearch) {
      const safePattern = escapeRegex(normalizedSearch);
      filters.$or = [
        { name: { $regex: safePattern, $options: 'i' } },
        { email: { $regex: safePattern, $options: 'i' } },
      ];
    }
  }

  return filters;
};

const toContentObjectId = (contentId) => {
  const normalizedContentId = String(contentId || '').trim();

  if (!mongoose.Types.ObjectId.isValid(normalizedContentId)) {
    throw new AppError('Invalid content id', 400);
  }

  return new mongoose.Types.ObjectId(normalizedContentId);
};

export const getUserById = async (id) => {
  const user = await User.findById(id).populate('watchlist');
  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const updateUserProfile = async (id, payload) => {
  const data = validate(profileUpdateSchema, payload);

  if (data.email) {
    const existingUser = await User.findOne({
      email: data.email.toLowerCase(),
      _id: { $ne: id },
    });

    if (existingUser) {
      throw new AppError('Email is already in use', 400);
    }

    data.email = data.email.toLowerCase();
  }

  const user = await User.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).populate('watchlist');

  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const updateUserPreferences = async (id, payload) => {
  const data = validate(preferenceUpdateSchema, payload);

  const user = await User.findByIdAndUpdate(
    id,
    {
      $set: Object.entries(data).reduce((acc, [key, value]) => {
        acc[`preferences.${key}`] = value;
        return acc;
      }, {}),
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate('watchlist');

  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const getWatchlist = async (id) => {
  const user = await User.findById(id).populate('watchlist');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user.watchlist.map(mapContent);
};

export const addToWatchlist = async (userId, contentId) => {
  const contentObjectId = toContentObjectId(contentId);
  const content = await Content.findById(contentObjectId);

  if (!content) {
    throw new AppError('Content not found', 404);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { watchlist: contentObjectId } },
    { new: true }
  ).populate('watchlist');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user.watchlist.map(mapContent);
};

export const removeFromWatchlist = async (userId, contentId) => {
  const contentObjectId = toContentObjectId(contentId);

  const user = await User.findByIdAndUpdate(
    userId,
    { $pull: { watchlist: contentObjectId } },
    { new: true }
  ).populate('watchlist');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user.watchlist.map(mapContent);
};

export const getDevices = async (id) => {
  const user = await User.findById(id).select('devices');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user.devices;
};

export const removeDevice = async (id, deviceId) => {
  const user = await User.findById(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const device = user.devices.id(deviceId);

  if (!device) {
    throw new AppError('Device not found', 404);
  }

  user.devices.pull(deviceId);
  await user.save();

  return user.devices;
};

export const getAllUsers = async (query = {}) => {
  const filters = buildUserFilters(query);
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  
  const [users, total] = await Promise.all([
    User.find(filters)
      .select('_id name email role createdAt status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filters),
  ]);

  return {
    users,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

export const updateUserRole = async (userId, payload) => {
  const { role } = validate(userRoleSchema, payload);
  const user = await User.findByIdAndUpdate(userId, { role }, { new: true, runValidators: true });

  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const updateUserStatus = async (userId, payload, actorUserId = null) => {
  const { status } = validate(userStatusSchema, payload);
  const existingUser = await User.findById(userId);

  if (!existingUser) throw new AppError('User not found', 404);

  const previousStatus = existingUser.status;
  const nextStatus = status.toLowerCase();
  const wasRestricted = isRestrictedAccountStatus(existingUser.status);
  const becomesRestricted = isRestrictedAccountStatus(nextStatus);
  const shouldRotateTokens = becomesRestricted && (!wasRestricted || existingUser.status !== nextStatus);

  existingUser.status = status;

  if (shouldRotateTokens) {
    existingUser.tokenVersion = (existingUser.tokenVersion || 0) + 1;
  }

  await existingUser.save();

  logSuspensionAction({
    actorUserId,
    targetUserId: existingUser._id,
    previousStatus,
    nextStatus: existingUser.status,
  });

  const user = await User.findById(userId).select('-password');
  return user;
};

export const uploadAvatar = async (userId, payload) => {
  if (!isCloudinaryConfigured) {
    throw new AppError('Cloudinary is not configured on this server.', 503);
  }

  const { avatarDataUrl } = validate(avatarUploadSchema, payload);
  const existingUser = await User.findById(userId).select('avatarUrl email');

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  const safeEmailPrefix = String(existingUser.email || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 24);

  const uploaded = await cloudinary.uploader.upload(avatarDataUrl, {
    folder: 'blackreel/avatars',
    public_id: `${safeEmailPrefix}_${Date.now()}`,
    overwrite: true,
    resource_type: 'image',
    transformation: [
      { width: 512, height: 512, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  existingUser.avatarUrl = uploaded.secure_url;
  await existingUser.save({ validateBeforeSave: false });

  return existingUser;
};

