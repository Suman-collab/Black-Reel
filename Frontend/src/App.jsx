import { useState, useEffect } from 'react';
import { BrowserRouter, HashRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RequireAuth from './components/RequireAuth';
import Home from './pages/Home';
import Categories from './pages/Categories';
import Profile from './pages/Profile';
import Watchlist from './pages/Watchlist';
import Fandom from './pages/Fandom';
import ShowDetails from './pages/ShowDetails';
import Search from './pages/Search';
import Subscribe from './pages/Subscribe';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PaymentHistory from './pages/PaymentHistory';
import Notifications from './pages/Notifications';
import Plans from './pages/Plans';
import Settings from './pages/Settings';
import DeviceManagement from './pages/DeviceManagement';
import AccountSuspended from './pages/AccountSuspended';
import Support from './pages/Support';
import { AuthProvider } from './features/auth/AuthContext';
import { useAuth } from './features/auth/AuthContext';
import { WatchlistProvider } from './features/watchlist/WatchlistContext';
import { I18nProvider } from './i18n/I18nContext';
import DeviceLimitModal from './components/DeviceLimitModal';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AppContent() {
  const location = useLocation();
  const { 
    initialized, 
    loading, 
    hasRestrictedAccess, 
    logout, 
    verificationPending, 
    verificationEmail, 
    verifyEmail, 
    resendVerification 
  } = useAuth();
  const hideFooterParams = ['/login', '/signup', '/verify-email', '/forgot-password', '/reset-password', '/account-suspended'];
  const shouldHideFooter = hideFooterParams.includes(location.pathname);

  const [resendCooldown, setResendCooldown] = useState(0);
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = async () => {
    setChecking(true);
    try {
      await verifyEmail();
      toast.success('Email successfully verified! Welcome aboard.');
    } catch (err) {
      toast.error(err.message || 'Verification is still pending.');
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerification();
      toast.success('Verification email sent! Please check your inbox.');
      setResendCooldown(60);
    } catch (err) {
      toast.error(err.message || 'Failed to resend verification email.');
    } finally {
      setSending(false);
    }
  };

  if (initialized && !loading && hasRestrictedAccess) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #1C1010 0%, #0A0404 100%)',
        color: '#F5F5F0',
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{ fontSize: '72px', marginBottom: '24px' }}>⚠️</div>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '16px',
          color: '#FF6B6B',
          letterSpacing: '-0.5px'
        }}>Access Revoked</h1>
        <p style={{
          color: '#A0A0A8',
          fontSize: '15px',
          lineHeight: '1.6',
          maxWidth: '440px',
          marginBottom: '32px'
        }}>
          Your account has been permanently banned from the Black Reel network due to severe or repeated violations of our Terms of Service and Platform Guidelines.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '280px' }}>
          <a
            href="mailto:support@blackreel.com?subject=Banned%20Account%20Appeal"
            style={{
              padding: '14px 28px',
              borderRadius: '999px',
              background: '#FF6B6B',
              color: '#0A0404',
              fontWeight: '700',
              textDecoration: 'none',
              fontSize: '14px',
              transition: 'all 0.2s',
              boxShadow: '0 4px 16px rgba(255, 107, 107, 0.35)',
              display: 'inline-block'
            }}
          >
            Contact Customer Support
          </a>
          <button
            onClick={() => {
              void logout();
            }}
            style={{
              padding: '12px 24px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#A0A0A8',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (initialized && !loading && verificationPending) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #18141F 0%, #0A080D 100%)',
        color: '#F5F5F0',
        fontFamily: 'Outfit, sans-serif',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{
          background: 'rgba(20, 20, 20, 0.65)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '3rem 2.5rem',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            marginBottom: '24px',
            boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3)'
          }}>
            ✉️
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '12px',
            color: '#FFFFFF',
            letterSpacing: '-0.5px'
          }}>Verify your email</h1>
          <p style={{
            color: '#A0A0A8',
            fontSize: '15px',
            lineHeight: '1.6',
            marginBottom: '24px'
          }}>
            We've sent a verification link to <strong style={{ color: '#FF8E53' }}>{verificationEmail}</strong>.<br />
            Please check your inbox (and spam folder) and verify your account to access Black Reel.
          </p>

          <div style={{ display: 'grid', gap: '12px', width: '100%' }}>
            <button
              onClick={handleVerify}
              disabled={checking}
              style={{
                padding: '14px 28px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 16px rgba(255, 107, 107, 0.2)'
              }}
            >
              {checking ? 'Checking Status...' : 'I Have Verified'}
            </button>

            <button
              onClick={handleResend}
              disabled={sending || resendCooldown > 0}
              style={{
                padding: '12px 24px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: resendCooldown > 0 ? '#606068' : '#A0A0A8',
                cursor: (sending || resendCooldown > 0) ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
            >
              {sending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
            </button>

            <button
              onClick={() => {
                void logout();
              }}
              style={{
                padding: '12px 24px',
                borderRadius: '999px',
                background: 'transparent',
                border: 'none',
                color: '#606068',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                textDecoration: 'underline',
                marginTop: '8px'
              }}
            >
              Log Out & Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route
            path="/watchlist"
            element={
              <RequireAuth>
                <Watchlist />
              </RequireAuth>
            }
          />
          <Route path="/fandom" element={<Fandom />} />
          <Route path="/show/:id" element={<ShowDetails />} />
          <Route path="/search" element={<Search />} />
          <Route path="/plans" element={<Plans />} />
          <Route
            path="/subscribe"
            element={
              <RequireAuth>
                <Subscribe />
              </RequireAuth>
            }
          />
          <Route
            path="/checkout"
            element={
              <RequireAuth>
                <Checkout />
              </RequireAuth>
            }
          />
          <Route
            path="/checkout/success"
            element={
              <RequireAuth>
                <CheckoutSuccess />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/account-suspended" element={<AccountSuspended />} />
          <Route
            path="/payment-history"
            element={
              <RequireAuth>
                <PaymentHistory />
              </RequireAuth>
            }
          />
          <Route
            path="/notifications"
            element={
              <RequireAuth>
                <Notifications />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />
          <Route
            path="/device-management"
            element={
              <RequireAuth>
                <DeviceManagement />
              </RequireAuth>
            }
          />
          <Route path="/support" element={<Support />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!shouldHideFooter && <Footer />}
      <DeviceLimitModal />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}

function App() {
  const routerMode = import.meta.env.VITE_ROUTER_MODE || (import.meta.env.PROD ? 'hash' : 'browser');
  const routerBaseName = import.meta.env.VITE_ROUTER_BASENAME || '/';

  if (routerMode === 'hash') {
    return (
      <HashRouter>
        <AuthProvider>
          <I18nProvider>
            <WatchlistProvider>
              <AppContent />
            </WatchlistProvider>
          </I18nProvider>
        </AuthProvider>
      </HashRouter>
    );
  }

  return (
    <BrowserRouter basename={routerBaseName}>
      <AuthProvider>
        <I18nProvider>
          <WatchlistProvider>
            <AppContent />
          </WatchlistProvider>
        </I18nProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
