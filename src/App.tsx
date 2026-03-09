import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams, useLocation, Navigate } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import DetailPage from './pages/DetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { FavoritesPage } from './pages/FavoritesPage';
import { HistoryPage } from './pages/HistoryPage';
import { BottomNav } from './components/BottomNav';
import { SplashScreen } from './pages/SplashScreen';
import { AuthPage } from './pages/AuthPage';

const HIDDEN_NAV_ROUTES = ['/auth', '/splash'];

function MainApp() {
  const {} = useAuth();
  const navigate = useNavigate();
   const location = useLocation();
  const showNav = !HIDDEN_NAV_ROUTES.includes(location.pathname);

  return (
    <div className="app">
      {/* Navbar - Kept strictly for the header, not routing logic */}
      {showNav && <nav className="navbar">
        <a href="/" className="navbar-brand" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#navGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="navGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
          <span>Ausbildungs<span className="gradient-text">Suche</span></span>
        </a>
      </nav>}

      {/* Main Content Area */}
      <div className="page-content">
        <Routes>
          {/* Splash acts as the entry point */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/home" element={<SearchPageWrapper />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/history" element={<HistoryPage />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <BottomNav />
    </div>
  );
}

// Wrapper for the Search page to handle the `refnr` detail overlay logic
function SearchPageWrapper() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeRefnr = searchParams.get('refnr');

  if (activeRefnr) {
    return <DetailPage refnr={activeRefnr} onBack={() => { searchParams.delete('refnr'); setSearchParams(searchParams); }} />;
  }

  return <SearchPage onSelectJob={(refnr) => setSearchParams({ refnr })} />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainApp />
      </BrowserRouter>
    </AuthProvider>
  );
}
