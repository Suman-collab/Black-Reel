import User from '../models/user.model.js';
import AppError from '../utils/AppError.js';
import Content from '../models/content.model.js';
import { z } from 'zod';
import { validate } from '../utils/validate.js';

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
    language: z.string().trim().min(2).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Please provide at least one preference to update',
  });

const userRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
});

const userStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'banned']),
});

const buildUserFilters = ({ search, status }) => {
  const filters = {};

  if (status && status !== 'all') {
    filters.status = status;
  }

  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  return filters;
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

  return user.watchlist;
};

export const addToWatchlist = async (userId, contentId) => {
  const content = await Content.findById(contentId);

  if (!content) {
    throw new AppError('Content not found', 404);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { watchlist: contentId } },
    { new: true }
  ).populate('watchlist');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user.watchlist;
};

export const removeFromWatchlist = async (userId, contentId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $pull: { watchlist: contentId } },
    { new: true }
  ).populate('watchlist');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user.watchlist;
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

  device.deleteOne();
  await user.save();

  return user.devices;
};

export const getAllUsers = async (query = {}) => {
  const filters = buildUserFilters(query);
  return await User.find(filters)
    .select('-password')
    .sort({ createdAt: -1 })
    .populate('watchlist', 'title thumbnailUrl');
};

export const updateUserRole = async (userId, payload) => {
  const { role } = validate(userRoleSchema, payload);
  const user = await User.findByIdAndUpdate(userId, { role }, { new: true, runValidators: true });

  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const updateUserStatus = async (userId, payload) => {
  const { status } = validate(userStatusSchema, payload);
  const user = await User.findByIdAndUpdate(userId, { status }, { new: true, runValidators: true });

  if (!user) throw new AppError('User not found', 404);
  return user;
};
