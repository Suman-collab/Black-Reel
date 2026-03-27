import catchAsync from '../utils/catchAsync.js';
import * as notificationService from '../services/notification.service.js';

export const getNotifications = catchAsync(async (req, res, next) => {
  const notifications = await notificationService.getNotificationsForUser(req.user);

  res.status(200).json({
    success: true,
    count: notifications.length,
    data: {
      notifications: notifications.map(notificationService.mapNotification),
    },
  });
});

export const updatePreferences = catchAsync(async (req, res, next) => {
  const preferences = await notificationService.updateNotificationPreferences(
    req.user.id,
    req.body.notificationsEnabled
  );

  res.status(200).json({
    success: true,
    data: { preferences },
  });
});

export const createBroadcast = catchAsync(async (req, res, next) => {
  const notification = await notificationService.createBroadcast(req.body, req.user.id);

  res.status(201).json({
    success: true,
    data: {
      notification: notificationService.mapNotification(notification),
    },
  });
});

export const getBroadcasts = catchAsync(async (req, res, next) => {
  const broadcasts = await notificationService.getBroadcasts();

  res.status(200).json({
    success: true,
    count: broadcasts.length,
    data: {
      broadcasts: broadcasts.map(notificationService.mapNotification),
    },
  });
});
