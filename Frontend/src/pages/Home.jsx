import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import Button from '../components/Button';
import MovieCard from '../components/MovieCard';
import StatePanel from '../components/StatePanel';
import { getContentList } from '../features/content/content.service';
import { getWatchlist } from '../features/user/user.service';
import { useAuth } from '../features/auth/AuthContext';
import './Home.css';

const continueWatchingProgress = [28, 51, 79];

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [pageState, setPageState] = useState({
    loading: true,
    error: '',
    featuredMovie: null,
    newReleases: [],
    trendingNow: [],
    originals: [],
    continueWatching: [],
  });

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

        const featuredMovie = featured[0] || newReleases[0] || trendingNow[0] || originals[0] || null;
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
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setPageState((current) => ({
          ...current,
          loading: false,
          error: error.message,
        }));
      }
    };

    loadPage();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  if (pageState.loading) {
    return <StatePanel title="Loading the latest drops" message="Pulling featured titles, trending releases, and your saved picks." />;
  }

  if (pageState.error) {
    return <StatePanel title="We couldn't load the homepage" message={pageState.error} actionLabel="Try Again" onAction={() => window.location.reload()} />;
  }

  if (!pageState.featuredMovie) {
    return <StatePanel title="No content yet" message="Add content from the admin panel or enable demo seeding to populate the catalog." />;
  }

  return (
    <div className="home-container">
      <section className="hero">
        <img
          src={pageState.featuredMovie.hero_image || pageState.featuredMovie.image}
          alt={pageState.featuredMovie.title}
          className="hero-bg"
        />
        <div className="hero-overlay"></div>
        <div className="hero-content container">
          <div className="hero-text-wrapper banner-styled">
            <div className="fandom-genre-tag" style={{ marginBottom: '16px' }}>
              <span className="genre-dot" style={{ backgroundColor: '#FACC15' }}></span>
              <span className="genre-text">
                {pageState.featuredMovie.genre.toUpperCase()} / {pageState.featuredMovie.type.toUpperCase()}
              </span>
            </div>
            <h1 className="hero-title cinematic-title">{pageState.featuredMovie.title}</h1>
            <p className="hero-desc cinematic-desc">{pageState.featuredMovie.desc}</p>
            <div className="fandom-pill" style={{ marginBottom: '32px' }}>
              {pageState.featuredMovie.isPremium ? 'Premium' : 'Included'}
            </div>
            <div className="hero-actions">
              <Button
                variant="primary"
                onClick={() => navigate(`/show/${pageState.featuredMovie.id}`)}
                className="fandom-read-more"
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <Play size={18} fill="currentColor" style={{ marginRight: '8px' }} /> WATCH NOW
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ marginTop: '5px' }}>
        <section className="carousel-section">
          <div className="section-header">
            <h2 className="section-title text-gold" style={{ fontSize: '1.5rem' }}>
              {isAuthenticated ? 'From Your Watchlist' : 'Trending Picks'}
            </h2>
          </div>
          <div className="cw-netflix-grid">
            {pageState.continueWatching.map((item) => (
              <div key={item.id} className="cw-netflix-card" onClick={() => navigate(`/show/${item.id}`)}>
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
      </div>

      <div className="container">
        <section className="carousel-section">
          <div className="section-header">
            <h2 className="section-title">New Releases</h2>
          </div>
          <div className="carousel-grid">
            {pageState.newReleases.map((movie) => (
              <MovieCard key={movie.id} {...movie} />
            ))}
          </div>
        </section>

        <section className="carousel-section">
          <div className="section-header">
            <h2 className="section-title">Trending Now</h2>
          </div>
          <div className="carousel-grid">
            {pageState.trendingNow.map((movie) => (
              <MovieCard key={movie.id} {...movie} />
            ))}
          </div>
        </section>

        <section className="carousel-section">
          <div className="section-header">
            <h2 className="section-title">Originals</h2>
          </div>
          <div className="carousel-grid">
            {pageState.originals.map((movie) => (
              <MovieCard key={movie.id} {...movie} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
