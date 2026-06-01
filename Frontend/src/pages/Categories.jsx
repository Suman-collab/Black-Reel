import React, { useEffect, useMemo, useState } from 'react';
import './Categories.css';
import MovieCard from '../components/MovieCard';
import StatePanel from '../components/StatePanel';
import { getContentList } from '../features/content/content.service';

export default function Categories() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      setLoading(true);
      setError('');

      try {
        const items = await getContentList({ limit: 48 });

        if (isMounted) {
          setContent(items);
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

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const categoriesList = useMemo(() => ['All', ...new Set(content.map((item) => item.genre))], [content]);
  const filteredMovies = activeCategory === 'All' ? content : content.filter((movie) => movie.genre === activeCategory);

  if (loading) {
    return <StatePanel title="Loading categories" message="Sorting the catalog into genres and collections." />;
  }

  if (error) {
    return <StatePanel title="Categories unavailable" message={error} actionLabel="Try Again" onAction={() => window.location.reload()} />;
  }

  return (
    <div className="categories-page">
      {/* <div className="page-header">
        <h1 className="page-title">Categories</h1>
      </div> */}

      <div className="category-filters">
        {categoriesList.map((category) => (
          <button
            key={category}
            className={`filter-pill ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="content-grid">
        {filteredMovies.length > 0 ? (
          filteredMovies.map((movie) => <MovieCard key={movie.id} {...movie} />)
        ) : (
          <div className="no-movies-message">
            <p>No titles found for {activeCategory}.</p>
          </div>
        )}
      </div>
    </div>
  );
}

