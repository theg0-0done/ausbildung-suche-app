/**
 * Shared filter option maps used by FilterSidebar and ActiveFilters.
 * Single source of truth for filter labels.
 */

export const ANGEBOTSART_OPTIONS = [
  { value: "1", label: "Arbeit" },
  { value: "2", label: "Selbständigkeit" },
  { value: "4", label: "Ausbildung / Duales Studium" },
  { value: "34", label: "Praktikum / Trainee" },
] as const;

export const ARBEITSZEIT_OPTIONS = [
  { value: "vz", label: "Vollzeit" },
  { value: "tz", label: "Teilzeit" },
  { value: "snw", label: "Schicht / Nacht / Wochenende" },
  { value: "ho", label: "Heim- / Telearbeit" },
  { value: "mj", label: "Minijob" },
] as const;

export const VEROEFFENTLICHT_OPTIONS = [
  { value: "", label: "Beliebig" },
  { value: "1", label: "Seit 24 Stunden" },
  { value: "7", label: "Seit 7 Tagen" },
  { value: "30", label: "Seit 30 Tagen" },
] as const;

/** Lookup maps built from the options above */
export const ANGEBOTSART_MAP: Record<string, string> = Object.fromEntries(
  ANGEBOTSART_OPTIONS.map((o) => [o.value, o.label]),
);

export const ARBEITSZEIT_MAP: Record<string, string> = Object.fromEntries(
  ARBEITSZEIT_OPTIONS.map((o) => [o.value, o.label]),
);

export const VEROEFFENTLICHT_MAP: Record<string, string> = Object.fromEntries(
  VEROEFFENTLICHT_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label]),
);
