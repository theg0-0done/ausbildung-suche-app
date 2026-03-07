import { useState, type FormEvent } from 'react';

interface SearchBarProps {
  onSearch: (was: string, wo: string) => void;
  loading: boolean;
  initialWas?: string;
  initialWo?: string;
}

export default function SearchBar({ onSearch, loading, initialWas = '', initialWo = '' }: SearchBarProps) {
  const [was, setWas] = useState(initialWas);
  const [wo, setWo] = useState(initialWo);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(was, wo);
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-inputs">
        <div className="input-group">
          <label htmlFor="search-was">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </label>
          <input
            id="search-was"
            type="text"
            placeholder="Beruf, Stichwort..."
            value={was}
            onChange={(e) => setWas(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label htmlFor="search-wo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </label>
          <input
            id="search-wo"
            type="text"
            placeholder="Ort, PLZ..."
            value={wo}
            onChange={(e) => setWo(e.target.value)}
          />
        </div>
        <button type="submit" className="search-btn" disabled={loading}>
          {loading ? (
            <span className="spinner-small" />
          ) : (
            'Suchen'
          )}
        </button>
      </div>
    </form>
  );
}
