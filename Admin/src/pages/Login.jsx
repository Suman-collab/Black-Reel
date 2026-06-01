import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await login({ email, password });
      navigate('/');
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'radial-gradient(circle at center, #151518 0%, #08080a 100%)',
      padding: 'var(--space-4)'
    }} className="animate-fade-in">
      <div className="form-container">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-2xl)', fontWeight: '800', marginBottom: 'var(--space-3)' }}>
            <span style={{ color: 'var(--brand-primary)', letterSpacing: '1px' }}>BLACK</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: '400', letterSpacing: '1px' }}>REEL</span>
          </div>
          <h2 className="form-title" style={{ fontSize: 'var(--text-xl)', marginTop: 'var(--space-2)' }}>Admin Portal</h2>
          <p className="form-subtitle" style={{ marginBottom: 0 }}>Access the streaming administration suite</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-email">Email Address</label>
            <input
              className="form-input"
              type="email"
              id="admin-email"
              placeholder="admin@blackreel.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">Password</label>
            <div className="form-input-wrapper">
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                id="admin-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="form-input-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div className="form-error" style={{ marginBottom: 'var(--space-4)', justifyContent: 'center' }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '52px', marginTop: 'var(--space-2)' }} disabled={submitting}>
            {submitting ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;


