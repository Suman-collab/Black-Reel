import User from '../models/user.model.js';
import Content from '../models/content.model.js';
import Payment from '../models/payment.model.js';
import Report from '../models/report.model.js';
import AppError from '../utils/AppError.js';
import Notification from '../models/notification.model.js';
import { z } from 'zod';
import { validate } from '../utils/validate.js';

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
  const [totalUsers, totalContent, revenueAggregate, activeSubscriptions, recentUsers, topContent, pendingReports, recentBroadcasts] =
    await Promise.all([
      User.countDocuments(),
      Content.countDocuments({ status: { $ne: 'archived' } }),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
      ]),
      User.countDocuments({ 'subscription.status': 'active' }),
      User.find().sort({ createdAt: -1 }).limit(5),
      Content.find({ status: 'published' }).sort({ views: -1, rating: -1 }).limit(5),
      Report.countDocuments({ status: 'pending' }),
      Notification.find({ createdBy: { $ne: null } }).sort({ createdAt: -1 }).limit(5),
    ]);

  const totalRevenue = revenueAggregate[0] ? revenueAggregate[0].totalRevenue : 0;

  return {
    stats: {
      totalUsers,
      totalContent,
      totalRevenue,
      activeSubscriptions,
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

export const getSubscriptions = async ({ plan, status }) => {
  const filters = {};

  if (plan && plan !== 'all') {
    filters.planType = plan;
  }

  if (status && status !== 'all') {
    filters.status = status;
  }

  const subscriptions = await Payment.find(filters)
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  return subscriptions.map(formatSubscriptionRow);
};

export const getReports = async ({ status }) => {
  const filters = {};

  if (status && status !== 'all') {
    filters.status = status;
  }

  return await Report.find(filters).sort({ createdAt: -1 });
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
