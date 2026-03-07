import { useState, useEffect, useCallback } from 'react';
import SearchPage from './pages/SearchPage';
import DetailPage from './pages/DetailPage';

/** Read the refnr query param from the current URL */
function getRefnrFromUrl(): string {
  return new URLSearchParams(window.location.search).get('refnr') ?? '';
}

export default function App() {
  const [activeRefnr, setActiveRefnr] = useState(getRefnrFromUrl);

  // Listen for browser back/forward
  useEffect(() => {
    const onPop = () => setActiveRefnr(getRefnrFromUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigateToDetail = useCallback((refnr: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('refnr', refnr); // preserve other params
    window.history.pushState({}, '', url);
    setActiveRefnr(refnr);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateToSearch = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('refnr'); // just remove refnr, keep filters
    window.history.pushState({}, '', url);
    setActiveRefnr('');
  }, []);

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <a href="/" className="navbar-brand" onClick={(e) => { e.preventDefault(); navigateToSearch(); }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#navGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="navGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
          <span>Ausbildungs<span className="gradient-text">Suche</span></span>
        </a>
      </nav>

      {/* Page Content */}
      {activeRefnr && <DetailPage refnr={activeRefnr} onBack={navigateToSearch} />}
      <div style={{ display: activeRefnr ? 'none' : 'block' }}>
        <SearchPage onSelectJob={navigateToDetail} />
      </div>
    </div>
  );
}
