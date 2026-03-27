import React, { useEffect, useState } from 'react';
import MovieCard from '../components/MovieCard';
import StatePanel from '../components/StatePanel';
import { getContentList } from '../features/content/content.service';
import './Fandom.css';

export default function Fandom() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadFandom = async () => {
      setLoading(true);
      setError('');

      try {
        const items = await getContentList({ tag: 'fandom', limit: 20 });

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

    loadFandom();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <StatePanel title="Loading fandom favorites" message="Pulling the titles fans keep coming back to." />;
  }

  if (error) {
    return <StatePanel title="Fandom is unavailable" message={error} />;
  }

  return (
    <div className="fandom-container container">
      <div className="fandom-grid">
        {content.map((movie) => (
          <MovieCard key={movie.id} {...movie} />
        ))}
      </div>
    </div>
  );
}
