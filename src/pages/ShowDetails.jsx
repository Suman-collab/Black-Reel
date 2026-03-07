import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Heart } from 'lucide-react';
import Button from '../components/Button';
import movies from '../data/movies.json';
import './ShowDetails.css';

export default function ShowDetails() {
  const { id } = useParams();
  const showData = movies.find(s => s.id === parseInt(id)) || movies[0];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Mock episodes list from the image
  const episodes = [
    { title: "The Door Opens", epNum: "Episode 1" },
    { title: "The Stranger", epNum: "Episode 2" },
    { title: "Secrets in the Dark", epNum: "Episode 3" },
    { title: "Velvet Rules", epNum: "Episode 4" },
    { title: "The Confession", epNum: "Episode 5" },
    { title: "Red Room", epNum: "Episode 6" },
    { title: "The Betrayal", epNum: "Episode 7" },
  ];

  return (
    <div className="show-details-page container">
      <div className="show-hero">
        <div className="show-hero-poster-container">
          <img src={showData.image} alt={showData.title} className="show-poster-img" />
        </div>

        <div className="show-hero-info">
          <h1 className="show-title">Episode 1 – {showData.title}</h1>
          <h3 className="show-subtitle">Plot of Episode 1</h3>

          <p className="show-desc">
            {showData.title === 'Velvet Room'
              ? "Velvet Room follows the story of a mysterious underground lounge where secrets, power, and, desire collide. Every night, new guests enter the room—each hiding something, each wanting something, pach risk-ing everything."
              : showData.desc}
          </p>

          <div className="show-tags">
            {showData.title === 'Velvet Room' ? (
              <>
                <span className="show-tag">Thriller</span>
                <span className="show-tag">Noir</span>
                <span className="show-tag">Black Cinema</span>
                <span className="show-tag">Mystery</span>
              </>
            ) : (
              (showData.tags || [showData.genre]).map((t, i) => (
                <span key={i} className="show-tag">{t.replace('_', ' ')}</span>
              ))
            )}
          </div>

          <div className="show-stats">
            <span className="stat-item"><Heart fill="#333" color="#333" size={18} /> 145.5k</span>
            <span className="stat-item"><Heart fill="#333" color="#333" size={18} /> 19,4 k</span>
          </div>

          <div className="show-actions">
            <Button variant="outline" className="episode-btn">Episode 2</Button>
          </div>
        </div>
      </div>

      <section className="episodes-list-section">
        <h2 className="episodes-list-title">All Eposdes <span className="season-text">(Season 1)</span></h2>

        <div className="episodes-list">
          {episodes.map((ep, idx) => (
            <div key={idx} className="episode-list-item">
              <span className="ep-item-title">{ep.epNum} – {ep.title}</span>
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
