import Content from '../models/content.model.js';
import AppError from '../utils/AppError.js';

// ── Quality tiers per subscription plan ────────────────
const PLAN_MAX_QUALITY = {
  none: 'p480',      // Free users: max 480p
  basic: 'p480',     // Basic: 480p, 1 device
  standard: 'p1080', // Standard: 720p/1080p, 2 devices
  premium: 'p2160',  // Premium: 4K, 4 devices
};

const QUALITY_ORDER = ['p240', 'p360', 'p480', 'p720', 'p1080', 'p2160'];

const PLAN_DEVICE_LIMITS = {
  none: 1,
  basic: 1,
  standard: 2,
  premium: 4,
};

/**
 * Get the maximum quality key allowed for a subscription plan.
 */
export const getMaxQualityForPlan = (planType) => {
  return PLAN_MAX_QUALITY[planType] || PLAN_MAX_QUALITY.none;
};

/**
 * Get the device limit for a subscription plan.
 */
export const getDeviceLimitForPlan = (planType) => {
  return PLAN_DEVICE_LIMITS[planType] || 1;
};

/**
 * Get the list of available qualities for a plan (up to and including max).
 */
export const getAvailableQualities = (planType) => {
  const maxQuality = getMaxQualityForPlan(planType);
  const maxIndex = QUALITY_ORDER.indexOf(maxQuality);
  return QUALITY_ORDER.slice(0, maxIndex + 1);
};

/**
 * Check whether a user can access content.
 * Returns { allowed, reason, canWatchTrailer, upgradeRequired }
 */
export const canAccessContent = (user, content) => {
  const result = {
    allowed: false,
    reason: '',
    canWatchTrailer: true,
    upgradeRequired: false,
  };

  // Everyone can watch trailers
  if (!content) {
    result.reason = 'Content not found';
    result.canWatchTrailer = false;
    return result;
  }

  // Free content or free episodes — everyone can watch
  if (content.accessLevel === 'free' || content.isFreeEpisode) {
    result.allowed = true;
    return result;
  }

  // Guest / unauthenticated
  if (!user) {
    result.reason = 'Sign in to watch this content';
    result.upgradeRequired = true;
    return result;
  }

  // Banned user
  if (user.status === 'banned') {
    result.reason = 'Your account has been banned. Please contact support.';
    result.canWatchTrailer = false;
    return result;
  }

  // Suspended user
  if (user.status === 'suspended') {
    result.reason = 'Your account is suspended. Please contact support.';
    result.canWatchTrailer = true;
    result.upgradeRequired = false;
    return result;
  }

  // Check subscription
  const isSubscribed = user.subscription?.status === 'active' &&
    user.subscription?.planType !== 'none';

  if (!isSubscribed) {
    result.reason = 'This content requires a subscription. Please upgrade your plan.';
    result.upgradeRequired = true;
    return result;
  }

  // Subscriber — allowed
  result.allowed = true;
  return result;
};

/**
 * Resolve the correct stream URL for a user's plan.
 * Returns the best quality URL the user is allowed to watch.
 */
export const getStreamUrl = async (contentId, user) => {
  const content = await Content.findById(contentId);
  if (!content) throw new AppError('Content not found', 404);

  const access = canAccessContent(user, content);
  if (!access.allowed) {
    throw new AppError(access.reason, 403);
  }

  const planType = user?.subscription?.planType || 'none';
  const maxQuality = getMaxQualityForPlan(planType);
  const maxIndex = QUALITY_ORDER.indexOf(maxQuality);

  // Find the best available quality within the user's plan limit
  const qualities = content.videoQualities || {};
  let bestUrl = content.videoUrl; // fallback to original

  for (let i = maxIndex; i >= 0; i--) {
    const qualityKey = QUALITY_ORDER[i];
    if (qualities[qualityKey]) {
      bestUrl = qualities[qualityKey];
      break;
    }
  }

  return {
    url: bestUrl,
    quality: maxQuality,
    availableQualities: getAvailableQualities(planType),
    allQualities: qualities,
  };
};
