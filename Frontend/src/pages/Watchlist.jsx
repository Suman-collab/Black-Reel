import React, { useEffect, useState } from 'react';
import Button from '../components/Button';
import StatePanel from '../components/StatePanel';
import { Bookmark } from 'lucide-react';
import { getWatchlist, removeFromWatchlist } from '../features/user/user.service';
import './Watchlist.css';

export default function Watchlist() {
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadWatchlist = async () => {
      setLoading(true);
      setError('');

      try {
        const items = await getWatchlist();

        if (isMounted) {
          setWatchlistItems(items);
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

    loadWatchlist();

    return () => {
      isMounted = false;
    };
  }, []);

  const removeShow = async (id) => {
    try {
      const updated = await removeFromWatchlist(id);
      setWatchlistItems(updated);
    } catch (apiError) {
      setError(apiError.message);
    }
  };

  if (loading) {
    return <StatePanel title="Loading your watchlist" message="Pulling the titles you've saved for later." />;
  }

  if (error) {
    return <StatePanel title="Watchlist unavailable" message={error} />;
  }

  return (
    <div className="watchlist-page container">
      <h1 className="watchlist-title">My Watchlist</h1>

      {watchlistItems.length > 0 ? (
        <div className="watchlist-list">
          {watchlistItems.map((item) => (
            <div key={item.id} className="watchlist-item">
              <img src={item.image} alt={item.title} className="watchlist-poster" />

              <div className="watchlist-info">
                <h3 className="watchlist-item-title">{item.title}</h3>
                <p className="watchlist-genre">{item.genre}</p>
                <p className="watchlist-meta">{item.type} • {item.isPremium ? 'Premium' : 'Included'}</p>
              </div>

              <div className="watchlist-actions">
                <Button
                  variant="outline"
                  style={{ padding: '8px 24px', fontSize: '0.9rem' }}
                  onClick={() => removeShow(item.id)}
                >
                  REMOVE
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-watchlist-modern">
          <div className="empty-watchlist-icon">
            <Bookmark size={48} color="var(--gold-primary)" />
          </div>
          <h2>Your Watchlist is Empty</h2>
          <p>Shows and movies you add to your watchlist will appear here.</p>
          <Button variant="primary" onClick={() => window.location.assign('/')}>EXPLORE NOW</Button>
        </div>
      )}
    </div>
  );
}
