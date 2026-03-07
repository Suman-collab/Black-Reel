import React, { useState } from 'react';
import './Categories.css';
import MovieCard from '../components/MovieCard';
import movies from '../data/movies.json';

export default function Categories() {
  const [activeCategory, setActiveCategory] = useState('All');

  const categoriesList = [
    'All', 'Originals', 'Drama', 'Comedy', 'Romance', 'Thriller',
    'Action', 'Mystery', 'Fantasy', 'Horror', 'History'
  ];

  const filteredMovies = activeCategory === 'All'
    ? movies
    : movies.filter(movie => movie.genre === activeCategory);

  return (
    <div className="categories-page container">

      <div className="category-pills">
        {categoriesList.map((category, index) => (
          <button
            key={index}
            className={`category-pill ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="categories-grid">
        {filteredMovies.length > 0 ? (
          filteredMovies.map(movie => (
            <MovieCard key={movie.id} {...movie} />
          ))
        ) : (
          <div className="no-movies-message">
            <p>No titles found for {activeCategory}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
