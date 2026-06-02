import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Heart, Check } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useWatchlist } from '../features/watchlist/WatchlistContext';
import { isContentRestrictedByParentalControls } from '../lib/contentAccess';
import './MovieCard.css';

export default function MovieCard({ 
  id = 1, 
  title, 
  desc, 
  description, 
  image, 
  thumbnailUrl, 
  rating, 
  releaseYear, 
  release_year, 
  type, 
  genre, 
  isPremium, 
  progress, 
  quality = 'HD', 
  isNew = false, 
  className = '', 
  ...content 
}) {
  const { user } = useAuth();
  const { isInWatchlist, toggleItem, isPending } = useWatchlist();

  const contentWithDisplayFields = {
    ...content,
    id,
    title,
    desc,
    description,
    image: image || thumbnailUrl,
    thumbnailUrl: image || thumbnailUrl,
    rating,
    releaseYear: releaseYear || release_year || '2026',
    release_year: releaseYear || release_year || '2026',
    type: type || genre || 'Movie',
    genre: type || genre || 'Movie',
    isPremium,
  };

  const isRestricted = isContentRestrictedByParentalControls(contentWithDisplayFields, user);
  const inWatchlist = isInWatchlist(id);
  const pending = isPending(id);

  const handleWatchlistClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (pending) {
      return;
    }

    try {
      await toggleItem(contentWithDisplayFields);
    } catch (err) {
      console.warn('[MovieCard] Failed to toggle watchlist:', err.message);
    }
  };

  const finalImage = image || thumbnailUrl || '/images/card-placeholder.png';
  const displayRating = rating ? Number(rating).toFixed(1) : null;
  const displayYear = releaseYear || release_year || '2026';
  const displayType = String(type || genre || 'Movie').toUpperCase();

  return (
    <Link to={`/show/${id}`} className={`movie-card-link ${className}`}>
      <div className={`movie-card ${isRestricted ? 'restricted' : ''}`}>
        {/* Poster Container */}
        <div className="movie-poster-frame">
          <img src={finalImage} alt={title} className="movie-poster" loading="lazy" />
          
          {/* Bottom vignette gradient overlay */}
          <div className="movie-poster-overlay"></div>

          {/* Top Left Badges */}
          {isRestricted ? (
            <span className="movie-card-badge restricted-badge">Parental Control</span>
          ) : isPremium ? (
            <span className="movie-card-badge premium-badge">Premium</span>
          ) : isNew ? (
            <span className="movie-card-badge premium-badge" style={{ background: 'var(--brand-secondary, #2ECC71)' }}>New</span>
          ) : null}

          {/* Top Right Floating Heart Action */}
          <button 
            type="button"
            className={`movie-watchlist-toggle-btn ${inWatchlist ? 'in-watchlist' : ''}`}
            onClick={handleWatchlistClick}
            disabled={pending}
            title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            <Heart size={14} fill={inWatchlist ? 'currentColor' : 'none'} />
          </button>

          {/* Central Play Indicator */}
          {!isRestricted && (
            <div className="movie-play-overlay">
              <div className="movie-play-btn">
                <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />
              </div>
            </div>
          )}

          {/* Bottom Left Quality Indicator */}
          {quality && <span className="movie-quality-badge">{quality}</span>}

          {/* Bottom Right Rating badge */}
          {displayRating && (
            <span className="movie-rating-badge">{displayRating}</span>
          )}

          {/* Continue Watching Progress bar */}
          {progress !== undefined && progress > 0 && (
            <div className="movie-progress-container">
              <div className="movie-progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
          )}
        </div>

        {/* Title Details below image cover */}
        <div className="movie-meta-row">
          <h4 className="movie-title" title={title}>{title}</h4>
        </div>

        {/* Metadata sub-details row */}
        <div className="movie-subtitle-row">
          {displayYear} • {displayType}
        </div>
      </div>
    </Link>
  );
}

/* Premium Shimmer Loading Skeleton Sub-component */
MovieCard.Skeleton = function MovieCardSkeleton() {
  return (
    <div className="movie-card skeleton">
      <div className="movie-poster-frame skeleton-shimmer"></div>
      <div className="movie-meta-row">
        <div className="movie-title skeleton-line short"></div>
        <div className="movie-rating-badge skeleton-line mini" style={{ height: '14px', borderRadius: '999px' }}></div>
      </div>
      <div className="movie-subtitle-row skeleton-line text"></div>
    </div>
  );
};
