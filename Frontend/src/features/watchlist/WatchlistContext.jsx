import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  addToWatchlist as addToWatchlistRequest,
  getWatchlist,
  removeFromWatchlist as removeFromWatchlistRequest,
} from '../user/user.service';
import {
  buildWatchlistStorageKey,
  clearStoredWatchlist,
  getStoredWatchlist,
  setStoredWatchlist,
} from '../../lib/watchlistStorage';
import { normalizeContentId } from '../../lib/ids';

const WatchlistContext = createContext(null);

const normalizeWatchlistItems = (items = []) =>
  Array.isArray(items)
    ? items
        .map((item) => ({
          ...item,
          id: normalizeContentId(item?.id ?? item?._id),
        }))
        .filter((item) => item.id)
    : [];

const removeWatchlistItemById = (items, contentId) => items.filter((item) => item.id !== contentId);

const addWatchlistItemById = (items, item) => {
  const normalizedItem = {
    ...item,
    id: normalizeContentId(item?.id ?? item?._id),
  };

  if (!normalizedItem.id) {
    return items;
  }

  return [normalizedItem, ...removeWatchlistItemById(items, normalizedItem.id)];
};

export const WatchlistProvider = ({ children }) => {
  const { initialized: authInitialized, isAuthenticated, user } = useAuth();
  const activeUserId = normalizeContentId(user?.id ?? user?._id ?? '');
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState('');
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const latestRefreshRequestIdRef = useRef(0);
  const mutationVersionRef = useRef(0);
  const watchlistItemsRef = useRef([]);
  const pendingIdsRef = useRef(new Set());

  useEffect(() => {
    watchlistItemsRef.current = watchlistItems;
  }, [watchlistItems]);

  useEffect(() => {
    pendingIdsRef.current = pendingIds;
  }, [pendingIds]);

  const persistWatchlist = useCallback(
    (items) => {
      const normalizedItems = normalizeWatchlistItems(items);

      setWatchlistItems(normalizedItems);

      // Keep a per-user cache so refreshes and other tabs can hydrate quickly
      // before the API revalidates the latest watchlist state.
      if (activeUserId) {
        setStoredWatchlist(activeUserId, normalizedItems);
      }

      return normalizedItems;
    },
    [activeUserId]
  );

  const updatePendingState = useCallback((contentId, isPending) => {
    setPendingIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (isPending) {
        nextIds.add(contentId);
      } else {
        nextIds.delete(contentId);
      }

      return nextIds;
    });
  }, []);

  const refreshWatchlist = useCallback(
    async ({ silent = false } = {}) => {
      const refreshRequestId = latestRefreshRequestIdRef.current + 1;
      const mutationVersionAtStart = mutationVersionRef.current;
      latestRefreshRequestIdRef.current = refreshRequestId;

      if (!isAuthenticated || !activeUserId) {
        setWatchlistItems([]);
        setPendingIds(new Set());
        setError('');
        setHasLoaded(true);
        setLoading(false);
        return [];
      }

      if (!silent) {
        setLoading(true);
      }

      try {
        const items = await getWatchlist();

        // Ignore stale refresh responses that finish after a newer refresh
        // or after a local add/remove mutation started.
        if (refreshRequestId !== latestRefreshRequestIdRef.current) {
          return normalizeWatchlistItems(items);
        }

        if (mutationVersionRef.current !== mutationVersionAtStart) {
          return watchlistItemsRef.current;
        }

        setError('');
        return persistWatchlist(items);
      } catch (apiError) {
        if (refreshRequestId === latestRefreshRequestIdRef.current) {
          setError(apiError.message);
        }
        throw apiError;
      } finally {
        if (refreshRequestId === latestRefreshRequestIdRef.current) {
          setHasLoaded(true);
        }

        if (!silent && refreshRequestId === latestRefreshRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeUserId, isAuthenticated, persistWatchlist]
  );

  useEffect(() => {
    if (!authInitialized) {
      return;
    }

    if (!isAuthenticated || !activeUserId) {
      setWatchlistItems([]);
      setPendingIds(new Set());
      setError('');
      setHasLoaded(true);
      setLoading(false);
      return;
    }

    const cachedItems = getStoredWatchlist(activeUserId);

    setWatchlistItems(normalizeWatchlistItems(cachedItems));
    setPendingIds(new Set());
    setError('');
    setHasLoaded(cachedItems.length > 0);

    refreshWatchlist().catch(() => null);
  }, [activeUserId, authInitialized, isAuthenticated, refreshWatchlist]);

  useEffect(() => {
    if (!authInitialized || !isAuthenticated || !activeUserId) {
      return undefined;
    }

    const refreshOnFocus = () => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      refreshWatchlist({ silent: true }).catch(() => null);
    };

    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);

    return () => {
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, [activeUserId, authInitialized, isAuthenticated, refreshWatchlist]);

  useEffect(() => {
    if (!activeUserId) {
      return undefined;
    }

    const storageKey = buildWatchlistStorageKey(activeUserId);

    const handleStorage = (event) => {
      if (event.key !== storageKey) {
        return;
      }

      if (!event.newValue) {
        clearStoredWatchlist(activeUserId);
        setWatchlistItems([]);
      } else {
        setWatchlistItems(normalizeWatchlistItems(getStoredWatchlist(activeUserId)));
      }

      setError('');
      setHasLoaded(true);
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [activeUserId]);

  const watchlistIds = useMemo(
    () => new Set(watchlistItems.map((item) => normalizeContentId(item.id))),
    [watchlistItems]
  );

  const isPending = useCallback(
    (contentId) => pendingIds.has(normalizeContentId(contentId)),
    [pendingIds]
  );

  const isInWatchlist = useCallback(
    (contentId) => watchlistIds.has(normalizeContentId(contentId)),
    [watchlistIds]
  );

  const addItem = useCallback(
    async (content) => {
      const contentId = normalizeContentId(content?.id ?? content?._id);

      if (!contentId) {
        setError('Invalid content ID');
        return watchlistItems;
      }

      if (!isAuthenticated || !activeUserId) {
        const error = 'Please log in to update your watchlist.';
        setError(error);
        throw new Error(error);
      }

      if (pendingIdsRef.current.has(contentId)) {
        return watchlistItemsRef.current;
      }

      const previousItems = watchlistItemsRef.current;
      const optimisticItems = addWatchlistItemById(previousItems, content);
      mutationVersionRef.current += 1;

      setError('');
      updatePendingState(contentId, true);
      persistWatchlist(optimisticItems);

      try {
        const updatedItems = await addToWatchlistRequest(contentId);
        
        // Ensure the returned items have properly normalized IDs
        const normalizedUpdatedItems = normalizeWatchlistItems(updatedItems);
        
        const syncedItems = persistWatchlist(normalizedUpdatedItems);
        
        // Silently refresh to ensure server state matches
        void refreshWatchlist({ silent: true }).catch(() => null);
        
        return syncedItems;
      } catch (apiError) {
        mutationVersionRef.current += 1;
        persistWatchlist(previousItems);
        const errorMsg = apiError.message || 'Failed to add to watchlist';
        setError(errorMsg);
        throw apiError;
      } finally {
        updatePendingState(contentId, false);
        setHasLoaded(true);
      }
    },
    [activeUserId, isAuthenticated, persistWatchlist, refreshWatchlist, updatePendingState]
  );

  const removeItem = useCallback(
    async (contentId) => {
      const normalizedContentId = normalizeContentId(contentId);

      if (!normalizedContentId) {
        setError('Invalid content ID');
        return watchlistItemsRef.current;
      }

      if (!isAuthenticated || !activeUserId) {
        const error = 'Please log in to update your watchlist.';
        setError(error);
        throw new Error(error);
      }

      if (pendingIdsRef.current.has(normalizedContentId)) {
        return watchlistItemsRef.current;
      }

      const previousItems = watchlistItemsRef.current;
      const optimisticItems = removeWatchlistItemById(previousItems, normalizedContentId);
      mutationVersionRef.current += 1;

      setError('');
      updatePendingState(normalizedContentId, true);
      persistWatchlist(optimisticItems);

      try {
        const updatedItems = await removeFromWatchlistRequest(normalizedContentId);
        
        // Ensure the returned items have properly normalized IDs
        const normalizedUpdatedItems = normalizeWatchlistItems(updatedItems);
        
        const syncedItems = persistWatchlist(normalizedUpdatedItems);
        
        // Silently refresh to ensure server state matches
        void refreshWatchlist({ silent: true }).catch(() => null);
        
        return syncedItems;
      } catch (apiError) {
        mutationVersionRef.current += 1;
        persistWatchlist(previousItems);
        const errorMsg = apiError.message || 'Failed to remove from watchlist';
        setError(errorMsg);
        throw apiError;
      } finally {
        updatePendingState(normalizedContentId, false);
        setHasLoaded(true);
      }
    },
    [activeUserId, isAuthenticated, persistWatchlist, refreshWatchlist, updatePendingState]
  );

  const toggleItem = useCallback(
    async (content) => {
      const contentId = normalizeContentId(content?.id ?? content?._id);

      return isInWatchlist(contentId) ? removeItem(contentId) : addItem(content);
    },
    [addItem, isInWatchlist, removeItem]
  );

  const clearError = useCallback(() => {
    setError('');
  }, []);

  return (
    <WatchlistContext.Provider
      value={{
        watchlistItems,
        watchlistIds,
        loading,
        hasLoaded,
        error,
        refreshWatchlist,
        isPending,
        isInWatchlist,
        addItem,
        removeItem,
        toggleItem,
        clearError,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);

  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }

  return context;
};
