import { useCallback, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import SearchBar from '../components/SearchBar';
import JobCard from '../components/JobCard';
import FilterSidebar from '../components/FilterSidebar';
import ActiveFilters from '../components/ActiveFilters';
import { searchAusbildungen } from '../api';
import type { JobFilters } from '../types';
import { useSearchStore } from '../store/useSearchStore';

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
  
  const extract = (key: keyof JobFilters) => {
    const val = params.get(key);
    if (val) (filters as any)[key] = val;
  }
  
  extract('was');
  extract('wo');
  extract('umkreis');
  extract('veroeffentlichtseit');
  extract('angebotsart');
  extract('befristung');
  extract('berufsfeld');
  extract('arbeitgeber');
  extract('zeitarbeit');
  extract('pav');
  extract('behinderung');
  extract('ausbildungsart');

  const arbeitszeit = params.get('arbeitszeit');
  if (arbeitszeit) {
    filters.arbeitszeit = arbeitszeit.split(';');
  }

  return filters;
}

export default function SearchPage({ onSelectJob }: SearchPageProps) {
  // UX UX: Bind all filtering logic to a persistent Zustand store
  const { filters, setFilters, updateFilter, removeFilter, clearFilters, isSidebarOpen, setSidebarOpen } = useSearchStore();

  useEffect(() => {
    // Only attempt to hydrate filters from query params if there isn't an active search
    const parsed = parseInitialFilters();
    if (Object.keys(parsed).length > 0 && Object.keys(filters).length === 0) {
      setFilters(parsed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isFetched,
  } = useInfiniteQuery({
    queryKey: ['jobs', filters],
    queryFn: async ({ pageParam = 1 }) => {
      pushSearchParams(filters);
      return searchAusbildungen(filters, pageParam);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((acc, page) => acc + (page.stellenangebote?.length || 0), 0);
      if (loadedCount < (lastPage.maxErgebnisse || 0)) {
        return allPages.length + 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000, // UX: Cache search results for 5 minutes
  });

  const results = data ? data.pages.flatMap(p => p.stellenangebote || []) : [];
  const total = data?.pages[0]?.maxErgebnisse || 0;
  const isLoading = isFetching && !isFetchingNextPage;

  const handleSearch = useCallback((was: string, wo: string) => {
    updateFilter('was', was);
    updateFilter('wo', wo);
  }, [updateFilter]);

  const handleFilterChange = useCallback((newFilters: JobFilters) => {
    setFilters(newFilters);
  }, [setFilters]);

  const handleFilterReset = useCallback(() => {
    setFilters({ was: filters.was, wo: filters.wo });
  }, [filters.was, filters.wo, setFilters]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

  // Apply Client-Side Filters
  const displayedResults = results.filter((job) => {
    if (filters.ausbildungsart) {
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
            loading={isLoading}
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
          onClose={() => setSidebarOpen(false)}
          totalResults={total}
        />

        <div className="results-content">
          <ActiveFilters 
            filters={filters} 
            onRemove={removeFilter} 
            onClearAll={clearFilters} 
          />

          <div className="results-header">
            {isFetched && !isLoading && (
              <h2>
                {total > 0
                  ? <><span className="gradient-text">{total.toLocaleString('de-DE')}</span> Ergebnisse gefunden</>
                  : 'Keine Ergebnisse gefunden'}
              </h2>
            )}
            <button className="toggle-filters-btn" onClick={() => setSidebarOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filter ({Object.keys(filters).length - (filters.was ? 1 : 0) - (filters.wo ? 1 : 0) > 0 ? Object.keys(filters).length - (filters.was ? 1 : 0) - (filters.wo ? 1 : 0) : ''})
            </button>
          </div>

        {error && (
          <div className="error-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {(error as Error).message || 'Ein Fehler ist aufgetreten'}
          </div>
        )}

        {isLoading && (
          <div className="loading-container">
            <div className="spinner" />
            <p>Suche Ausbildungsplätze...</p>
          </div>
        )}

        {!isLoading && displayedResults.length > 0 && (
          <div className="results-grid">
            {displayedResults.map((job) => (
              <JobCard key={job.refnr} job={job} onClick={() => onSelectJob(job.refnr)} />
            ))}
          </div>
        )}

        {!isLoading && isFetched && displayedResults.length === 0 && !error && (
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

        {!isLoading && hasNextPage && (
          <div className="load-more-container">
            <button className="load-more-btn" onClick={handleLoadMore} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? <span className="spinner-small" /> : 'Mehr laden'}
            </button>
          </div>
        )}
        </div>
      </section>
    </div>
  );
}
