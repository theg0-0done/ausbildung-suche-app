import { AuthProvider, useAuth } from "./contexts/AuthContext";
import {
  BrowserRouter,
  Routes,
  Route,
  useSearchParams,
  useLocation,
  Navigate,
} from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import DetailPage from "./pages/DetailPage";
import { ProfilePage } from "./pages/ProfilePage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { HistoryPage } from "./pages/HistoryPage";
import { Navbar } from "./components/Navbar";
import { BottomNav } from "./components/BottomNav";
import { SplashScreen } from "./pages/SplashScreen";
import { AuthPage } from "./pages/AuthPage";
import { NotificationProvider } from "./contexts/NotificationContext";

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

const HIDDEN_NAV_ROUTES = ["/auth", "/splash"];

function MainApp() {
  const { user } = useAuth();
  const location = useLocation();
  const showNav = !HIDDEN_NAV_ROUTES.includes(location.pathname);

  return (
    <div className="app">
      {/* Navbar - Kept strictly for the header, not routing logic */}
      {showNav && <Navbar />}

      {/* Main Content Area */}
      <div className="page-content">
        <Routes>
          {/* Splash acts as the entry point */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/home" element={<SearchPageWrapper />} />
          <Route
            path="/auth"
            element={user ? <Navigate to="/home" replace /> : <AuthPage />}
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
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
  const activeRefnr = searchParams.get("refnr");

  if (activeRefnr) {
    return (
      <DetailPage
        refnr={activeRefnr}
        onBack={() => {
          searchParams.delete("refnr");
          setSearchParams(searchParams);
        }}
      />
    );
  }

  return <SearchPage onSelectJob={(refnr) => setSearchParams({ refnr })} />;
}

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <BrowserRouter>
          <MainApp />
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  );
}
