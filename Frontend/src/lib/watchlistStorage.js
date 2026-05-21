const WATCHLIST_STORAGE_KEY_PREFIX = 'blackreel-watchlist';

export const buildWatchlistStorageKey = (userId) => `${WATCHLIST_STORAGE_KEY_PREFIX}:${userId}`;

export const getStoredWatchlist = (userId) => {
  if (!userId) {
    return [];
  }

  const storageKey = buildWatchlistStorageKey(userId);

  try {
    const rawValue = localStorage.getItem(storageKey);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    localStorage.removeItem(storageKey);
    return [];
  }
};

export const setStoredWatchlist = (userId, items) => {
  if (!userId) {
    return;
  }

  localStorage.setItem(buildWatchlistStorageKey(userId), JSON.stringify(items));
};

export const clearStoredWatchlist = (userId) => {
  if (!userId) {
    return;
  }

  localStorage.removeItem(buildWatchlistStorageKey(userId));
};

