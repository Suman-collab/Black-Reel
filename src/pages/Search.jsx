import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import movies from '../data/movies.json';
import './Search.css';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = movies.filter(movie =>
      movie.title.toLowerCase().includes(lowerQuery) ||
      movie.genre.toLowerCase().includes(lowerQuery) ||
      (movie.tags && movie.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) ||
      movie.desc.toLowerCase().includes(lowerQuery)
    );

    setResults(filtered);
  }, [query]);

  return (
    <div className="search-page container">
      <h1 className="search-title">
        Search Results for "{query}"
      </h1>

      {query.trim() === '' ? (
        <div className="no-movies-message">
          <p>Please enter a search term in the navbar above.</p>
        </div>
      ) : results.length > 0 ? (
        <div className="search-grid">
          {results.map(movie => (
            <MovieCard key={movie.id} {...movie} />
          ))}
        </div>
      ) : (
        <div className="no-movies-message">
          <p>We couldn't find any matches for "{query}". Try checking your spelling or use more general terms.</p>
        </div>
      )}
    </div>
  );
}
