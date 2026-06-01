import * as adminService from '../services/admin.service.js';
import catchAsync from '../utils/catchAsync.js';
import User from '../models/user.model.js';
import Payment from '../models/payment.model.js';
import * as deviceService from '../services/device.service.js';
import * as notificationService from '../services/notification.service.js';
import AppError from '../utils/AppError.js';

export const getStats = catchAsync(async (req, res, next) => {
  const stats = await adminService.getDashboardStats();
  res.status(200).json({ success: true, data: { stats } });
});

export const getOverview = catchAsync(async (req, res, next) => {
  const overview = await adminService.getDashboardOverview();
  res.status(200).json({ success: true, data: { overview } });
});

export const getSubscriptions = catchAsync(async (req, res, next) => {
  const result = await adminService.getSubscriptions(req.query);
  res.status(200).json({ success: true, count: result.subscriptions.length, data: result });
});

export const getReports = catchAsync(async (req, res, next) => {
  const result = await adminService.getReports(req.query);
  res.status(200).json({ success: true, count: result.reports.length, data: result });
});

export const updateReportStatus = catchAsync(async (req, res, next) => {
  const report = await adminService.updateReportStatus(req.params.id, req.body);
  res.status(200).json({ success: true, data: { report } });
});

export const getUsers = catchAsync(async (req, res) => {
  const result = await adminService.getUsers(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getUserStats = catchAsync(async (req, res) => {
  const stats = await adminService.getUserStats();
  res.status(200).json({ success: true, ...stats });
});

export const getAllUsers = catchAsync(async (req, res) => {
  const result = await adminService.getAllUsers(req.query);
  res.status(200).json({ success: true, ...result });
});

export const getUserById = catchAsync(async (req, res) => {
  const result = await adminService.getUserById(req.params.id);
  res.status(200).json({ success: true, ...result });
});

export const updateUserStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const allowed = ['active', 'suspended', 'banned'];

  if (!allowed.includes(status)) {
    throw new AppError('Invalid status value', 400);
  }

  const userId = req.params.id || req.params.userId;
  const user = await User.findByIdAndUpdate(
    userId,
    { status },
    { new: true }
  ).select('_id name email status');

  if (!user) throw new AppError('User not found', 404);

  res.status(200).json({
    success: true,
    message: `User status updated to ${status}`,
    user,
  });
});

export const updateUserRole = catchAsync(async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  const userId = req.params.id || req.params.userId;
  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true }
  ).select('_id name email role');

  if (!user) throw new AppError('User not found', 404);

  res.status(200).json({ success: true, user });
});

export const deleteUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  // Clean up related data
  await Payment.deleteMany({ user: req.params.id });
  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'User and all related data deleted successfully',
  });
});

export const adminRemoveDevice = catchAsync(async (req, res) => {
  const { userId, deviceId } = req.params;
  await deviceService.adminRemoveDevice(userId, deviceId);
  res.status(200).json({ success: true, message: 'Device removed successfully.' });
});

export const getAdminBroadcasts = catchAsync(async (_req, res) => {
  const broadcasts = await notificationService.getBroadcasts();
  res.status(200).json({
    success: true,
    count: broadcasts.length,
    data: {
      broadcasts: broadcasts.map(notificationService.mapNotification),
    },
  });
});

export const createAdminBroadcast = catchAsync(async (req, res) => {
  const notification = await notificationService.createBroadcast(req.body, req.user.id);
  res.status(201).json({
    success: true,
    data: {
      notification: notificationService.mapNotification(notification),
    },
  });
});
