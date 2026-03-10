import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { favoritesApi } from "../userApi";
import JobCard from "../components/JobCard";
import { useNavigate } from "react-router-dom";
import { HeartOff } from "lucide-react";
import { buildMockJob } from "../utils/mockJob";

interface FavoriteItem {
  id: string;
  refnr: string;
  title: string;
  employer: string;
  location: string;
  saved_at: string;
}

export function FavoritesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    favoritesApi
      .getFavorites()
      .then((res) => setFavorites(res.data || []))
      .catch(() => {
        showNotification("Favoriten konnten nicht geladen werden.", "error");
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleRemove = async (refnr: string) => {
    try {
      await favoritesApi.removeFavorite(refnr);
      setFavorites(favorites.filter((f) => f.refnr !== refnr));
      showNotification("Aus Favoriten entfernt.", "success");
    } catch {
      showNotification("Entfernen fehlgeschlagen.", "error");
    }
  };

  if (loading) return <div className="loading-state">Lade Favoriten...</div>;

  return (
    <div className="page-container favorites-page">
      <div className="page-header sticky-header">
        <h2>
          Meine Favoriten
          <span className="badge gradient-text">({favorites.length})</span>
        </h2>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <HeartOff size={48} color="currentColor" strokeWidth={1.5} />
          </div>
          <h3>Keine Favoriten</h3>
          <p>
            Du hast noch keine Ausbildungen gespeichert. Klicke auf das
            Herz-Symbol bei einer Anzeige, um sie hier zu speichern.
          </p>
          <button className="btn-primary" onClick={() => navigate("/")}>
            Ausbildungen suchen
          </button>
        </div>
      ) : (
        <div className="results-grid">
          {favorites.map((fav) => (
            <div
              key={fav.refnr}
              className="favorite-item-wrapper"
              style={{ position: "relative" }}
            >
              <JobCard
                job={buildMockJob(fav)}
                onClick={() => navigate(`/?refnr=${fav.refnr}`)}
              />
              <button
                className="remove-favorite-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(fav.refnr);
                }}
                aria-label="Favorit entfernen"
              ></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
