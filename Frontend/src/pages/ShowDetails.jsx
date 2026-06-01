import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, Play } from 'lucide-react';
import Button from '../components/Button';
import StatePanel from '../components/StatePanel';
import { getContentById, getContentList, registerWatch } from '../features/content/content.service';
import { useAuth } from '../features/auth/AuthContext';
import { useWatchlist } from '../features/watchlist/WatchlistContext';
import {
  hasParentalControlsEnabled,
  getParentalControlsRestrictionReason,
  isContentRestrictedByParentalControls,
  PARENTAL_CONTROLS_DESCRIPTION,
} from '../lib/contentAccess';
import { isSuspensionMessage } from '../lib/api';
import fallbackMovies from '../data/movies.json';
import { normalizeContentId } from '../lib/ids';
import VideoPlayer from '../components/VideoPlayer';
import SubscriptionLockScreen from '../components/SubscriptionLockScreen';
import './ShowDetails.css';

const DEMO_VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4';
const resolveContentId = (item) => normalizeContentId(item?.id ?? item?._id ?? item?.contentId);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export default function ShowDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isDummyMode = import.meta.env.VITE_PAYMENT_MODE === 'dummy';
  const { hasRestrictedAccess, isSuspended, isActive, isAuthenticated, suspension, user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [content, setContent] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState(0);
  const [loadedDurations, setLoadedDurations] = useState({});
  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [seriesCatalog, setSeriesCatalog] = useState([]);
  const playerRef = useRef(null);
  const {
    addItem,
    hasLoaded: hasLoadedWatchlist,
    isInWatchlist,
    isPending,
    refreshWatchlist,
    removeItem,
  } = useWatchlist();

  // ── Load content ────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    window.scrollTo(0, 0);

    const loadShow = async () => {
      setLoading(true);
      setLoadError('');
      setActionError('');

      try {
        const contentItem = await getContentById(id);

        if (!isMounted) return;

        setContent({
          ...contentItem,
          videoUrl: contentItem.playbackBlocked ? '' : (contentItem.videoUrl || DEMO_VIDEO_URL),
        });
        setSelectedEpisodeIndex(0);

        // Load real episodes if this is a Series
        if (contentItem.type === 'Series' && !contentItem.parentSeries) {
          try {
            const response = await fetch(`${API_BASE}/content/${id}/episodes`, {
              credentials: 'include',
            });
            const data = await response.json();
            if (data.success && data.data?.episodes?.length > 0) {
              setEpisodes(data.data.episodes);
            }
          } catch {
            // Episodes fetch failed silently — will use fallback
          }
        }
      } catch (apiError) {
        if (isMounted) {
          if (isSuspensionMessage(apiError?.message)) {
            navigate('/account-suspended');
            return;
          }

          if (/parental controls/i.test(apiError?.message || '')) {
            setLoadError(apiError.message);
            return;
          }

          const isNumericId = /^\d+$/.test(id);
          if (isNumericId) {
            const numericId = Number(id);
            const fallbackItem = fallbackMovies.find(m => m.id === numericId);
            if (fallbackItem) {
              setContent({ ...fallbackItem, videoUrl: DEMO_VIDEO_URL });
              setSelectedEpisodeIndex(0);
              setIsDemoMode(true);
              setLoadError('');
              return;
            }
          }

          setLoadError(apiError.message || 'Content not found.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadShow();
    return () => { isMounted = false; };
  }, [id, navigate]);

  useEffect(() => {
    let isMounted = true;

    const loadSeriesCatalog = async () => {
      try {
        const list = await getContentList({ type: 'Series', limit: 200 });
        if (isMounted) {
          setSeriesCatalog((list || []).filter((item) => !item.parentSeries));
        }
      } catch {
        if (isMounted) setSeriesCatalog([]);
      }
    };

    loadSeriesCatalog();
    return () => { isMounted = false; };
  }, []);

  const contentId = resolveContentId(content);
  const inWatchlist = contentId ? isInWatchlist(contentId) : false;
  const currentSeriesIndex = useMemo(() => {
    if (!contentId || !seriesCatalog.length) return -1;
    return seriesCatalog.findIndex((item) => resolveContentId(item) === contentId);
  }, [contentId, seriesCatalog]);
  const prevSeries = currentSeriesIndex > 0 ? seriesCatalog[currentSeriesIndex - 1] : null;
  const nextSeries = currentSeriesIndex >= 0 && currentSeriesIndex < seriesCatalog.length - 1
    ? seriesCatalog[currentSeriesIndex + 1]
    : null;

  // ── Build episode list (real or fallback) ───────────
  const episodeList = useMemo(() => {
    const getPreciseRuntime = (id, defaultDurationSec) => {
      const parsedSec = loadedDurations[id] ?? defaultDurationSec;
      if (!parsedSec || parsedSec <= 0) return '—';
      if (parsedSec < 60) return `${Math.round(parsedSec)} sec`;
      return `${Math.round(parsedSec / 60)} min`;
    };

    // Real episodes from API
    if (episodes.length > 0) {
      return episodes.map((ep, index) => ({
        id: ep.id,
        epNum: `S${ep.seasonNumber || 1}E${ep.episodeNumber || index + 1}`,
        title: ep.episodeTitle || ep.title,
        runtime: getPreciseRuntime(ep.id, ep.videoDuration),
        videoUrl: ep.videoUrl,
        trailerUrl: ep.trailerUrl,
        isFreeEpisode: ep.isFreeEpisode,
        accessLevel: ep.accessLevel,
        videoQualities: ep.videoQualities,
      }));
    }

    // Fallback for series without real episodes
    if (content?.type === 'Series') {
      // If a single video was uploaded directly at the parent series level,
      // only show that one single video and the trailer!
      if (content.videoUrl) {
        return [{
          id: `${content.id}-single`,
          epNum: 'Episode 1',
          title: content.title,
          runtime: getPreciseRuntime(`${content.id}-single`, content.videoDuration),
          videoUrl: content.videoUrl,
          isFreeEpisode: true,
          accessLevel: content.accessLevel || 'free',
        }];
      }

      // No video URL uploaded at the series level — generate fallback chapters
      return Array.from({ length: 6 }, (_, index) => ({
        id: `${content.id}-${index + 1}`,
        epNum: `Episode ${index + 1}`,
        title: `${content.title} - Chapter ${index + 1}`,
        runtime: getPreciseRuntime(`${content.id}-${index + 1}`, (42 + index) * 60),
        videoUrl: content.videoUrl,
        isFreeEpisode: index === 0,
        accessLevel: index === 0 ? 'free' : (content.accessLevel || 'free'),
      }));
    }

    // Movie — single entry
    if (content) {
      return [{
        id: `${content.id}-feature`,
        epNum: 'Feature',
        title: content.title,
        runtime: getPreciseRuntime(`${content.id}-feature`, content.videoDuration),
        videoUrl: content.videoUrl,
        accessLevel: content.accessLevel,
        videoQualities: content.videoQualities,
      }];
    }

    return [];
  }, [content, episodes, loadedDurations]);

  // ── Dynamically load real video durations ───────────
  useEffect(() => {
    episodeList.forEach((episode) => {
      if (!episode.videoUrl || loadedDurations[episode.id]) return;

      const tempVideo = document.createElement('video');
      tempVideo.src = episode.videoUrl;
      tempVideo.preload = 'metadata';
      tempVideo.onloadedmetadata = () => {
        setLoadedDurations((prev) => ({
          ...prev,
          [episode.id]: tempVideo.duration,
        }));
      };
    });
  }, [episodeList, loadedDurations]);

  const activeEpisode = episodeList[selectedEpisodeIndex] || episodeList[0] || null;
  const playbackRestrictedByParentalControls = isContentRestrictedByParentalControls(content, user);
  const parentalControlsEnabled = hasParentalControlsEnabled(user);

  const isPremiumContent = content?.accessLevel === 'premium' || content?.isPremium;
  const isSubscribed = user?.subscription?.status === 'active' && user?.subscription?.planType !== 'none';
  const playbackBlocked = hasRestrictedAccess || isSuspended || !isActive || playbackRestrictedByParentalControls || content?.playbackBlocked ||
    (isPremiumContent && !isSubscribed && isAuthenticated);
  const showLockScreen = isPremiumContent && (!isAuthenticated || !isSubscribed) && !playbackRestrictedByParentalControls && !hasRestrictedAccess;

  const watchlistPending = contentId ? isPending(contentId) : false;
  const watchlistReady = !isAuthenticated || hasLoadedWatchlist;

  useEffect(() => {
    if (!shouldAutoplay || !playerRef.current) return;
    const playPromise = playerRef.current.play();
    if (typeof playPromise?.catch === 'function') playPromise.catch(() => null);
    setShouldAutoplay(false);
  }, [selectedEpisodeIndex, shouldAutoplay]);

  const focusPlayer = () => {
    requestAnimationFrame(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  // ── Start playback ──────────────────────────────────
  const startPlayback = async (episodeIndex = 0) => {
    if (hasRestrictedAccess) {
      setActionError('Access revoked. Banned accounts cannot play content.');
      return;
    }

    if (playbackRestrictedByParentalControls) {
      setActionError(getParentalControlsRestrictionReason(content));
      return;
    }

    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/show/${id}` } });
      return;
    }

    setLoading(true);
    try {
      await registerWatch(id);
      await refreshUser();
      setActionError('');
      setSelectedEpisodeIndex(episodeIndex);
      setShouldAutoplay(true);
      setShowTrailer(false);
      focusPlayer();
    } catch (apiError) {
      setActionError(apiError.message || 'Failed to register playback session.');
    } finally {
      setLoading(false);
    }
  };

  // ── Watch trailer ───────────────────────────────────
  const handleWatchTrailer = () => {
    setShowTrailer(true);
    focusPlayer();
  };

  // ── Watchlist toggle ────────────────────────────────
  const handleWatchlistToggle = async () => {
    if (hasRestrictedAccess) {
      setActionError(suspension?.message || 'Watchlist changes are unavailable while this account is suspended.');
      navigate('/account-suspended');
      return;
    }

    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/show/${id}` } });
      return;
    }

    if (!watchlistReady) {
      try { await refreshWatchlist(); } catch (apiError) { setActionError(apiError.message); return; }
    }

    setActionError('');
    try {
      if (inWatchlist) await removeItem(contentId);
      else await addItem({ ...content, id: contentId });
    } catch (apiError) {
      setActionError(apiError.message);
    }
  };

  // ── Loading / error states ──────────────────────────
  if (loading) {
    return <StatePanel title="Loading show details" message="Fetching metadata, artwork, and watchlist state." />;
  }

  if (!content && !loading) {
    return (
      <div style={{
        textAlign: 'center', padding: '8rem 2rem', color: '#A0A0A8',
        background: '#0D0D0F', minHeight: '100vh',
      }}>
        <h2 style={{ color: 'var(--gold-light)', fontFamily: 'var(--font-serif)', fontSize: '2rem' }}>Content not found</h2>
        <p style={{ marginTop: '12px', marginBottom: '24px', fontSize: '1.1rem' }}>This title may no longer be available.</p>
        <Button variant="primary" onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  if (loadError) {
    return <StatePanel title="This title is unavailable" message={loadError} />;
  }

  return (
    <div className="show-details-page container">
      {isDemoMode && (
        <div style={{ backgroundColor: 'var(--primary)', color: 'var(--text)', textAlign: 'center', padding: '8px', zIndex: 1000, position: 'relative' }}>
          <strong>Notice:</strong> Demo content is being shown. No backend connection.
        </div>
      )}
      <div className="show-hero">
        <div className="show-hero-poster-container">
          <img src={content.image || content.thumbnailUrl} alt={content.title} className="show-poster-img" />
          {content.type === 'Series' && (
            <div className="series-nav-controls">
              <Button
                variant="outline"
                className="series-nav-btn"
                onClick={() => prevSeries && navigate(`/show/${resolveContentId(prevSeries)}`)}
                disabled={!prevSeries}
              >
                <ChevronLeft size={14} /> Prev Series
              </Button>
              <Button
                variant="outline"
                className="series-nav-btn"
                onClick={() => nextSeries && navigate(`/show/${resolveContentId(nextSeries)}`)}
                disabled={!nextSeries}
              >
                Next Series <ChevronRight size={14} />
              </Button>
            </div>
          )}
        </div>

        <div className="show-hero-info">
          <h1 className="show-title">{content.title}</h1>
          <h3 className="show-subtitle">
            {content.type} / {content.genre}
            {content.releaseYear && <span> · {content.releaseYear}</span>}
            {content.language && content.language !== 'English' && <span> · {content.language}</span>}
          </h3>

          <p className="show-desc">{content.desc || content.description}</p>

          <div className="show-tags">
            {(content.tags?.length ? content.tags : [content.genre]).map((tag) => (
              <span key={tag} className="show-tag">{tag.replace('_', ' ')}</span>
            ))}
            {isPremiumContent && (
              <span className="show-tag" style={{ background: 'rgba(229,9,20,0.15)', color: '#e50914', border: '1px solid rgba(229,9,20,0.3)' }}>
                ★ Premium
              </span>
            )}
          </div>

          <div className="show-stats">
            <span className="stat-item"><Heart fill="#333" color="#333" size={18} /> {(content.views || 0).toLocaleString()} views</span>
            <span className="stat-item"><Heart fill="#333" color="#333" size={18} /> {(content.rating || 0).toFixed(1)} / 5</span>
            {content.maturityRating && (
              <span className="stat-item" style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                {content.maturityRating}
              </span>
            )}
          </div>

          {actionError ? (
            <div className="show-inline-feedback" style={{
              background: 'rgba(255, 107, 107, 0.08)', border: '1px solid rgba(255, 107, 107, 0.25)',
              padding: '16px', borderRadius: '8px', marginTop: '16px',
              display: 'flex', flexDirection: 'column', gap: '12px', width: '100%',
            }}>
              <span style={{ color: '#FF6B6B', fontSize: '14px', fontWeight: '500' }}>⚠️ {actionError}</span>
              {actionError.includes('Free limit') && (
                <div>
                  {isSuspended ? (
                    <a
                      href="mailto:support@blackreel.com?subject=Suspended%20Account%20Subscription%20Inquiry"
                      className="btn btn-outline"
                      style={{
                        display: 'inline-block', padding: '8px 16px', fontSize: '13px', fontWeight: '600',
                        color: '#FF6B6B', border: '1px solid #FF6B6B', borderRadius: '4px',
                        textDecoration: 'none', textAlign: 'center',
                      }}
                    >
                      Contact Customer Support
                    </a>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => navigate('/subscribe')}
                      style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600' }}
                    >
                      Choose Subscription Plan
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {parentalControlsEnabled && !playbackRestrictedByParentalControls ? (
            <div className="parental-controls-banner">
              <strong>Parental Controls are active</strong>
              <span>This title is allowed, but mature or premium titles remain locked.</span>
              <small>{PARENTAL_CONTROLS_DESCRIPTION}</small>
            </div>
          ) : null}

          <div className="show-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              className="episode-btn"
              onClick={() => { void startPlayback(0); }}
              disabled={playbackBlocked && !showLockScreen}
            >
              <Play size={14} fill="currentColor" style={{ marginRight: '6px' }} />{' '}
              {playbackRestrictedByParentalControls ? 'Locked' : 'Play'}
            </Button>

            {content.trailerUrl && (
              <Button
                variant="outline"
                className="episode-btn"
                onClick={handleWatchTrailer}
              >
                <Play size={14} fill="currentColor" style={{ marginRight: '6px' }} /> Trailer
              </Button>
            )}

            <Button
              variant="outline"
              className="episode-btn"
              onClick={handleWatchlistToggle}
              disabled={watchlistPending || hasRestrictedAccess || (isAuthenticated && !watchlistReady)}
            >
              {watchlistPending
                ? 'Updating Watchlist...'
                : isAuthenticated && !watchlistReady
                  ? 'Checking Watchlist...'
                  : inWatchlist
                    ? 'Remove from Watchlist'
                    : 'Add to Watchlist'}
            </Button>
          </div>

          {playbackRestrictedByParentalControls ? (
            <div className="parental-controls-banner">
              <strong>Playback restricted</strong>
              <span>{getParentalControlsRestrictionReason(content)}</span>
              <small>{PARENTAL_CONTROLS_DESCRIPTION}</small>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Player Section ──────────────────────────── */}
      <section className="show-player-section">
        <div className="show-player-header">
          <div>
            <p className="show-player-kicker">
              {showTrailer ? 'Trailer' : 'Now Playing'}
            </p>
            <h2 className="show-player-title">
              {showTrailer ? `${content.title} — Trailer` : (activeEpisode?.title || content.title)}
            </h2>
          </div>
          <span className="show-player-runtime">{activeEpisode?.runtime || 'Demo video'}</span>
        </div>

        {showTrailer ? (
          <VideoPlayer
            videoUrl={content.trailerUrl}
            title={`${content.title} — Trailer`}
          />
        ) : showLockScreen ? (
          <SubscriptionLockScreen
            content={content}
            onWatchTrailer={content.trailerUrl ? handleWatchTrailer : null}
            backgroundImage={content.heroImageUrl || content.thumbnailUrl || content.image}
          />
        ) : playbackBlocked ? (
          <StatePanel
            title="Playback unavailable"
            message={
              hasRestrictedAccess
                ? 'Access revoked. Banned accounts cannot stream content.'
                : playbackRestrictedByParentalControls
                  ? getParentalControlsRestrictionReason(content)
                  : isSuspended
                    ? 'Free limit exhausted. Your account is currently suspended and cannot purchase a subscription. Please contact support.'
                    : 'Free limit exhausted. Please purchase a subscription to continue watching.'
            }
            actionLabel={
              hasRestrictedAccess || isSuspended
                ? 'Contact Support'
                : playbackRestrictedByParentalControls
                  ? 'Review Settings'
                  : 'Choose Plan'
            }
            onAction={() => {
              if (hasRestrictedAccess || isSuspended) { navigate('/support'); return; }
              if (playbackRestrictedByParentalControls) { navigate('/profile'); return; }
              navigate(isDummyMode ? '/plans' : '/subscribe');
            }}
          />
        ) : (
          <VideoPlayer
            videoUrl={activeEpisode?.videoUrl || content.videoUrl}
            title={activeEpisode?.title || content.title}
            trailerUrl={content.trailerUrl}
            videoQualities={activeEpisode?.videoQualities || content.videoQualities}
            showNextEpisode={content.type === 'Series' && selectedEpisodeIndex < episodeList.length - 1}
            onNextEpisode={() => {
              if (selectedEpisodeIndex < episodeList.length - 1) {
                void startPlayback(selectedEpisodeIndex + 1);
              }
            }}
          />
        )}
      </section>

      {/* ── Episodes List ───────────────────────────── */}
      <section className="episodes-list-section">
        <h2 className="episodes-list-title">
          {content.type === 'Series' ? 'Episodes' : 'Now Playing'}{' '}
          <span className="season-text">({content.type})</span>
        </h2>

        <div className="episodes-list">
          {episodeList.map((episode, index) => (
            <div
              key={episode.id}
              className={`episode-list-item ${selectedEpisodeIndex === index ? 'active' : ''}`}
            >
              <div className="ep-item-copy">
                <span className="ep-item-title">
                  {episode.epNum} - {episode.title}
                  {episode.isFreeEpisode && (
                    <span style={{
                      marginLeft: '8px', fontSize: '10px', padding: '2px 6px',
                      background: 'rgba(34,197,94,0.15)', color: '#22c55e',
                      borderRadius: '4px', fontWeight: '600',
                    }}>
                      FREE
                    </span>
                  )}
                  {episode.accessLevel === 'premium' && !episode.isFreeEpisode && (
                    <span style={{
                      marginLeft: '8px', fontSize: '10px', padding: '2px 6px',
                      background: 'rgba(229,9,20,0.15)', color: '#e50914',
                      borderRadius: '4px', fontWeight: '600',
                    }}>
                      PREMIUM
                    </span>
                  )}
                </span>
                <span className="ep-item-meta">{episode.runtime}</span>
              </div>
              <Button
                variant="outline"
                className="ep-play-btn"
                onClick={() => { void startPlayback(index); }}
                disabled={playbackBlocked && episode.accessLevel === 'premium' && !episode.isFreeEpisode}
              >
                <Play size={14} fill="currentColor" style={{ marginRight: '6px' }} />{' '}
                {playbackRestrictedByParentalControls
                  ? 'LOCKED'
                  : selectedEpisodeIndex === index
                    ? 'PLAYING'
                    : 'PLAY'}
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
