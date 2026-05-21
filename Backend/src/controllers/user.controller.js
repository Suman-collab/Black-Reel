import * as userService from '../services/user.service.js';
import catchAsync from '../utils/catchAsync.js';

export const getProfile = catchAsync(async (req, res, next) => {
  const user = await userService.getUserById(req.user.id);
  res.status(200).json({ success: true, data: { user } });
});

export const updateProfile = catchAsync(async (req, res, next) => {
  const user = await userService.updateUserProfile(req.user.id, req.body);
  res.status(200).json({ success: true, data: { user } });
});

export const updatePreferences = catchAsync(async (req, res, next) => {
  const user = await userService.updateUserPreferences(req.user.id, req.body);
  res.status(200).json({ success: true, data: { user } });
});

export const getWatchlist = catchAsync(async (req, res, next) => {
  const watchlist = await userService.getWatchlist(req.user.id);
  res.status(200).json({ success: true, count: watchlist.length, data: { watchlist } });
});

export const addToWatchlist = catchAsync(async (req, res, next) => {
  const watchlist = await userService.addToWatchlist(req.user.id, req.params.contentId);
  res.status(200).json({ success: true, count: watchlist.length, data: { watchlist } });
});

export const removeFromWatchlist = catchAsync(async (req, res, next) => {
  const watchlist = await userService.removeFromWatchlist(req.user.id, req.params.contentId);
  res.status(200).json({ success: true, count: watchlist.length, data: { watchlist } });
});

export const getDevices = catchAsync(async (req, res, next) => {
  const devices = await userService.getDevices(req.user.id);
  res.status(200).json({ success: true, count: devices.length, data: { devices } });
});

export const removeDevice = catchAsync(async (req, res, next) => {
  const devices = await userService.removeDevice(req.user.id, req.params.deviceId);
  res.status(200).json({ success: true, count: devices.length, data: { devices } });
});

export const getUsers = catchAsync(async (req, res, next) => {
  const result = await userService.getAllUsers(req.query);
  res.status(200).json({ success: true, data: result });
});

export const updateRole = catchAsync(async (req, res, next) => {
  const user = await userService.updateUserRole(req.params.id, req.body);
  res.status(200).json({ success: true, data: { user } });
});

export const updateStatus = catchAsync(async (req, res, next) => {
  const user = await userService.updateUserStatus(req.params.id, req.body, req.user.id);
  res.status(200).json({ success: true, data: { user } });
});

export const uploadAvatar = catchAsync(async (req, res, next) => {
  const user = await userService.uploadAvatar(req.user.id, req.body);
  res.status(200).json({ success: true, data: { user } });
});

