import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { favoritesApi } from '../userApi';
import JobCard from '../components/JobCard';
import type { JobSearchItem } from '../types';
import { useNavigate } from 'react-router-dom';
import { HeartOff } from 'lucide-react';

export function FavoritesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    favoritesApi.getFavorites()
      .then(data => setFavorites(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleRemove = async (refnr: string) => {
    try {
      await favoritesApi.removeFavorite(refnr);
      setFavorites(favorites.filter(f => f.refnr !== refnr));
    } catch (err) {
      console.error('Failed to remove favorite', err);
    }
  };

  if (loading) return <div className="loading-state">Lade Favoriten...</div>;

  return (
    <div className="page-container favorites-page">
      <div className="page-header sticky-header">
        <h2>Meine Favoriten
          <span className="badge gradient-text">({favorites.length})</span>
        </h2>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <HeartOff size={48} color="currentColor" strokeWidth={1.5} />
          </div>
          <h3>Keine Favoriten</h3>
          <p>Du hast noch keine Ausbildungen gespeichert. Klicke auf das Herz-Symbol bei einer Anzeige, um sie hier zu speichern.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Ausbildungen suchen</button>
        </div>
      ) : (
        <div className="results-grid">
          {favorites.map((fav) => {
            const mockJob = {
              refnr: fav.refnr,
              titel: fav.title,
              arbeitgeber: fav.employer,
              arbeitsort: { plz: '', ort: fav.location, region: '', land: '' },
              aktuelleVeroeffentlichungsdatum: fav.saved_at,
            } as unknown as JobSearchItem;
            
            return (
              <div key={fav.refnr} className="favorite-item-wrapper" style={{ position: 'relative' }}>
                <JobCard job={mockJob} onClick={() => navigate(`/?refnr=${mockJob.refnr}`)} />
                <button 
                  className="remove-favorite-btn"
                  onClick={(e) => { e.stopPropagation(); handleRemove(fav.refnr); }}
                  aria-label="Favorit entfernen"
                  style={{
                    position: 'absolute', top: '13px', right: '1rem', background: 'transparent', border: 'none', borderRadius: '50%', width: '2.2rem', height: '2.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'
                  }}
                >
                  
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
