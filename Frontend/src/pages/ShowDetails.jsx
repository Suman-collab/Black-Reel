import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, Play } from 'lucide-react';
import Button from '../components/Button';
import StatePanel from '../components/StatePanel';
import { getContentById } from '../features/content/content.service';
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
import './ShowDetails.css';

const DEMO_VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4';
const resolveContentId = (item) => normalizeContentId(item?.id ?? item?._id ?? item?.contentId);

export default function ShowDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ensureActiveSession, hasRestrictedAccess, isAuthenticated, suspension, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [content, setContent] = useState(null);
  const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState(0);
  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const playerRef = useRef(null);
  const {
    addItem,
    hasLoaded: hasLoadedWatchlist,
    isInWatchlist,
    isPending,
    refreshWatchlist,
    removeItem,
  } = useWatchlist();

  useEffect(() => {
    let isMounted = true;
    window.scrollTo(0, 0);

    const loadShow = async () => {
      setLoading(true);
      setLoadError('');
      setActionError('');

      try {
        const contentItem = await getContentById(id);

        if (!isMounted) {
          return;
        }

        setContent({ ...contentItem, videoUrl: contentItem.videoUrl || DEMO_VIDEO_URL });
        setSelectedEpisodeIndex(0);
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

          const fallbackItem = fallbackMovies.find(m => m.id === Number(id)) || fallbackMovies[0];
          if (fallbackItem) {
            setContent({ ...fallbackItem, videoUrl: DEMO_VIDEO_URL });
            setSelectedEpisodeIndex(0);
            setIsDemoMode(true);
            setLoadError('');
          } else {
            setLoadError(apiError.message);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadShow();

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  const contentId = resolveContentId(content);
  const inWatchlist = contentId ? isInWatchlist(contentId) : false;
  const episodes = useMemo(() => {
    if (!content) {
      return [];
    }

    if (content.type === 'Series') {
      return Array.from({ length: 6 }, (_, index) => ({
        id: `${content.id}-${index + 1}`,
        epNum: `Episode ${index + 1}`,
        title: `${content.title} - Chapter ${index + 1}`,
        runtime: `${42 + index} min`,
        videoUrl: content.videoUrl,
      }));
    }

    return [
      {
        id: `${content.id}-feature`,
        epNum: 'Feature',
        title: content.title,
        runtime: '98 min',
        videoUrl: content.videoUrl,
      },
    ];
  }, [content]);
  const activeEpisode = episodes[selectedEpisodeIndex] || episodes[0] || null;
  const playbackRestrictedByParentalControls = isContentRestrictedByParentalControls(content, user);
  const parentalControlsEnabled = hasParentalControlsEnabled(user);
  const playbackBlocked = hasRestrictedAccess || playbackRestrictedByParentalControls;
  const watchlistPending = contentId ? isPending(contentId) : false;
  const watchlistReady = !isAuthenticated || hasLoadedWatchlist;

  useEffect(() => {
    if (!shouldAutoplay || !playerRef.current) {
      return;
    }

    const playPromise = playerRef.current.play();
    if (typeof playPromise?.catch === 'function') {
      playPromise.catch(() => null);
    }
    setShouldAutoplay(false);
  }, [selectedEpisodeIndex, shouldAutoplay]);

  const focusPlayer = () => {
    requestAnimationFrame(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const startPlayback = async (episodeIndex = 0) => {
    if (hasRestrictedAccess) {
      setActionError(suspension?.message || 'Playback is unavailable while this account is suspended.');
      navigate('/account-suspended');
      return;
    }

    if (playbackRestrictedByParentalControls) {
      setActionError(getParentalControlsRestrictionReason(content));
      return;
    }

    if (isAuthenticated) {
      const activeUser = await ensureActiveSession();

      if (!activeUser) {
        return;
      }
    }

    setActionError('');
    setSelectedEpisodeIndex(episodeIndex);
    setShouldAutoplay(true);
    focusPlayer();
  };

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
      try {
        await refreshWatchlist();
      } catch (apiError) {
        setActionError(apiError.message);
        return;
      }
    }

    setActionError('');

    try {
      if (inWatchlist) {
        await removeItem(contentId);
      } else {
        await addItem({ ...content, id: contentId });
      }
    } catch (apiError) {
      setActionError(apiError.message);
    }
  };

  if (loading) {
    return <StatePanel title="Loading show details" message="Fetching metadata, artwork, and watchlist state." />;
  }

  if (loadError || !content) {
    return <StatePanel title="This title is unavailable" message={loadError || 'The selected title could not be loaded.'} />;
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
          <img src={content.image} alt={content.title} className="show-poster-img" />
        </div>

        <div className="show-hero-info">
          <h1 className="show-title">{content.title}</h1>
          <h3 className="show-subtitle">{content.type} / {content.genre}</h3>

          <p className="show-desc">{content.desc}</p>

          <div className="show-tags">
            {(content.tags?.length ? content.tags : [content.genre]).map((tag) => (
              <span key={tag} className="show-tag">{tag.replace('_', ' ')}</span>
            ))}
          </div>

          <div className="show-stats">
            <span className="stat-item"><Heart fill="#333" color="#333" size={18} /> {content.views.toLocaleString()} views</span>
            <span className="stat-item"><Heart fill="#333" color="#333" size={18} /> {content.rating.toFixed(1)} / 5</span>
          </div>

          {actionError ? <div className="show-inline-feedback">{actionError}</div> : null}
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
              onClick={() => {
                void startPlayback(0);
              }}
              disabled={playbackBlocked}
            >
              <Play size={14} fill="currentColor" style={{ marginRight: '6px' }} /> {playbackRestrictedByParentalControls ? 'Locked' : 'Play'}
            </Button>
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

      <section className="show-player-section">
        <div className="show-player-header">
          <div>
            <p className="show-player-kicker">Now Playing</p>
            <h2 className="show-player-title">{activeEpisode?.title || content.title}</h2>
          </div>
          <span className="show-player-runtime">{activeEpisode?.runtime || 'Demo video'}</span>
        </div>
        {playbackBlocked ? (
          <StatePanel
            title="Playback unavailable"
            message={
              hasRestrictedAccess
                ? suspension?.message || 'Streaming is disabled while this account is suspended.'
                : getParentalControlsRestrictionReason(content)
            }
            actionLabel={hasRestrictedAccess ? 'Contact Support' : 'Review Settings'}
            onAction={() => {
              if (hasRestrictedAccess) {
                window.location.href = 'mailto:support@blackreel.com?subject=Suspended%20Black%20Reel%20Account';
                return;
              }

              navigate('/profile');
            }}
          />
        ) : (
          <video
            ref={playerRef}
            className="show-video-player"
            controls
            preload="metadata"
            poster={content.heroImageUrl || content.image}
            src={activeEpisode?.videoUrl || content.videoUrl}
          >
            Your browser does not support the video tag.
          </video>
        )}
      </section>

      <section className="episodes-list-section">
        <h2 className="episodes-list-title">
          {content.type === 'Series' ? 'Episodes' : 'Now Playing'} <span className="season-text">({content.type})</span>
        </h2>

        <div className="episodes-list">
          {episodes.map((episode, index) => (
            <div
              key={episode.id}
              className={`episode-list-item ${selectedEpisodeIndex === index ? 'active' : ''}`}
            >
              <div className="ep-item-copy">
                <span className="ep-item-title">{episode.epNum} - {episode.title}</span>
                <span className="ep-item-meta">{episode.runtime}</span>
              </div>
              <Button
                variant="outline"
                className="ep-play-btn"
                onClick={() => {
                  void startPlayback(index);
                }}
                disabled={playbackBlocked}
              >
                <Play size={14} fill="currentColor" style={{ marginRight: '6px' }} /> {playbackRestrictedByParentalControls ? 'LOCKED' : selectedEpisodeIndex === index ? 'PLAYING' : 'PLAY'}
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
