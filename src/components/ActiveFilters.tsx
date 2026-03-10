import type { JobFilters } from "../types";
import {
  ANGEBOTSART_MAP,
  ARBEITSZEIT_MAP,
  VEROEFFENTLICHT_MAP,
} from "../constants/filters";

interface ActiveFiltersProps {
  filters: JobFilters;
  onRemove: (key: keyof JobFilters, value?: string) => void;
}

export default function ActiveFilters({
  filters,
  onRemove,
}: ActiveFiltersProps) {
  const chips: { key: keyof JobFilters; label: string; value?: string }[] = [];

  if (filters.was) chips.push({ key: "was", label: `Was: ${filters.was}` });
  if (filters.wo) chips.push({ key: "wo", label: `Wo: ${filters.wo}` });
  if (filters.umkreis)
    chips.push({ key: "umkreis", label: `+ ${filters.umkreis} km` });

  if (filters.angebotsart && filters.angebotsart !== "4") {
    chips.push({
      key: "angebotsart",
      label: ANGEBOTSART_MAP[filters.angebotsart] || "Angebotsart",
    });
  }

  if (filters.ausbildungsart) {
    chips.push({ key: "ausbildungsart", label: filters.ausbildungsart });
  }

  if (filters.veroeffentlichtseit) {
    chips.push({
      key: "veroeffentlichtseit",
      label: VEROEFFENTLICHT_MAP[filters.veroeffentlichtseit] || "Datum",
    });
  }

  if (filters.arbeitszeit && filters.arbeitszeit.length > 0) {
    filters.arbeitszeit.forEach((az) => {
      chips.push({
        key: "arbeitszeit",
        value: az,
        label: ARBEITSZEIT_MAP[az] || az,
      });
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="active-filters-container">
      <div className="active-filters-list">
        {chips.map((chip, idx) => (
          <button
            key={`${chip.key}-${chip.value || ""}-${idx}`}
            className="filter-chip"
            onClick={() => onRemove(chip.key, chip.value)}
            title="Filter entfernen"
            type="button"
          >
            {chip.label}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
