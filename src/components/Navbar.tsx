import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <a
          href="/home"
          className="navbar-brand"
          onClick={(e) => {
            e.preventDefault();
            navigate("/home");
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="url(#navGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <defs>
              <linearGradient id="navGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
          <span>
            Ausbildungs<span className="gradient-text">Suche</span>
          </span>
        </a>
      </div>

      <div className="navbar-center">
        <div className="nav-links">
          <button onClick={() => navigate("/home")} className="nav-link">
            Home
          </button>
          <button onClick={() => navigate("/favorites")} className="nav-link">
            Favoriten
          </button>
          <button onClick={() => navigate("/history")} className="nav-link">
            Verlauf
          </button>
        </div>
      </div>

      <div className="navbar-right">
        {user ? (
          <button
            onClick={() => navigate("/profile")}
            className="profile-icon-btn"
            title="Profil"
          >
            <div className="profile-initial">
              {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
            </div>
          </button>
        ) : (
          <div className="nav-auth">
            <button
              onClick={() => navigate("/auth")}
              className="btn-secondary small"
            >
              Anmelden
            </button>
            <button
              onClick={() => navigate("/auth?mode=register")}
              className="btn-primary small"
            >
              Registrieren
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
