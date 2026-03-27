import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import StatePanel from '../components/StatePanel';
import { getContentList } from '../features/content/content.service';
import './Search.css';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const search = async () => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        setError('');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const items = await getContentList({ search: query, limit: 24 });

        if (isMounted) {
          setResults(items);
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    search();

    return () => {
      isMounted = false;
    };
  }, [query]);

  if (loading) {
    return <StatePanel title="Searching the catalog" message={`Looking for titles that match "${query}".`} />;
  }

  if (error) {
    return <StatePanel title="Search unavailable" message={error} />;
  }

  return (
    <div className="search-page container">
      <h1 className="search-title">Search Results for "{query}"</h1>

      {query.trim() === '' ? (
        <div className="no-movies-message">
          <p>Please enter a search term in the navbar above.</p>
        </div>
      ) : results.length > 0 ? (
        <div className="search-grid">
          {results.map((movie) => (
            <MovieCard key={movie.id} {...movie} />
          ))}
        </div>
      ) : (
        <div className="no-movies-message">
          <p>We couldn&apos;t find any matches for "{query}". Try checking your spelling or use more general terms.</p>
        </div>
      )}
    </div>
  );
}
