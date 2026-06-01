import { z } from 'zod';
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import AppError from '../utils/AppError.js';
import { validate } from '../utils/validate.js';

const broadcastSchema = z.object({
  title: z.string().trim().min(2, 'Notification title must be at least 2 characters'),
  message: z.string().trim().min(5, 'Notification message must be at least 5 characters'),
  type: z.enum(['system', 'new_episode', 'promotion', 'broadcast']).optional().default('broadcast'),
  targetRole: z.enum(['all', 'user', 'admin']).optional().default('user'),
});

export const mapNotification = (notification) => ({
  id: notification._id,
  title: notification.title,
  message: notification.message,
  type: notification.type,
  targetRole: notification.targetRole,
  createdAt: notification.createdAt,
  userId: notification.user,
});

export const getNotificationsForUser = async (user) => {
  if (user?.preferences?.notificationsEnabled === false) {
    return [];
  }

  return await Notification.find({
    $or: [
      { user: user._id },
      { targetRole: 'all' },
      { targetRole: user.role },
    ],
  }).sort({ createdAt: -1 });
};

export const updateNotificationPreferences = async (userId, enabled) => {
  if (typeof enabled !== 'boolean') {
    throw new AppError('notificationsEnabled must be true or false', 400);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { 'preferences.notificationsEnabled': enabled },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user.preferences;
};

export const createBroadcast = async (payload, adminId) => {
  const data = validate(broadcastSchema, payload);

  return await Notification.create({
    ...data,
    createdBy: adminId,
  });
};

export const getBroadcasts = async () => {
  return await Notification.find({
    createdBy: { $ne: null },
  }).sort({ createdAt: -1 });
};
