import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { historyApi } from '../userApi';
import JobCard from '../components/JobCard';
import type { JobSearchItem } from '../types';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';

export function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    historyApi.getHistory()
      .then(data => setHistory(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleClear = async () => {
    if (!window.confirm('Möchtest du deinen gesamten Verlauf löschen?')) return;
    
    try {
      await historyApi.clearHistory();
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear history', err);
    }
  };

  if (loading) return <div className="loading-state">Lade Verlauf...</div>;

  return (
    <div className="page-container history-page">
      <div className="page-header sticky-header">
        <h2>Zuletzt angesehen</h2>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Clock size={48} color="currentColor" strokeWidth={1.5} />
          </div>
          <h3>Kein Verlauf</h3>
          <p>Du hast dir noch keine Ausbildungen angesehen.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Ausbildungen entdecken</button>
        </div>
      ) : (
        <div className="results-grid">
          {history.map((item) => {
            const mockJob = {
              refnr: item.refnr,
              titel: item.title,
              arbeitgeber: item.employer,
              arbeitsort: { plz: '', ort: '', region: '', land: '' },
              aktuelleVeroeffentlichungsdatum: item.viewed_at, // Use viewed date for display
            } as unknown as JobSearchItem;

            
            
            return (
              <JobCard key={item.id} job={mockJob} onClick={() => navigate(`/?refnr=${mockJob.refnr}`)} />
            );
          })}
          
          {history.length > 0 && (
            <button className="btn-secondary small" onClick={handleClear}>Verlauf leeren</button>
          )}
        </div>
      )}
    </div>
  );
}
