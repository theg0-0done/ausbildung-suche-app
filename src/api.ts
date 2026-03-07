import type { SearchResponse, JobDetail, JobFilters } from './types';

const PROXY_BASE = '/api/jobboerse/jobsuche-service';

/**
 * Search for Ausbildung (apprenticeship) offers using full filters.
 */
export async function searchAusbildungen(
  filters: JobFilters,
  page = 1,
  size = 25
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    angebotsart: filters.angebotsart || '4', // Default to Ausbildung
    page: String(page),
    size: String(size),
  });

  // Basic filters
  if (filters.was?.trim()) params.set('was', filters.was.trim());
  if (filters.wo?.trim()) params.set('wo', filters.wo.trim());
  if (filters.umkreis) params.set('umkreis', filters.umkreis);
  
  // Specific API mappings
  if (filters.veroeffentlichtseit) params.set('veroeffentlichtseit', filters.veroeffentlichtseit);
  if (filters.befristung) params.set('befristung', filters.befristung);
  if (filters.berufsfeld) params.set('berufsfeld', filters.berufsfeld);
  if (filters.arbeitgeber?.trim()) params.set('arbeitgeber', filters.arbeitgeber.trim());
  if (filters.zeitarbeit) params.set('zeitarbeit', filters.zeitarbeit);
  if (filters.pav) params.set('pav', filters.pav);
  if (filters.behinderung) params.set('behinderung', filters.behinderung);

  // Array joined by semicolon
  if (filters.arbeitszeit && filters.arbeitszeit.length > 0) {
    params.set('arbeitszeit', filters.arbeitszeit.join(';'));
  }

  const res = await fetch(`${PROXY_BASE}/pc/v4/jobs?${params}`);

  if (!res.ok) {
    throw new Error(`Search failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Fetch the full job detail by refnr.
 * The /pc/v4/jobdetails/ endpoint expects a Base64-encoded refnr as the path.
 */
export async function fetchJobDetail(refnr: string): Promise<JobDetail> {
  const encoded = btoa(refnr);
  const res = await fetch(
    `${PROXY_BASE}/pc/v4/jobdetails/${encodeURIComponent(encoded)}`
  );

  if (!res.ok) {
    throw new Error(`Detail fetch failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Builds the employer logo URL from the kundennummerHash.
 * Uses the ag-darstellung-service via the Vite proxy.
 */
export function getLogoUrl(hash: string): string {
  return `/api/vermittlung/ag-darstellung-service/ct/v1/arbeitgeberlogo/${encodeURIComponent(hash)}`;
}

/**
 * Builds the public Arbeitsagentur job listing URL from a refnr.
 */
export function getJobUrl(refnr: string): string {
  return `https://www.arbeitsagentur.de/jobsuche/suche?id=${encodeURIComponent(refnr)}&angebotsart=4`;
}
