import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import Login from './pages/Login';
import Signup from './pages/Signup';
import PaymentHistory from './pages/PaymentHistory';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import DeviceManagement from './pages/DeviceManagement';
import { AuthProvider } from './features/auth/AuthContext';

function AppContent() {
  const location = useLocation();
  const hideFooterParams = ['/login', '/signup'];
  const shouldHideFooter = hideFooterParams.includes(location.pathname);

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
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
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
        </Routes>
      </main>
      {!shouldHideFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
