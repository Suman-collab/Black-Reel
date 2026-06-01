import User from '../models/user.model.js';
import Content from '../models/content.model.js';
import Payment from '../models/payment.model.js';
import Report from '../models/report.model.js';
import AppError from '../utils/AppError.js';
import Notification from '../models/notification.model.js';
import { z } from 'zod';
import { validate } from '../utils/validate.js';
import { getPlanLimits } from '../config/plans.js';

const reportStatusSchema = z.object({
  status: z.enum(['pending', 'resolved', 'rejected']),
});

const formatUserRow = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  joinDate: user.createdAt,
  deviceCount: (user.devices || []).length,
  plan: user.subscription?.planType || 'none',
  subscriptionStatus: user.subscription?.status || 'inactive',
});

const formatContentRow = (content) => ({
  id: content._id,
  title: content.title,
  type: content.type,
  views: content.views,
  rating: content.rating,
  status: content.status,
});

const formatSubscriptionRow = (payment) => ({
  id: payment.transactionId,
  userEmail: payment.user?.email,
  userName: payment.user?.name,
  plan: payment.planType,
  status: payment.status,
  amount: payment.amount,
  nextBilling: payment.nextBillingDate,
  createdAt: payment.createdAt,
});

export const getDashboardOverview = async () => {
  const [
    totalUsers,
    totalContent,
    revenueAggregate,
    activeSubscriptions,
    expiredSubscriptions,
    premiumUsers,
    totalMovies,
    totalSeries,
    totalEpisodes,
    recentUsers,
    topContent,
    pendingReports,
    recentBroadcasts,
    watchTimeAggregate,
  ] = await Promise.all([
    User.countDocuments(),
    Content.countDocuments({ status: { $ne: 'archived' } }),
    Payment.aggregate([
      { $match: { status: { $in: ['completed', 'success'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
    ]),
    User.countDocuments({ 'subscription.status': 'active', 'subscription.planType': { $ne: 'none' } }),
    User.countDocuments({ 'subscription.status': 'cancelled' }),
    User.countDocuments({ 'subscription.status': 'active', 'subscription.planType': { $ne: 'none' } }),
    Content.countDocuments({ type: 'Movie', status: { $ne: 'archived' } }),
    Content.countDocuments({ type: 'Series', parentSeries: null, status: { $ne: 'archived' } }),
    Content.countDocuments({ parentSeries: { $ne: null }, status: { $ne: 'archived' } }),
    User.find().sort({ createdAt: -1 }).limit(5),
    Content.find({ status: 'published' }).sort({ views: -1, rating: -1 }).limit(10),
    Report.countDocuments({ status: 'pending' }),
    Notification.find({ createdBy: { $ne: null } }).sort({ createdAt: -1 }).limit(5),
    Content.aggregate([
      { $match: { videoDuration: { $gt: 0 }, views: { $gt: 0 } } },
      { $group: { _id: null, totalWatchTime: { $sum: { $multiply: ['$videoDuration', '$views'] } } } },
    ]),
  ]);

  const totalRevenue = revenueAggregate[0] ? revenueAggregate[0].totalRevenue : 0;
  const totalWatchTimeSec = watchTimeAggregate[0] ? watchTimeAggregate[0].totalWatchTime : 0;
  const totalWatchTimeHours = Number((totalWatchTimeSec / 3600).toFixed(2));

  return {
    stats: {
      totalUsers,
      totalContent,
      totalRevenue,
      activeSubscriptions,
      expiredSubscriptions,
      premiumUsers,
      totalMovies,
      totalSeries,
      totalEpisodes,
      totalWatchTimeSeconds: totalWatchTimeSec,
      totalWatchTimeHours,
      pendingReports,
    },
    recentUsers: recentUsers.map(formatUserRow),
    topContent: topContent.map(formatContentRow),
    recentBroadcasts,
  };
};

export const getDashboardStats = async () => {
  const overview = await getDashboardOverview();
  return overview.stats;
};

export const getUsers = async ({ search, status, plan, page, limit }) => {
  const filters = {};

  if (status && status !== 'all') filters.status = status;
  if (plan   && plan   !== 'all') filters['subscription.planType'] = plan;

  if (search) {
    const re = new RegExp(search.trim(), 'i');
    filters.$or = [{ name: re }, { email: re }];
  }

  const parsedPage  = Math.max(1, parseInt(page,  10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const [users, total] = await Promise.all([
    User.find(filters).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit),
    User.countDocuments(filters),
  ]);

  return {
    users: users.map(formatUserRow),
    total,
    page: parsedPage,
    totalPages: Math.max(1, Math.ceil(total / parsedLimit)),
  };
};

export const getSubscriptions = async ({ plan, status, page, limit }) => {
  const filters = {};

  if (plan && plan !== 'all') {
    filters.planType = plan;
  }

  if (status && status !== 'all') {
    filters.status = status;
  }

  const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const [subscriptions, total] = await Promise.all([
    Payment.find(filters)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    Payment.countDocuments(filters),
  ]);

  return {
    subscriptions: subscriptions.map(formatSubscriptionRow),
    total,
    page: parsedPage,
    totalPages: Math.max(1, Math.ceil(total / parsedLimit)),
  };
};

export const getReports = async ({ status, page, limit }) => {
  const filters = {};

  if (status && status !== 'all') {
    filters.status = status;
  }

  const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const [reports, total] = await Promise.all([
    Report.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),
    Report.countDocuments(filters),
  ]);

  return {
    reports,
    total,
    page: parsedPage,
    totalPages: Math.max(1, Math.ceil(total / parsedLimit)),
  };
};

export const updateReportStatus = async (reportId, payload) => {
  const { status } = validate(reportStatusSchema, payload);

  const report = await Report.findByIdAndUpdate(
    reportId,
    { status },
    { new: true, runValidators: true }
  );

  if (!report) {
    throw new AppError('Report not found', 404);
  }

  return report;
};

export const getAllUsers = async ({
  page = 1,
  limit = 20,
  search = '',
  status = '',
  plan = '',
  role = '',
  sortBy = 'createdAt',
  sortOrder = 'desc',
  dateFrom = '',
  dateTo = '',
}) => {
  const query = {};

  // Search by name or email
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  // Filters
  if (status) query.status = status;
  if (role)   query.role = role;
  if (plan) {
    const dbPlan = plan === 'free' ? 'none' : plan;
    query['subscription.planType'] = dbPlan;
  }

  // Date range filter
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo)   query.createdAt.$lte = new Date(dateTo);
  }

  const skip = (page - 1) * limit;
  const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [users, total] = await Promise.all([
    User.find(query)
      .select(`
        _id name email avatar role status 
        subscription devices createdAt 
        lastLoginAt googleId preferences
      `)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    User.countDocuments(query),
  ]);

  // Inject plan limits, isPremium, lastLogin, and parentalControl
  const usersWithVirtuals = users.map(user => {
    const planType = user.subscription?.planType || 'none';
    const isPremium = user.subscription?.status === 'active' && planType !== 'none';
    const planLimits = getPlanLimits(isPremium ? planType : 'free');
    return {
      ...user,
      isPremium,
      lastLogin: user.lastLoginAt || null,
      parentalControl: user.preferences?.parentalControls || false,
      currentPlanLimits: planLimits,
      subscription: {
        ...user.subscription,
        plan: planType === 'none' ? 'free' : planType,
      }
    };
  });

  return {
    users: usersWithVirtuals,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getUserById = async (userId) => {
  const user = await User.findById(userId)
    .select('-password -__v')
    .lean();

  if (!user) throw new AppError('User not found', 404);

  // Get payment history for this user
  const payments = await Payment.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Get watchlist count
  const watchlistCount = user.watchlist?.length || 0;

  // Get active devices count
  const activeDevices = user.devices || [];

  const planType = user.subscription?.planType || 'none';
  const isPremium = user.subscription?.status === 'active' && planType !== 'none';
  const planLimits = getPlanLimits(isPremium ? planType : 'free');

  const formattedUser = {
    ...user,
    isPremium,
    lastLogin: user.lastLoginAt || null,
    parentalControl: user.preferences?.parentalControls || false,
    currentPlanLimits: planLimits,
    subscription: {
      ...user.subscription,
      plan: planType === 'none' ? 'free' : planType,
    }
  };

  return {
    user: formattedUser,
    payments,
    watchlistCount,
    activeDevicesCount: activeDevices.length,
    activeDevices,
  };
};

export const getUserStats = async () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo  = new Date(now - 7  * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    premiumUsers,
    newThisMonth,
    newThisWeek,
    planBreakdown,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: 'active' }),
    User.countDocuments({ status: 'suspended' }),
    User.countDocuments({ 'subscription.status': 'active', 'subscription.planType': { $ne: 'none' } }),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    User.aggregate([
      { $group: { 
        _id: '$subscription.planType', 
        count: { $sum: 1 } 
      }},
    ]),
  ]);

  return {
    totalUsers,
    activeUsers,
    suspendedUsers,
    premiumUsers,
    newThisMonth,
    newThisWeek,
    planBreakdown,
  };
};
