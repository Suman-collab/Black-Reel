

import User from '../models/user.model.js';
import { getPlanLimits } from '../config/plans.js';
import { detectDevice, getClientIp } from '../utils/deviceDetector.js';
import AppError from '../utils/AppError.js';




import crypto from 'crypto';

const generateDeviceFingerprint = (browser, os, deviceType, userAgent) => {
  const rawString = `${browser || 'unknown'}|${os || 'unknown'}|${deviceType || 'browser'}|${userAgent || ''}`;
  return crypto.createHash('sha256').update(rawString.toLowerCase().trim()).digest('hex');
};

export const registerDevice = async (userId, req) => {
  const ua       = req.headers['user-agent'] || '';
  const ip       = getClientIp(req);
  const detected = detectDevice(ua);
  const fp       = generateDeviceFingerprint(detected.browser, detected.os, detected.type, ua);

  console.log(`[Device Register Debug] User ID: ${userId}`);
  console.log(`  User-Agent:  "${ua}"`);
  console.log(`  Detected:    `, detected);
  console.log(`  Fingerprint: "${fp}"`);

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);

  const planId     = user.subscription?.status === 'active'
    ? (user.subscription?.planType || 'free')
    : 'free';
  const planLimits = getPlanLimits(planId);
  const maxDevices = planLimits.maxDevices;

  // Set all existing devices current = false
  user.devices.forEach(d => { d.current = false; });

  // Check if this device is already registered
  const existingIdx = user.devices.findIndex((d, idx) => {
    console.log(`  Checking Device [${idx + 1}] - Name: "${d.name}", FP in DB: "${d.deviceFingerprint || ''}"`);
    if (d.deviceFingerprint) {
      const isFpMatch = d.deviceFingerprint === fp;
      console.log(`    Fingerprint Match: ${isFpMatch} ("${d.deviceFingerprint}" vs "${fp}")`);
      return isFpMatch;
    }
    // Fallback for backward compatibility matching legacy entries
    const oldFp = `${d.os}|${d.type}|${d.browser || ''}`.toLowerCase();
    const currentOldFp = `${detected.os}|${detected.type}|${detected.browser || ''}`.toLowerCase();
    const isLegacyMatch = oldFp === currentOldFp;
    console.log(`    Legacy Match:      ${isLegacyMatch} ("${oldFp}" vs "${currentOldFp}")`);
    return isLegacyMatch;
  });

  if (existingIdx !== -1) {
    console.log(`  [MATCH FOUND] Re-using device at index ${existingIdx}: "${user.devices[existingIdx].name}"`);
    // Re-use active device: allow login and update dynamic telemetry
    user.devices[existingIdx].lastActiveAt = new Date();
    user.devices[existingIdx].lastActive   = new Date();
    user.devices[existingIdx].current      = true;
    user.devices[existingIdx].lastIP       = ip;
    user.devices[existingIdx].location     = ip;

    // Migrate old devices to the new fingerprint system
    if (!user.devices[existingIdx].deviceFingerprint) {
      user.devices[existingIdx].deviceFingerprint = fp;
      user.devices[existingIdx].userAgent         = ua;
    }

    await user.save();
    return { deviceId: user.devices[existingIdx]._id.toString(), isNew: false };
  }

  // Enforce device limits only for genuinely NEW devices
  if (user.devices.length >= maxDevices) {
    throw new AppError(
      `Device limit reached. Your ${planId} plan allows ${maxDevices} device(s). Please remove a device to continue.`,
      403,
      'DEVICE_LIMIT_EXCEEDED',
      {
        maxDevices,
        planId,
        devices: user.devices.map(d => ({
          _id: d._id.toString(),
          name: d.name,
          browser: d.browser,
          os: d.os,
          type: d.type,
          location: d.location,
          current: d.current,
          lastActiveAt: d.lastActiveAt
        }))
      }
    );
  }

  // Register the new device with fingerprint parameters
  user.devices.push({
    name:              detected.name,
    deviceFingerprint: fp,
    browser:           detected.browser,
    os:                detected.os,
    type:              detected.type,
    location:          ip,
    lastIP:            ip,
    userAgent:         ua,
    current:           true,
    lastActiveAt:      new Date(),
    lastActive:        new Date(),
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


export const swapDevice = async (userId, removeDeviceId, req) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);

  const device = user.devices.id(removeDeviceId);
  if (!device) throw new AppError('Selected device to remove was not found.', 404);
  if (device.current) {
    throw new AppError('You cannot remove your current active device.', 400);
  }

  // Remove the chosen device
  user.devices = user.devices.filter(d => !d._id.equals(removeDeviceId));

  // Register current device
  const ua = req.headers['user-agent'] || '';
  const ip = getClientIp(req);
  const detected = detectDevice(ua);
  const fp = generateDeviceFingerprint(detected.browser, detected.os, detected.type, ua);

  user.devices.forEach(d => { d.current = false; });

  user.devices.push({
    name:              detected.name,
    deviceFingerprint: fp,
    browser:           detected.browser,
    os:                detected.os,
    type:              detected.type,
    location:          ip,
    lastIP:            ip,
    userAgent:         ua,
    current:           true,
    lastActiveAt:      new Date(),
    lastActive:        new Date(),
  });

  await user.save();
  return { success: true };
};
