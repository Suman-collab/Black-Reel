

import User from '../models/user.model.js';
import { getPlanLimits } from '../config/plans.js';
import { detectDevice, getClientIp } from '../utils/deviceDetector.js';
import AppError from '../utils/AppError.js';




const buildFingerprint = ({ os, type, browser }) =>
  `${os}|${type}|${browser}`.toLowerCase();




export const registerDevice = async (userId, req) => {
  const ua       = req.headers['user-agent'] || '';
  const ip       = getClientIp(req);
  const detected = detectDevice(ua);
  const fp       = buildFingerprint(detected);

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);

  
  const planId     = user.subscription?.status === 'active'
    ? (user.subscription?.planType || 'free')
    : 'free';
  const planLimits = getPlanLimits(planId);
  const maxDevices = planLimits.maxDevices;

  
  user.devices.forEach(d => { d.current = false; });

  
  const existingIdx = user.devices.findIndex(d => {
    const dFp = buildFingerprint({ os: d.os, type: d.type, browser: d.browser || '' });
    return dFp === fp;
  });

  if (existingIdx !== -1) {
    
    user.devices[existingIdx].lastActiveAt = new Date();
    user.devices[existingIdx].current      = true;
    user.devices[existingIdx].location     = ip;
    await user.save();
    return { deviceId: user.devices[existingIdx]._id.toString(), isNew: false };
  }

  
  if (user.devices.length >= maxDevices) {
    
    const sortedByAge = [...user.devices]
      .filter(d => !d.current)
      .sort((a, b) => new Date(a.lastActiveAt) - new Date(b.lastActiveAt));

    if (sortedByAge.length === 0) {
      
      throw new AppError(
        `Device limit reached. Your ${planId} plan allows ${maxDevices} device(s). Please remove a device to continue.`,
        403,
        'DEVICE_LIMIT_EXCEEDED',
        { maxDevices, planId }
      );
    }

    
    const toRemoveId = sortedByAge[0]._id;
    user.devices = user.devices.filter(d => !d._id.equals(toRemoveId));
  }

  
  user.devices.push({
    name:         detected.name,
    browser:      detected.browser,
    os:           detected.os,
    type:         detected.type,
    location:     ip,
    current:      true,
    lastActiveAt: new Date(),
  });

  await user.save();

  const newDevice = user.devices[user.devices.length - 1];
  return { deviceId: newDevice._id.toString(), isNew: true };
};


export const listDevices = async (userId) => {
  const user = await User.findById(userId).select('devices subscription');
  if (!user) throw new AppError('User not found.', 404);

  const planId     = user.subscription?.status === 'active'
    ? (user.subscription?.planType || 'free')
    : 'free';
  const planLimits = getPlanLimits(planId);

  return {
    devices:    user.devices,
    maxDevices: planLimits.maxDevices,
    planId,
  };
};


export const removeDevice = async (userId, deviceId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);

  const device = user.devices.id(deviceId);
  if (!device) throw new AppError('Device not found.', 404);

  if (device.current) {
    throw new AppError('You cannot remove your current device. Log out instead.', 400);
  }

  user.devices = user.devices.filter(d => !d._id.equals(deviceId));
  await user.save();
};


export const removeAllDevices = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);

  user.devices      = [];
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
};


export const adminListDevices = async (userId) => {
  return listDevices(userId);
};


export const adminRemoveDevice = async (userId, deviceId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);

  const before = user.devices.length;
  user.devices = user.devices.filter(d => !d._id.equals(deviceId));

  if (user.devices.length === before) {
    throw new AppError('Device not found.', 404);
  }

  await user.save();
};


export const adminSignOutAllDevices = async (userId) => {
  return removeAllDevices(userId);
};
