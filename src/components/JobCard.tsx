import { useState, useEffect } from 'react';
import type { JobSearchItem } from '../types';
import { getLogoUrl } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { favoritesApi } from '../userApi';

interface JobCardProps {
  job: JobSearchItem;
  onClick: (job: JobSearchItem) => void;
}

export default function JobCard({ job, onClick }: JobCardProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  
  const initial = job.arbeitgeber?.charAt(0)?.toUpperCase() || '?';
  const location = [job.arbeitsort?.ort, job.arbeitsort?.region]
    .filter(Boolean)
    .join(', ');
  const logoUrl = job.kundennummerHash ? getLogoUrl(job.kundennummerHash) : null;

  useEffect(() => {
    if (user && job.refnr) {
      favoritesApi.checkFavorite(job.refnr)
        .then(res => setIsFavorite(res.isFavorite))
        .catch(console.error);
    }
  }, [user, job.refnr]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent triggering card click
    if (!user) {
      alert('Bitte melde dich an, um Favoriten zu speichern.');
      return;
    }

    try {
      if (isFavorite) {
        await favoritesApi.removeFavorite(job.refnr);
        setIsFavorite(false);
      } else {
        await favoritesApi.addFavorite({
          refnr: job.refnr,
          title: job.titel || job.beruf || '',
          employer: job.arbeitgeber || '',
          location: job.arbeitsort?.ort || '',
        });
        setIsFavorite(true);
      }
    } catch (err) {
      console.error(err);
      alert('Aktion fehlgeschlagen');
    }
  };

  return (
    <article className="job-card" onClick={() => onClick(job)} tabIndex={0} role="button"
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(job); }}
    >
      <div className="job-card-logo">
        {logoUrl && !logoFailed ? (
          <img
            src={logoUrl}
            alt={`${job.arbeitgeber} Logo`}
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <div className="logo-placeholder">
            {initial}
          </div>
        )}
      </div>
      <div className="job-card-body">
        <h3 className="job-card-title">{job.titel || job.beruf}</h3>
        <p className="job-card-company">{job.arbeitgeber}</p>
        <div className="job-card-meta">
          {location && (
            <span className="job-meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {location}
            </span>
          )}
        </div>
      </div>
      <div className="job-card-actions">
        <button 
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={toggleFavorite}
          aria-label={isFavorite ? 'Von Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>
      </div>
    </article>
  );
}
