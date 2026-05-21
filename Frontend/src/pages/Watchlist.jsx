import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import StatePanel from '../components/StatePanel';
import { Bookmark } from 'lucide-react';
import { useWatchlist } from '../features/watchlist/WatchlistContext';
import { normalizeContentId } from '../lib/ids';
import './Watchlist.css';

export default function Watchlist() {
  const navigate = useNavigate();
  const { error, hasLoaded, isPending, refreshWatchlist, removeItem, watchlistItems } = useWatchlist();

  if (!hasLoaded) {
    return <StatePanel title="Loading your watchlist" message="Pulling the titles you've saved for later." />;
  }

  if (error && watchlistItems.length === 0) {
    return (
      <StatePanel
        title="Watchlist unavailable"
        message={error}
        actionLabel="Try Again"
        onAction={() => {
          void refreshWatchlist();
        }}
      />
    );
  }

  return (
    <div className="watchlist-page container">
      <h1 className="watchlist-title">My Watchlist</h1>
      {error ? <p className="watchlist-feedback">{error}</p> : null}

      {watchlistItems.length > 0 ? (
        <div className="watchlist-list">
          {watchlistItems.map((item) => (
            <div key={normalizeContentId(item.id ?? item._id)} className="watchlist-item">
              <img src={item.image} alt={item.title} className="watchlist-poster" />

              <div className="watchlist-info">
                <h3 className="watchlist-item-title">{item.title}</h3>
                <p className="watchlist-genre">{item.genre}</p>
                <p className="watchlist-meta">{item.type} | {item.isPremium ? 'Premium' : 'Included'}</p>
              </div>

              <div className="watchlist-actions">
                <Button
                  variant="outline"
                  style={{ padding: '8px 24px', fontSize: '0.9rem' }}
                  onClick={() => {
                    void removeItem(normalizeContentId(item.id ?? item._id ?? item.contentId));
                  }}
                  disabled={isPending(normalizeContentId(item.id ?? item._id ?? item.contentId))}
                >
                  {isPending(normalizeContentId(item.id ?? item._id ?? item.contentId)) ? 'REMOVING...' : 'REMOVE'}
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
          <Button variant="primary" onClick={() => navigate('/')}>EXPLORE NOW</Button>
        </div>
      )}
    </div>
  );
}
