// ---- Search API response types (/v4/jobs) ----

export interface Koordinaten {
  lat: number;
  lon: number;
}

export interface JobFilters {
  was?: string;
  wo?: string;
  umkreis?: string;
  veroeffentlichtseit?: string;
  arbeitszeit?: string[];
  angebotsart?: string;
  befristung?: string;
  berufsfeld?: string;
  arbeitgeber?: string;
  zeitarbeit?: string;
  pav?: string;
  behinderung?: string;
  // Client-side sub-filter for angebotsart=4
  ausbildungsart?: string;
}

export interface Arbeitsort {
  ort: string;
  plz: string;
  strasse?: string;
  region: string;
  land: string;
  koordinaten?: Koordinaten;
}

export interface JobSearchItem {
  beruf: string;
  titel: string;
  refnr: string;
  arbeitsort: Arbeitsort;
  arbeitgeber: string;
  aktuelleVeroeffentlichungsdatum: string;
  modifikationsTimestamp: string;
  eintrittsdatum: string;
  kundennummerHash: string;
  ausbildungsart?: string;
  // Allow extra fields from the search response we haven't typed
  [key: string]: unknown;
}

export interface SearchResponse {
  stellenangebote: JobSearchItem[];
  maxErgebnisse: number;
  page: number;
  size: number;
}

// ---- Detail API response types (/v4/jobdetails) ----

export interface DetailAdresse {
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  ort?: string;
  region?: string;
  land?: string;
}

export interface Stellenlokation {
  adresse?: DetailAdresse;
  breite?: number;
  laenge?: number;
}

export interface Eintrittszeitraum {
  von?: string;
  bis?: string;
}

export interface Veroeffentlichungszeitraum {
  von?: string;
  bis?: string;
}

/**
 * Full job detail returned by /pc/v4/jobdetails/{base64(refnr)}.
 * Uses an index signature so unknown/new fields are never lost.
 */
export interface JobDetail {
  // Core
  stellenangebotsart?: string;
  ausbildungsart?: string;
  stellenangebotsTitel?: string;
  stellenangebotsBeschreibung?: string;   // Markdown!
  hauptberuf?: string;
  referenznummer?: string;

  // Employer
  firma?: string;
  arbeitgeberKundennummerHash?: string;
  allianzpartnerUrl?: string;
  allianzpartnerName?: string;

  // Locations
  stellenlokationen?: Stellenlokation[];

  // Education & Skills
  geforderterBildungsabschluss?: string;

  // Dates
  eintrittszeitraum?: Eintrittszeitraum;
  veroeffentlichungszeitraum?: Veroeffentlichungszeitraum;
  datumErsteVeroeffentlichung?: string;
  aenderungsdatum?: string;

  // Working conditions
  arbeitszeitVollzeit?: boolean;
  arbeitszeitTeilzeitVormittag?: boolean;
  arbeitszeitTeilzeitNachmittag?: boolean;
  arbeitszeitTeilzeitAbend?: boolean;
  arbeitszeitTeilzeitFlexibel?: boolean;
  arbeitszeitHeimarbeitTelearbeit?: boolean;
  arbeitszeitSchichtNachtWochenende?: boolean;

  // Compensation
  verguetungsangabe?: string;
  ausbildungsverguetungJahr1?: number;
  ausbildungsverguetungJahr2?: number;
  ausbildungsverguetungJahr3?: number;
  ausbildungsverguetungJahr4?: number;

  // Contract
  vertragsdauer?: string;

  // Flags
  istGeringfuegigeBeschaeftigung?: boolean;
  istBehinderungGefordert?: boolean;
  istBetreut?: boolean;

  // Catch-all for unknown fields
  [key: string]: unknown;
}
