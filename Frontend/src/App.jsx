import { BrowserRouter, HashRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
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
import PaymentHistory from './pages/PaymentHistory';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import DeviceManagement from './pages/DeviceManagement';
import AccountSuspended from './pages/AccountSuspended';
import { AuthProvider } from './features/auth/AuthContext';
import { useAuth } from './features/auth/AuthContext';
import { WatchlistProvider } from './features/watchlist/WatchlistContext';
import { I18nProvider } from './i18n/I18nContext';

function AppContent() {
  const location = useLocation();
  const { initialized, loading, hasRestrictedAccess } = useAuth();
  const hideFooterParams = ['/login', '/signup', '/account-suspended'];
  const shouldHideFooter = hideFooterParams.includes(location.pathname);

  if (initialized && !loading && hasRestrictedAccess && location.pathname !== '/account-suspended') {
    return <Navigate to="/account-suspended" replace />;
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!shouldHideFooter && <Footer />}
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
