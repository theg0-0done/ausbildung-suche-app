import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { historyApi } from "../userApi";
import JobCard from "../components/JobCard";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { buildMockJob } from "../utils/mockJob";

interface HistoryItem {
  id: string;
  refnr: string;
  title: string;
  employer: string;
  viewed_at: string;
}

export function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification, showConfirm } = useNotification();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    historyApi
      .getHistory()
      .then((res) => setHistory(res.data || []))
      .catch(() => {
        showNotification("Verlauf konnte nicht geladen werden.", "error");
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleClear = async () => {
    const confirmed = await showConfirm(
      "Möchtest du deinen gesamten Verlauf löschen?",
    );
    if (!confirmed) return;

    try {
      await historyApi.clearHistory();
      setHistory([]);
      showNotification("Verlauf geleert.", "success");
    } catch {
      showNotification("Verlauf konnte nicht geleert werden.", "error");
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
          <button className="btn-primary" onClick={() => navigate("/")}>
            Ausbildungen entdecken
          </button>
        </div>
      ) : (
        <div className="results-grid">
          {history.map((item) => (
            <JobCard
              key={item.id}
              job={buildMockJob(item)}
              onClick={() => navigate(`/?refnr=${item.refnr}`)}
            />
          ))}

          {history.length > 0 && (
            <button className="btn-secondary small" onClick={handleClear}>
              Verlauf leeren
            </button>
          )}
        </div>
      )}
    </div>
  );
}
