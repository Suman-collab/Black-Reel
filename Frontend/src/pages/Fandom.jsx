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
    <div className="fandom-page">
      {/* <div className="page-header">
        <h1 className="page-title">Fandom</h1>
      </div> */}

      {(!content || content.length === 0) ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6rem 2rem',
          gap: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', opacity: 0.3 }}>🎬</div>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#F5F5F0' 
          }}>
            Nothing here yet
          </h3>
          <p style={{ fontSize: '14px', color: '#A0A0A8', maxWidth: '320px' }}>
            Fan favorites will appear here once content is rated 
            and reviewed by the community.
          </p>
        </div>
      ) : (
        <div className="fandom-grid">
          {content.map((movie) => (
            <MovieCard key={movie.id} {...movie} />
          ))}
        </div>
      )}
    </div>
  );
}

