import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
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
          <Route path="/profile" element={<Profile />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/fandom" element={<Fandom />} />
          <Route path="/show/:id" element={<ShowDetails />} />
          <Route path="/search" element={<Search />} />
          <Route path="/subscribe" element={<Subscribe />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/payment-history" element={<PaymentHistory />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/device-management" element={<DeviceManagement />} />
        </Routes>
      </main>
      {!shouldHideFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
