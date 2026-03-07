import React from 'react';
import MovieCard from '../components/MovieCard';
import './Fandom.css';

export default function Fandom() {
  const fandomMovies = [
    { title: "My Secret Affair with the Pool Boy", image: "Poster 1 - 150x200.jpg.jpeg" },
    { title: "My Millionaire Baby Daddy", image: "Poster 2 - 150x200.jpg.jpeg" },
    { title: "My Girlfriend Is a Secret Escort", image: "Poster 3 - 150x200.jpg.jpeg" },
    { title: "The Velvet Room: Burlesque Show Las Vegas", image: "Poster 4 - 150x200.jpg.jpeg" },
    { title: "The Heiress Waitress", image: "Poster 5 - 150x200.jpg.jpeg" },
    { title: "I Got Pregnant by Personal Trainer", image: "Poster 6 - 150x200.jpg.jpeg" },
    { title: "Love Match", image: "Poster 7 - 150x200.jpg.jpeg" }
  ];

  return (
    <div className="fandom-container container">
      <div className="fandom-grid">
        {fandomMovies.map((movie, index) => (
          <MovieCard
            key={index}
            id={`fandom-${index}`}
            title={movie.title}
            image={`/images/fandom/${movie.image}`}
          />
        ))}
      </div>
    </div>
  );
}
