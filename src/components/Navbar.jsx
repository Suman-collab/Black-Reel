import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Search as SearchIcon, User, X, Bell, Menu } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Mock authentication state. Change to false to see "Sign In", true to see Avatar.
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setSearchOpen(false); // optional: close search on submit or keep open
    }
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <img src="/images/Horizontal%20logo/Black-Shortz.png" alt="Black Shortz Logo" style={{ height: '120px', width: '150px', objectFit: 'contain' }} />
      </Link>

      {!isAuthPage && (
        <>
          <div className="nav-links">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
            <NavLink to="/categories" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Categories</NavLink>
            <NavLink to="/fandom" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Fandom</NavLink>
            <NavLink to="/watchlist" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Watchlist</NavLink>
          </div>

          <div className="nav-actions">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="search-form active">
                <input
                  type="text"
                  placeholder="Titles, people, genres"
                  className="search-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
                <button type="button" className="btn-icon close-search" onClick={() => setSearchOpen(false)}>
                  <X size={20} />
                </button>
              </form>
            ) : (
              <button className="btn-icon open-search" onClick={() => setSearchOpen(true)}>
                <SearchIcon size={20} />
              </button>
            )}

            <Link to="/subscribe" className="btn-icon text-gold" style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>
              Subscribe
            </Link>

            {/* Mock auth toggle: in a real app this comes from context/redux */}
            {isAuthenticated ? (
              <>
                <Link to="/notifications" className="btn-icon" style={{ display: 'flex', alignItems: 'center' }}>
                  <Bell size={20} />
                </Link>
                <Link to="/profile" className="btn-icon" style={{ display: 'flex', alignItems: 'center' }}>
                  <User size={20} />
                </Link>
              </>
            ) : (
              <Link to="/login" className="btn-icon" style={{ fontSize: '0.95rem' }}>
                Sign In
              </Link>
            )}

            <button className="mobile-menu-btn btn-icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </>
      )}

      {/* Mobile Menu Overlay */}
      {!isAuthPage && (
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-nav-links">
            <NavLink to="/" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
            <NavLink to="/categories" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>Categories</NavLink>
            <NavLink to="/fandom" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>Fandom</NavLink>
            <NavLink to="/watchlist" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>Watchlist</NavLink>
          </div>
        </div>
      )}
    </nav>
  );
}
