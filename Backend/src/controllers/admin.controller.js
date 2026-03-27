import * as adminService from '../services/admin.service.js';
import catchAsync from '../utils/catchAsync.js';

export const getStats = catchAsync(async (req, res, next) => {
  const stats = await adminService.getDashboardStats();
  res.status(200).json({ success: true, data: { stats } });
});

export const getOverview = catchAsync(async (req, res, next) => {
  const overview = await adminService.getDashboardOverview();
  res.status(200).json({ success: true, data: { overview } });
});

export const getSubscriptions = catchAsync(async (req, res, next) => {
  const subscriptions = await adminService.getSubscriptions(req.query);
  res.status(200).json({ success: true, count: subscriptions.length, data: { subscriptions } });
});

export const getReports = catchAsync(async (req, res, next) => {
  const reports = await adminService.getReports(req.query);
  res.status(200).json({ success: true, count: reports.length, data: { reports } });
});

export const updateReportStatus = catchAsync(async (req, res, next) => {
  const report = await adminService.updateReportStatus(req.params.id, req.body);
  res.status(200).json({ success: true, data: { report } });
});
