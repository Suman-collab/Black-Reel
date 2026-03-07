import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      navigate('/');
    }
  };

  return (
    <div className="auth-split-container">
      <div className="auth-left">
        <div className="auth-form-wrapper">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to continue watching.</p>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input type="email" id="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            <div className="auth-terms">
              <input type="checkbox" id="remember" checked={remember} onChange={e => setRemember(e.target.checked)} />
              <label htmlFor="remember">Remember me</label>
            </div>

            <button type="submit" className="btn-auth">Sign In</button>

            <div className="auth-divider">
              <span>Or</span>
            </div>

            <div className="auth-socials">
              <button type="button" className="btn-social google">
                <img src="https://img.icons8.com/color/24/000000/google-logo.png" alt="Google" />
                Sign in with Google
              </button>
              <button type="button" className="btn-social apple">
                <img src="https://img.icons8.com/ios-filled/24/000000/mac-os.png" alt="Apple" />
                Sign in with Apple
              </button>
            </div>
          </form>

          <p className="auth-footer-link">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
