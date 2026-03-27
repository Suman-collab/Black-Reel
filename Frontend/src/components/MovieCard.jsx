import React from 'react';
import { Link } from 'react-router-dom';
import './MovieCard.css';

export default function MovieCard({ id = 1, title, desc, description, image, thumbnailUrl, className = '' }) {
  return (
    <Link to={`/show/${id}`} className={`movie-card-link ${className}`} style={{ textDecoration: 'none' }}>
      <div className="movie-card">
        <img src={image || thumbnailUrl} alt={title} className="movie-poster" />
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
