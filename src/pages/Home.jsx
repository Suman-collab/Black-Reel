import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import MovieCard from '../components/MovieCard';
import { Play } from 'lucide-react';
import movies from '../data/movies.json';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const newReleases = movies.filter(movie => movie.tags && movie.tags.includes('new_release')).slice(0, 6);
  const trendingNow = movies.filter(movie => movie.tags && movie.tags.includes('trending')).slice(0, 6);
  const originals = movies.filter(movie => movie.genre === 'Originals' || (movie.tags && movie.tags.includes('popular'))).slice(0, 6);

  // Update hero banner to feature a different movie
  const featuredMovie = movies.find(m => m.title === 'My Secret Affair with the Pool Boy') || movies[0];

  const continueWatching = [
    { id: 10, title: 'Velvet Room', desc: 'Resume episode', image: '/images/fandom/Poster 1 - 150x200.jpg.jpeg', progress: 50 },
    { id: 1, title: 'Brothas in Arms', desc: 'Resume movie', image: '/images/fandom/Poster 2 - 150x200.jpg.jpeg', progress: 25 },
    { id: 3, title: 'Burden', desc: 'Resume movie', image: '/images/fandom/Poster 3 - 150x200.jpg.jpeg', progress: 80 },
  ];

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero">
        <img src={featuredMovie.hero_image || featuredMovie.image} alt={featuredMovie.title} className="hero-bg" />
        <div className="hero-overlay"></div>
        <div className="hero-content container">
          <div className="hero-text-wrapper banner-styled">
            <div className="fandom-genre-tag" style={{ marginBottom: '16px' }}>
              <span className="genre-dot" style={{ backgroundColor: '#FACC15' }}></span>
              <span className="genre-text">{featuredMovie.genre.toUpperCase()} / {featuredMovie.type.toUpperCase()}</span>
            </div>
            <h1 className="hero-title cinematic-title">{featuredMovie.title}</h1>
            <p className="hero-desc cinematic-desc">
              {featuredMovie.desc}
            </p>
            <div className="fandom-pill" style={{ marginBottom: '32px' }}>{featuredMovie.genre}</div>
            <div className="hero-actions">
              <Button variant="primary" onClick={() => navigate(`/show/${featuredMovie.id}`)} className="fandom-read-more" style={{ display: 'flex', alignItems: 'center' }}>
                <Play size={18} fill="currentColor" style={{ marginRight: '8px' }} /> WATCH NOW
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* Continue Watching */}
      <div className="container" style={{ marginTop: '5px' }}>
        <section className="carousel-section">
          <div className="section-header">
            <h2 className="section-title text-gold" style={{ fontSize: '1.5rem' }}>Continue Watching for Nicole</h2>
          </div>
          <div className="cw-netflix-grid">
            {continueWatching.map(item => (
              <div key={item.id} className="cw-netflix-card" onClick={() => navigate(`/show/${item.id}`)}>
                <img src={item.image} alt={item.title} className="cw-netflix-img" style={{ width: '100%', height: '100%' }} />
                <div className="cw-netflix-overlay">
                  <Play size={40} fill="#fff" className="cw-play-icon" />
                </div>
                <div className="cw-netflix-progress-container">
                  <div className="cw-netflix-progress-bar" style={{ width: `${item.progress}%` }}></div>
                </div>
                <div className="cw-netflix-info">
                  <h4 className="cw-netflix-title">{item.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      {/* Carousels */}
      <div className="container">
        <section className="carousel-section">
          <div className="section-header">
            <h2 className="section-title">New Releases</h2>
            <a href="#" className="view-all">View All &gt;</a>
          </div>
          <div className="carousel-grid">
            {newReleases.map(movie => (
              <MovieCard key={movie.id} {...movie} />
            ))}
          </div>
        </section>

        <section className="carousel-section">
          <div className="section-header">
            <h2 className="section-title">Trending Now</h2>
            <a href="#" className="view-all">View All &gt;</a>
          </div>
          <div className="carousel-grid">
            {trendingNow.map(movie => (
              <MovieCard key={movie.id} {...movie} />
            ))}
          </div>
        </section>

        <section className="carousel-section">
          <div className="section-header">
            <h2 className="section-title">Originals</h2>
            <a href="#" className="view-all">View All &gt;</a>
          </div>
          <div className="carousel-grid">
            {originals.map(movie => (
              <MovieCard key={movie.id} {...movie} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
