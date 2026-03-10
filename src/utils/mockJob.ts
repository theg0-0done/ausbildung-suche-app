import type { JobSearchItem } from "../types";

/**
 * Builds a mock JobSearchItem from stored favorite/history data.
 * Used by FavoritesPage and HistoryPage to pass saved items to JobCard.
 */
export function buildMockJob(item: {
  refnr: string;
  title?: string;
  employer?: string;
  location?: string;
  saved_at?: string;
  viewed_at?: string;
}): JobSearchItem {
  return {
    refnr: item.refnr,
    titel: item.title || "",
    arbeitgeber: item.employer || "",
    arbeitsort: {
      plz: "",
      ort: item.location || "",
      region: "",
      land: "",
    },
    aktuelleVeroeffentlichungsdatum: item.saved_at || item.viewed_at || "",
  } as unknown as JobSearchItem;
}
