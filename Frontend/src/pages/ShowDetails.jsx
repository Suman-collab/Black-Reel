import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, Play } from 'lucide-react';
import Button from '../components/Button';
import StatePanel from '../components/StatePanel';
import { getContentById } from '../features/content/content.service';
import { addToWatchlist, getWatchlist, removeFromWatchlist } from '../features/user/user.service';
import { useAuth } from '../features/auth/AuthContext';
import './ShowDetails.css';

export default function ShowDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState(null);
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    window.scrollTo(0, 0);

    const loadShow = async () => {
      setLoading(true);
      setError('');

      try {
        const watchlistRequest = isAuthenticated ? getWatchlist().catch(() => []) : Promise.resolve([]);
        const [contentItem, watchlist] = await Promise.all([getContentById(id), watchlistRequest]);

        if (!isMounted) {
          return;
        }

        setContent(contentItem);
        setWatchlistIds(new Set(watchlist.map((item) => String(item.id))));
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

    loadShow();

    return () => {
      isMounted = false;
    };
  }, [id, isAuthenticated]);

  const inWatchlist = content ? watchlistIds.has(String(content.id)) : false;
  const episodes = useMemo(() => {
    if (!content) {
      return [];
    }

    if (content.type === 'Series') {
      return Array.from({ length: 6 }, (_, index) => ({
        epNum: `Episode ${index + 1}`,
        title: `${content.title} - Chapter ${index + 1}`,
      }));
    }

    return [
      {
        epNum: 'Feature',
        title: content.title,
      },
    ];
  }, [content]);

  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/show/${id}` } });
      return;
    }

    setSaving(true);

    try {
      const updatedWatchlist = inWatchlist ? await removeFromWatchlist(content.id) : await addToWatchlist(content.id);
      setWatchlistIds(new Set(updatedWatchlist.map((item) => String(item.id))));
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <StatePanel title="Loading show details" message="Fetching metadata, artwork, and watchlist state." />;
  }

  if (error || !content) {
    return <StatePanel title="This title is unavailable" message={error || 'The selected title could not be loaded.'} />;
  }

  return (
    <div className="show-details-page container">
      <div className="show-hero">
        <div className="show-hero-poster-container">
          <img src={content.image} alt={content.title} className="show-poster-img" />
        </div>

        <div className="show-hero-info">
          <h1 className="show-title">{content.title}</h1>
          <h3 className="show-subtitle">{content.type} / {content.genre}</h3>

          <p className="show-desc">{content.desc}</p>

          <div className="show-tags">
            {(content.tags?.length ? content.tags : [content.genre]).map((tag) => (
              <span key={tag} className="show-tag">{tag.replace('_', ' ')}</span>
            ))}
          </div>

          <div className="show-stats">
            <span className="stat-item"><Heart fill="#333" color="#333" size={18} /> {content.views.toLocaleString()} views</span>
            <span className="stat-item"><Heart fill="#333" color="#333" size={18} /> {content.rating.toFixed(1)} / 5</span>
          </div>

          <div className="show-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button variant="primary" className="episode-btn" onClick={() => window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' })}>
              <Play size={14} fill="currentColor" style={{ marginRight: '6px' }} /> Play
            </Button>
            <Button variant="outline" className="episode-btn" onClick={handleWatchlistToggle} disabled={saving}>
              {saving ? 'Saving...' : inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            </Button>
          </div>
        </div>
      </div>

      <section className="episodes-list-section">
        <h2 className="episodes-list-title">
          {content.type === 'Series' ? 'Episodes' : 'Now Playing'} <span className="season-text">({content.type})</span>
        </h2>

        <div className="episodes-list">
          {episodes.map((episode) => (
            <div key={episode.epNum} className="episode-list-item">
              <span className="ep-item-title">{episode.epNum} - {episode.title}</span>
              <Button variant="outline" className="ep-play-btn">
                <Play size={14} fill="currentColor" style={{ marginRight: '6px' }} /> PLAY
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
