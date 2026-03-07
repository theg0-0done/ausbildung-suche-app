import { useState } from 'react';
import type { JobSearchItem } from '../types';
import { getLogoUrl } from '../api';

interface JobCardProps {
  job: JobSearchItem;
  onClick: (job: JobSearchItem) => void;
}

export default function JobCard({ job, onClick }: JobCardProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const initial = job.arbeitgeber?.charAt(0)?.toUpperCase() || '?';
  const location = [job.arbeitsort?.ort, job.arbeitsort?.region]
    .filter(Boolean)
    .join(', ');
  const logoUrl = job.kundennummerHash ? getLogoUrl(job.kundennummerHash) : null;

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
          {location && job.eintrittsdatum && <span className="meta-divider">•</span>}
          {job.eintrittsdatum && (
            <span className="job-meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Ab {new Date(job.eintrittsdatum).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
            </span>
          )}
        </div>
      </div>
      <div className="job-card-arrow">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </article>
  );
}
