import React, { useState } from 'react';
import Button from '../components/Button';
import { Bookmark } from 'lucide-react';
import './Watchlist.css';

export default function Watchlist() {
  const [watchlistItems, setWatchlistItems] = useState([]);

  React.useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('blackReelWatchlist') || '[]');
    setWatchlistItems(saved);
  }, []);

  const removeShow = (id) => {
    const updated = watchlistItems.filter(item => item.id !== id);
    setWatchlistItems(updated);
    localStorage.setItem('blackReelWatchlist', JSON.stringify(updated));
  };

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
                <p className="watchlist-meta">Season {item.seasons} • {item.episodes} Episodes</p>
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
          <Button variant="primary" onClick={() => window.location.href = '/'}>EXPLORE NOW</Button>
        </div>
      )}
    </div>
  );
}
