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
      <div className={`movie-card ${isRestricted ? 'restricted' : ''}`}>
        <div className="movie-poster-frame">
          <img src={image || thumbnailUrl} alt={title} className="movie-poster" />
        </div>
        {isRestricted ? <span className="movie-card-badge">Parental Control</span> : null}
        <div className="movie-info">
          <h3 className="movie-title">{title}</h3>
          {(desc || description) && (
            <div className="movie-desc-wrapper">
              <p className="movie-desc">{desc || description}</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
