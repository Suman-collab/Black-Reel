export const PLAN_LIMITS = {
  free:     { maxDevices: 1, maxStreams: 1, quality: 'SD'       },
  basic:    { maxDevices: 1, maxStreams: 1, quality: 'HD'       },
  standard: { maxDevices: 2, maxStreams: 2, quality: 'Full HD'  },
  premium:  { maxDevices: 4, maxStreams: 4, quality: '4K'       },
};

export const getPlanLimits = (planId) => {
  const normalizedId = String(planId || 'free').toLowerCase();
  return PLAN_LIMITS[normalizedId] || PLAN_LIMITS['free'];
};
