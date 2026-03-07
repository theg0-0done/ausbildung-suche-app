import { useState, useCallback, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import JobCard from '../components/JobCard';
import FilterSidebar from '../components/FilterSidebar';
import ActiveFilters from '../components/ActiveFilters';
import { searchAusbildungen } from '../api';
import type { JobSearchItem, JobFilters } from '../types';

interface SearchPageProps {
  onSelectJob: (refnr: string) => void;
}

/** Push filters into the URL without a full page reload */
function pushSearchParams(filters: JobFilters) {
  const url = new URL(window.location.href);
  url.searchParams.delete('refnr');
  
  // Clear all existing filter params
  const keysToRemove = [
    'was', 'wo', 'umkreis', 'veroeffentlichtseit', 'arbeitszeit',
    'angebotsart', 'befristung', 'berufsfeld', 'arbeitgeber',
    'zeitarbeit', 'pav', 'behinderung', 'ausbildungsart'
  ];
  keysToRemove.forEach(k => url.searchParams.delete(k));

  // Add active filters
  Object.entries(filters).forEach(([k, v]) => {
    if (k === 'arbeitszeit' && Array.isArray(v) && v.length > 0) {
      url.searchParams.set(k, v.join(';'));
    } else if (v && typeof v === 'string' && v.trim() !== '') {
      url.searchParams.set(k, v.trim());
    }
  });

  window.history.replaceState({}, '', url);
}

/** Parse initial filters from URL */
function parseInitialFilters(): JobFilters {
  const params = new URLSearchParams(window.location.search);
  const filters: JobFilters = {};
  
  const was = params.get('was'); if (was) filters.was = was;
  const wo = params.get('wo'); if (wo) filters.wo = wo;
  const umkreis = params.get('umkreis'); if (umkreis) filters.umkreis = umkreis;
  const veroeffentlichtseit = params.get('veroeffentlichtseit'); if (veroeffentlichtseit) filters.veroeffentlichtseit = veroeffentlichtseit;
  const angebotsart = params.get('angebotsart'); if (angebotsart) filters.angebotsart = angebotsart;
  const befristung = params.get('befristung'); if (befristung) filters.befristung = befristung;
  const berufsfeld = params.get('berufsfeld'); if (berufsfeld) filters.berufsfeld = berufsfeld;
  const arbeitgeber = params.get('arbeitgeber'); if (arbeitgeber) filters.arbeitgeber = arbeitgeber;
  const zeitarbeit = params.get('zeitarbeit'); if (zeitarbeit) filters.zeitarbeit = zeitarbeit;
  const pav = params.get('pav'); if (pav) filters.pav = pav;
  const behinderung = params.get('behinderung'); if (behinderung) filters.behinderung = behinderung;
  const ausbildungsart = params.get('ausbildungsart'); if (ausbildungsart) filters.ausbildungsart = ausbildungsart;
  const arbeitszeit = params.get('arbeitszeit');
  if (arbeitszeit) {
    filters.arbeitszeit = arbeitszeit.split(';');
  }

  return filters;
}

export default function SearchPage({ onSelectJob }: SearchPageProps) {
  const initialFilters = parseInitialFilters();

  const [filters, setFilters] = useState<JobFilters>(initialFilters);
  const [results, setResults] = useState<JobSearchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<JobFilters>(initialFilters);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const executeSearch = useCallback(async (currentFilters: JobFilters, isLoadMore = false) => {
    const targetPage = isLoadMore ? page + 1 : 1;
    
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setSearched(true);
      setPage(1);
      setLastQuery(currentFilters);
      pushSearchParams(currentFilters);
    }
    
    setError(null);

    try {
      const data = await searchAusbildungen(currentFilters, targetPage);
      if (isLoadMore) {
        setResults((prev) => [...prev, ...(data.stellenangebote || [])]);
        setPage(targetPage);
      } else {
        setResults(data.stellenangebote || []);
        setTotal(data.maxErgebnisse || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      if (!isLoadMore) {
        setResults([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page]);

  const handleSearch = useCallback((was: string, wo: string) => {
    const updatedFilters = { ...filters, was, wo };
    setFilters(updatedFilters);
    executeSearch(updatedFilters);
  }, [filters, executeSearch]);

  const handleFilterChange = useCallback((newFilters: JobFilters) => {
    setFilters(newFilters);
    executeSearch(newFilters);
  }, [executeSearch]);

  const handleFilterReset = useCallback(() => {
    const resetFilters: JobFilters = { was: filters.was, wo: filters.wo };
    setFilters(resetFilters);
    executeSearch(resetFilters);
  }, [filters.was, filters.wo, executeSearch]);

  const handleRemoveFilter = useCallback((key: keyof JobFilters, value?: string) => {
    setFilters(prev => {
      const updated = { ...prev };
      if (key === 'arbeitszeit' && value && Array.isArray(updated.arbeitszeit)) {
        updated.arbeitszeit = updated.arbeitszeit.filter(v => v !== value);
        if (updated.arbeitszeit.length === 0) {
          delete updated.arbeitszeit;
        }
      } else {
        delete updated[key];
        if (key === 'angebotsart') {
          delete updated.ausbildungsart;
        }
      }
      executeSearch(updated);
      return updated;
    });
  }, [executeSearch]);

  const handleClearAllFilters = useCallback(() => {
    const cleared: JobFilters = {};
    setFilters(cleared);
    executeSearch(cleared);
  }, [executeSearch]);

  const handleLoadMore = useCallback(() => {
    executeSearch(lastQuery, true);
  }, [executeSearch, lastQuery]);

  useEffect(() => {
    executeSearch(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasMore = results.length < total;

  // Apply Client-Side Filters
  const displayedResults = results.filter((job) => {
    if (filters.ausbildungsart) {
      // Very naive check: 'ausbildungsart' might not always be returned in the search payload
      // depending on the API. If it is returned, this works.
      // E.g., if JobDetail has it, it might also appear in `job`.
      // Fallback: Check if the title mentions it as a workaround if the API payload misses it
      const typeMatches = job.ausbildungsart === filters.ausbildungsart;
      const titleMatches = (job.titel || '').toLowerCase().includes(filters.ausbildungsart.toLowerCase());
      return typeMatches || titleMatches;
    }
    return true;
  });

  return (
    <div className="search-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Finde deine <span className="gradient-text">Ausbildung</span>
          </h1>
          <p className="hero-subtitle">
            Durchsuche tausende Ausbildungsangebote in ganz Deutschland
          </p>
          <SearchBar
            onSearch={handleSearch}
            loading={loading}
            initialWas={filters.was || ''}
            initialWo={filters.wo || ''}
          />
        </div>
        <div className="hero-glow" />
      </section>

      {/* Results Section layout */}
      <section className="results-section search-page-layout">
        <FilterSidebar
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleFilterReset}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          totalResults={total}
        />

        <div className="results-content">
          <ActiveFilters 
            filters={filters} 
            onRemove={handleRemoveFilter} 
            onClearAll={handleClearAllFilters} 
          />

          <div className="results-header">
            <button className="toggle-filters-btn" onClick={() => setIsSidebarOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filter ({Object.keys(filters).length - (filters.was ? 1 : 0) - (filters.wo ? 1 : 0) > 0 ? Object.keys(filters).length - (filters.was ? 1 : 0) - (filters.wo ? 1 : 0) : ''})
            </button>
            {searched && !loading && (
              <h2>
                {total > 0
                  ? <><span className="gradient-text">{total.toLocaleString('de-DE')}</span> Ergebnisse gefunden</>
                  : 'Keine Ergebnisse gefunden'}
              </h2>
            )}
          </div>

        {error && (
          <div className="error-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        {loading && (
          <div className="loading-container">
            <div className="spinner" />
            <p>Suche Ausbildungsplätze...</p>
          </div>
        )}

        {!loading && displayedResults.length > 0 && (
          <div className="results-grid">
            {displayedResults.map((job) => (
              <JobCard key={job.refnr} job={job} onClick={() => onSelectJob(job.refnr)} />
            ))}
          </div>
        )}

        {!loading && searched && displayedResults.length === 0 && !error && (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <h3>Keine Ausbildungen gefunden</h3>
            <p>Versuche es mit anderen Suchbegriffen oder einem anderen Ort.</p>
          </div>
        )}

        {!loading && hasMore && (
          <div className="load-more-container">
            <button className="load-more-btn" onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? <span className="spinner-small" /> : 'Mehr laden'}
            </button>
          </div>
        )}
        </div>
      </section>
    </div>
  );
}
