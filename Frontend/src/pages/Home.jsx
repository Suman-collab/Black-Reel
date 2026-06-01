
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import Button from '../components/Button';
import MovieCard from '../components/MovieCard';
import StatePanel from '../components/StatePanel';
import { getContentList } from '../features/content/content.service';
import { getWatchlist } from '../features/user/user.service';
import { useAuth } from '../features/auth/AuthContext';
import { isSuspensionMessage } from '../lib/api';
import {
  hasParentalControlsEnabled,
  getParentalControlsRestrictionReason,
  isContentRestrictedByParentalControls,
} from '../lib/contentAccess';
import fallbackMovies from '../data/movies.json';
import './Home.css';

const DEMO_VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4';
const HERO_ROTATION_MS = 7000;

const continueWatchingProgress = [28, 51, 79];

export default function Home() {
  const navigate = useNavigate();
  const { ensureActiveSession, hasRestrictedAccess, isAuthenticated, user } = useAuth();
  const [pageState, setPageState] = useState({
    loading: true,
    error: '',
    featuredMovie: null,
    newReleases: [],
    trendingNow: [],
    originals: [],
    continueWatching: [],
    isDemoMode: false,
  });

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [initialImageLoaded, setInitialImageLoaded] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  const heroSlides = [
    pageState.featuredMovie,
    ...pageState.trendingNow.slice(0, 5),
  ]
    .filter(Boolean)
    .filter((item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx);

  const activeHero = heroSlides[heroIndex] || pageState.featuredMovie;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImageLoaded(false);
    setImageError(false);
  }, [activeHero?.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeroIndex(0);
  }, [pageState.featuredMovie?.id]);

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, HERO_ROTATION_MS);

    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const showPreviousHero = () => {
    if (heroSlides.length <= 1) return;
    setHeroIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const showNextHero = () => {
    if (heroSlides.length <= 1) return;
    setHeroIndex((prev) => (prev + 1) % heroSlides.length);
  };

  const getHeroImageUrl = (movie) => {
    if (!movie) return '';
    const rawPath = movie.heroImageUrl 
      || movie.hero_image 
      || movie.backdropUrl 
      || movie.backdrop_image 
      || movie.thumbnailUrl 
      || movie.posterUrl 
      || movie.imageUrl 
      || movie.image;
      
    if (!rawPath) return '';
    
    if (rawPath.startsWith('http') || rawPath.startsWith('data:')) {
      return rawPath;
    }

    if (rawPath.startsWith('/images/') || rawPath.startsWith('/fallback-')) {
      return rawPath;
    }
    
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const cleanPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    return `${baseUrl}${cleanPath}`;
  };

  const heroImageUrl = getHeroImageUrl(activeHero);

  useEffect(() => {
    if (pageState.loading || !heroImageUrl) return;

    console.log(`[Home] Preloading active hero banner in background: ${heroImageUrl}`);
    
    // Set a safety timeout to prevent getting stuck if image loads slowly
    const timer = setTimeout(() => {
      console.warn('[Home] Preload timed out. Revealing page anyway.');
      setInitialImageLoaded(true);
    }, 1500);

    const img = new Image();
    img.src = heroImageUrl;
    img.onload = () => {
      console.log('[Home] Hero banner preloaded successfully.');
      clearTimeout(timer);
      setInitialImageLoaded(true);
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.error('[Home] Failed to preload hero banner image.');
      clearTimeout(timer);
      setInitialImageLoaded(true);
      setImageError(true);
      setImageLoaded(true);
    };

    return () => clearTimeout(timer);
  }, [pageState.loading, heroImageUrl]);


  useEffect(() => {
    let isMounted = true;

    const loadPage = async () => {
      setPageState((current) => ({ ...current, loading: true, error: '' }));


      try {
        const watchlistRequest = isAuthenticated ? getWatchlist().catch(() => []) : Promise.resolve([]);
        const [featured, newReleases, trendingNow, originals, watchlist] = await Promise.all([
          getContentList({ featured: true, limit: 1 }),
          getContentList({ tag: 'new_release', limit: 6 }),
          getContentList({ tag: 'trending', limit: 6 }),
          getContentList({ genre: 'Originals', limit: 6 }),
          watchlistRequest,
        ]);

        if (!isMounted) {
          return;
        }

        const applyDemoFallback = () => {
          const fallbackWithVideo = fallbackMovies.map((movie) => ({ ...movie, videoUrl: DEMO_VIDEO_URL }));
          const demoFeatured = fallbackWithVideo.find((m) => m.id === 18) || fallbackWithVideo[0];
          const demoNewReleases = fallbackWithVideo.filter((m) => m.tags?.includes('new_release')).slice(0, 6);
          const demoTrending = fallbackWithVideo.filter((m) => m.tags?.includes('trending')).slice(0, 6);
          const demoOriginals = fallbackWithVideo.filter((m) => m.genre === 'Originals').slice(0, 6);

          setPageState({
            loading: false,
            error: '',
            featuredMovie: demoFeatured,
            newReleases: demoNewReleases.length > 0 ? demoNewReleases : fallbackWithVideo.slice(0, 6),
            trendingNow: demoTrending.length > 0 ? demoTrending : fallbackWithVideo.slice(6, 12),
            originals: demoOriginals.length > 0 ? demoOriginals : fallbackWithVideo.slice(12, 18),
            continueWatching: fallbackWithVideo.slice(0, 3).map((item, index) => ({
              ...item,
              progress: continueWatchingProgress[index] || 35,
            })),
            isDemoMode: true,
          });
        };

        const featuredMovie = featured[0] || newReleases[0] || trendingNow[0] || originals[0] || null;

        if (!featuredMovie) {
          applyDemoFallback();
          return;
        }

        const continueWatchingSource = watchlist.length > 0 ? watchlist.slice(0, 3) : trendingNow.slice(0, 3);

        setPageState({
          loading: false,
          error: '',
          featuredMovie,
          newReleases,
          trendingNow,
          originals: originals.length > 0 ? originals : trendingNow.slice(0, 6),
          continueWatching: continueWatchingSource.map((item, index) => ({
            ...item,
            progress: continueWatchingProgress[index] || 35,
          })),
          isDemoMode: false,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (isSuspensionMessage(error?.message)) {
          navigate('/account-suspended');
          return;
        }

        const applyDemoFallback = () => {
          const fallbackWithVideo = fallbackMovies.map((movie) => ({ ...movie, videoUrl: DEMO_VIDEO_URL }));
          const demoFeatured = fallbackWithVideo.find((m) => m.id === 18) || fallbackWithVideo[0];
          const demoNewReleases = fallbackWithVideo.filter((m) => m.tags?.includes('new_release')).slice(0, 6);
          const demoTrending = fallbackWithVideo.filter((m) => m.tags?.includes('trending')).slice(0, 6);
          const demoOriginals = fallbackWithVideo.filter((m) => m.genre === 'Originals').slice(0, 6);

          setPageState({
            loading: false,
            error: '',
            featuredMovie: demoFeatured,
            newReleases: demoNewReleases.length > 0 ? demoNewReleases : fallbackWithVideo.slice(0, 6),
            trendingNow: demoTrending.length > 0 ? demoTrending : fallbackWithVideo.slice(6, 12),
            originals: demoOriginals.length > 0 ? demoOriginals : fallbackWithVideo.slice(12, 18),
            continueWatching: fallbackWithVideo.slice(0, 3).map((item, index) => ({
              ...item,
              progress: continueWatchingProgress[index] || 35,
            })),
            isDemoMode: true,
          });
        };

        applyDemoFallback();
      }
    };

    loadPage();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, navigate]);

  const showLoading = pageState.loading || (heroImageUrl && !initialImageLoaded && !imageError);

  if (showLoading) {
    return <StatePanel title="Loading the latest drops" message="Pulling featured titles, trending releases, and your saved picks." />;
  }

  if (!pageState.featuredMovie) {
    return <StatePanel title="No content yet" message="Add content from the admin panel or enable demo seeding to populate the catalog." />;
  }

  const featuredContentRestricted = isContentRestrictedByParentalControls(activeHero, user);
  const parentalControlsEnabled = hasParentalControlsEnabled(user);
  const visibleTitles = [
    activeHero,
    ...pageState.newReleases,
    ...pageState.trendingNow,
    ...pageState.originals,
    ...pageState.continueWatching,
  ].filter(Boolean);
  const lockedTitlesCount = visibleTitles.reduce(
    (count, item) => count + (isContentRestrictedByParentalControls(item, user) ? 1 : 0),
    0
  );

  const handleFeaturedAction = async () => {
    if (hasRestrictedAccess) {
      navigate('/account-suspended');
      return;
    }

    if (isAuthenticated) {
      const activeUser = await ensureActiveSession();

      if (!activeUser) {
        return;
      }
    }

    if (featuredContentRestricted) {
      navigate(`/show/${activeHero.id}`);
      return;
    }

    navigate(`/show/${activeHero.id}`);
  };

  const handleContinueWatchingClick = async (contentId) => {
    if (hasRestrictedAccess) {
      navigate('/account-suspended');
      return;
    }

    if (isAuthenticated) {
      const activeUser = await ensureActiveSession();

      if (!activeUser) {
        return;
      }
    }

    navigate(`/show/${contentId}`);
  };

  return (
    <div className="home-container">
      {pageState.isDemoMode && (
        <div style={{ backgroundColor: 'var(--brand-primary)', color: '#000', textAlign: 'center', padding: '8px', zIndex: 1000, position: 'relative', fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>
          <strong>Notice:</strong> Demo content is being shown. No active backend connection.
        </div>
      )}
      {parentalControlsEnabled ? (
        <div style={{ backgroundColor: '#1a1f16', borderTop: '1px solid #2d3a2c', borderBottom: '1px solid #2d3a2c', color: '#d8e8c2', textAlign: 'center', padding: '10px 12px', zIndex: 1000, position: 'relative' }}>
          <strong>Parental Controls are ON.</strong> {lockedTitlesCount} title{lockedTitlesCount === 1 ? '' : 's'} are currently locked on this screen.
        </div>
      ) : null}
      <section className={`hero ${(!heroImageUrl || imageError) ? 'no-image' : ''} ${!imageLoaded && heroImageUrl && !imageError ? 'skeleton' : ''}`}>
        {heroSlides.length > 1 && (
          <>
            <button
              type="button"
              className="hero__nav hero__nav--prev"
              onClick={showPreviousHero}
              aria-label="Show previous hero banner"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="hero__nav hero__nav--next"
              onClick={showNextHero}
              aria-label="Show next hero banner"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
        {heroImageUrl && !imageError && (
          <img
            src={heroImageUrl}
            alt={activeHero?.title}
            className="hero__backdrop"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              display: imageLoaded ? 'block' : 'none'
            }}
          />
        )}
        {(!heroImageUrl || imageError) && (
          <div style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.03,
            backgroundImage: 'radial-gradient(circle at 30% 50%, #E8B84B 0%, transparent 60%)',
          }} />
        )}
        <div className="hero__overlay"></div>
        <div className="hero__content animate-fade-in">
          <div className="hero__badge">
            <span className="genre-dot" style={{ backgroundColor: 'var(--brand-primary)' }}></span>
            <span className="genre-text">
              {activeHero.genre.toUpperCase()} / {activeHero.type.toUpperCase()}
            </span>
          </div>
          <h1 className="hero__title">{activeHero.title}</h1>
          
          <div className="hero__meta">
            {activeHero.rating && (
              <span className="hero__rating">⭐ {activeHero.rating}</span>
            )}
            <span>•</span>
            <span className="badge badge-gold">
              {activeHero.isPremium ? 'Premium' : 'Included'}
            </span>
          </div>

          <p className="hero__description">{activeHero.desc || activeHero.description}</p>
          
          {featuredContentRestricted ? (
            <div className="hero-parental-warning" style={{ marginBottom: '20px', background: 'rgba(231,76,60,0.1)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #E74C3C' }}>
              <strong>Parental Controls active</strong>
              <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>{getParentalControlsRestrictionReason(activeHero)}</p>
            </div>
          ) : null}

          <div className="hero__actions">
            <Button
              variant="primary"
              onClick={() => {
                void handleFeaturedAction();
              }}
              className="hero__cta animate-scale-in"
              disabled={hasRestrictedAccess || featuredContentRestricted}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '0 28px',
                height: '50px',
                background: 'linear-gradient(135deg, #E8B84B, #F5D078, #C9962A)',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '700',
                color: '#0D0D0F',
                cursor: 'pointer',
                transition: 'all 250ms ease',
                width: 'fit-content',
                letterSpacing: '0.02em'
              }}
            >
              <Play size={18} fill="currentColor" />
              {featuredContentRestricted ? 'LOCKED' : 'WATCH NOW'}
            </Button>
          </div>
          {heroSlides.length > 1 && (
            <div className="hero__dots">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  className={`hero__dot ${index === heroIndex ? 'active' : ''}`}
                  onClick={() => setHeroIndex(index)}
                  aria-label={`Show hero ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="home-sections">
        <section className="carousel-section animate-fade-in-up">
          <div className="section-label">
            {isAuthenticated ? 'From Your Watchlist' : 'Trending Picks'}
          </div>
          <div className="cw-netflix-grid stagger-children">
            {pageState.continueWatching.map((item) => (
              <div
                key={item.id}
                className="cw-netflix-card"
                onClick={() => {
                  void handleContinueWatchingClick(item.id);
                }}
                style={hasRestrictedAccess ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
              >
                <img src={item.image} alt={item.title} className="cw-netflix-img" style={{ width: '100%', height: '100%' }} />
                <div className="cw-netflix-overlay">
                  <Play size={40} fill="#fff" className="cw-play-icon" />
                </div>
                <div className="cw-netflix-progress-container">
                  <div className="cw-netflix-progress-bar" style={{ width: `${item.progress}%` }}></div>
                </div>
                <div className="cw-netflix-info">
                  <h4 className="cw-netflix-title">{item.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="carousel-section animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="section-label">New Releases</div>
          <div className="carousel-grid stagger-children">
            {pageState.newReleases.map((movie) => (
              <MovieCard key={movie.id} {...movie} />
            ))}
          </div>
        </section>

        <section className="carousel-section animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="section-label">Trending Now</div>
          <div className="carousel-grid stagger-children">
            {pageState.trendingNow.map((movie) => (
              <MovieCard key={movie.id} {...movie} />
            ))}
          </div>
        </section>

        <section className="carousel-section animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="section-label">Originals</div>
          <div className="carousel-grid stagger-children">
            {pageState.originals.map((movie) => (
              <MovieCard key={movie.id} {...movie} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
