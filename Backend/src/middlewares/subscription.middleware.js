import AppError from '../utils/AppError.js';
import { canAccessContent, getDeviceLimitForPlan } from '../services/video.service.js';

/**
 * Middleware that checks if the current user has an active subscription.
 * Blocks requests from non-subscribers with a 403 error.
 */
export const requireSubscription = (req, _res, next) => {
  const user = req.user;

  if (!user) {
    return next(new AppError('Please sign in to access this content.', 401));
  }

  const isSubscribed =
    user.subscription?.status === 'active' &&
    user.subscription?.planType !== 'none';

  if (!isSubscribed) {
    return next(
      new AppError('This content requires a subscription. Please upgrade your plan.', 403)
    );
  }

  next();
};

/**
 * Middleware that checks access to a specific piece of content.
 * Expects req.params.id to be the content ID.
 * Allows free content and free episodes through.
 */
export const checkContentAccess = (ContentModel) => async (req, _res, next) => {
  try {
    const content = await ContentModel.findById(req.params.id);
    if (!content) {
      return next(new AppError('Content not found', 404));
    }

    const access = canAccessContent(req.user, content);

    if (!access.allowed) {
      const error = new AppError(access.reason, 403);
      error.canWatchTrailer = access.canWatchTrailer;
      error.upgradeRequired = access.upgradeRequired;
      return next(error);
    }

    req.content = content;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware that checks device limits for the user's plan.
 */
export const checkDeviceLimit = (req, _res, next) => {
  const user = req.user;

  if (!user) return next();

  const planType = user.subscription?.planType || 'none';
  const maxDevices = getDeviceLimitForPlan(planType);
  const currentDevices = (user.devices || []).length;

  if (currentDevices > maxDevices) {
    return next(
      new AppError(
        `Your ${planType === 'none' ? 'free' : planType} plan allows ${maxDevices} device${maxDevices > 1 ? 's' : ''}. You have ${currentDevices} active devices. Please remove a device to continue.`,
        403
      )
    );
  }

  next();
};
