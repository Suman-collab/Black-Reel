import * as deviceService from '../services/device.service.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const getMyDevices = catchAsync(async (req, res) => {
  const result = await deviceService.listDevices(req.user._id);
  res.status(200).json({ success: true, data: result });
});

export const removeMyDevice = catchAsync(async (req, res) => {
  await deviceService.removeDevice(req.user._id, req.params.deviceId);
  res.status(200).json({ success: true, message: 'Device removed successfully.' });
});

export const signOutAllDevices = catchAsync(async (req, res) => {
  await deviceService.removeAllDevices(req.user._id);
  res.status(200).json({ success: true, message: 'Signed out from all devices.' });
});

export const swapMyDevice = catchAsync(async (req, res) => {
  const { removeDeviceId } = req.body;
  if (!removeDeviceId) {
    throw new AppError('removeDeviceId is required.', 400);
  }
  const result = await deviceService.swapDevice(req.user._id, removeDeviceId, req);
  res.status(200).json({ success: true, message: 'Device swapped successfully.', data: result });
});

export const adminGetUserDevices = catchAsync(async (req, res) => {
  const result = await deviceService.adminListDevices(req.params.userId);
  res.status(200).json({ success: true, data: result });
});

export const adminRemoveUserDevice = catchAsync(async (req, res) => {
  await deviceService.adminRemoveDevice(req.params.userId, req.params.deviceId);
  res.status(200).json({ success: true, message: 'Device removed.' });
});

export const adminSignOutAll = catchAsync(async (req, res) => {
  await deviceService.adminSignOutAllDevices(req.params.userId);
  res.status(200).json({ success: true, message: 'All sessions cleared for user.' });
});
