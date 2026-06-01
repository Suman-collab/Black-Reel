import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { isContentRestrictedByParentalControls } from '../lib/contentAccess';
import './MovieCard.css';

export default function MovieCard({ id = 1, title, desc, description, image, thumbnailUrl, className = '', ...content }) {
  const { user } = useAuth();
  const contentWithDisplayFields = {
    ...content,
    id,
    title,
    desc,
    description,
    image,
    thumbnailUrl,
  };
  const isRestricted = isContentRestrictedByParentalControls(contentWithDisplayFields, user);

  return (
    <Link to={`/show/${id}`} className={`movie-card-link ${className}`} style={{ textDecoration: 'none' }}>
      <div className={`content-card ${isRestricted ? 'restricted' : ''}`}>
        <div className="content-card__image-wrapper">
          <img src={image || thumbnailUrl} alt={title} className="content-card__poster" />
        </div>
        
        {isRestricted ? (
          <span className="content-card__badge content-card__badge--premium">Parental Control</span>
        ) : content.isPremium ? (
          <span className="content-card__badge content-card__badge--premium">Premium</span>
        ) : null}

        {content.rating && (
          <span className="content-card__rating">
            <svg className="star-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span>{content.rating}</span>
          </span>
        )}

        <div className="content-card__overlay">
          <div className="content-card__play">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
        </div>

        <div className="content-card__info">
          <div className="content-card__title">{title}</div>
          <div className="content-card__genre">{content.genre || content.type || 'Movie'}</div>
        </div>
      </div>
    </Link>
  );

}
