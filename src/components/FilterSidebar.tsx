import { useState } from "react";
import type { JobFilters } from "../types";
import {
  ANGEBOTSART_OPTIONS,
  ARBEITSZEIT_OPTIONS,
  VEROEFFENTLICHT_OPTIONS,
} from "../constants/filters";

interface FilterSidebarProps {
  filters: JobFilters;
  onChange: (filters: JobFilters) => void;
  onReset: () => void;
  isOpen: boolean;
  onClose: () => void;
  totalResults: number;
}

function Accordion({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={`filter-accordion ${isOpen ? "open" : ""}`}>
      <button
        type="button"
        className="filter-accordion-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && <div className="filter-accordion-body">{children}</div>}
    </div>
  );
}

export default function FilterSidebar({
  filters,
  onChange,
  onReset,
  isOpen,
  onClose,
  totalResults,
}: FilterSidebarProps) {
  const handleArbeitszeitToggle = (value: string) => {
    const current = filters.arbeitszeit || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, arbeitszeit: updated });
  };

  const handleSimpleChange = (key: keyof JobFilters, value: string) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`filter-backdrop ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />

      <aside className={`filter-sidebar ${isOpen ? "open" : ""}`}>
        <div className="filter-sidebar-header">
          <h3>Filter</h3>
          <button
            className="close-filters-btn"
            onClick={onClose}
            aria-label="Filter schließen"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="filter-sidebar-content">
          <Accordion title="Angebotsart">
            <div className="filter-options">
              {ANGEBOTSART_OPTIONS.map((opt) => (
                <label key={opt.value} className="filter-radio">
                  <input
                    type="radio"
                    name="angebotsart"
                    value={opt.value}
                    checked={(filters.angebotsart || "4") === opt.value}
                    onChange={(e) => {
                      const newAngebotsart = e.target.value;
                      if (newAngebotsart !== "4") {
                        onChange({
                          ...filters,
                          angebotsart: newAngebotsart,
                          ausbildungsart: undefined,
                        });
                      } else {
                        onChange({ ...filters, angebotsart: newAngebotsart });
                      }
                    }}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </Accordion>

          <Accordion title="Veröffentlicht seit">
            <div className="filter-options">
              {VEROEFFENTLICHT_OPTIONS.map((opt) => (
                <label key={opt.value} className="filter-radio">
                  <input
                    type="radio"
                    name="veroeffentlichtseit"
                    value={opt.value}
                    checked={(filters.veroeffentlichtseit || "") === opt.value}
                    onChange={(e) =>
                      handleSimpleChange("veroeffentlichtseit", e.target.value)
                    }
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </Accordion>

          <Accordion title="Arbeitszeit">
            <div className="filter-options">
              {ARBEITSZEIT_OPTIONS.map((opt) => (
                <label key={opt.value} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={(filters.arbeitszeit || []).includes(opt.value)}
                    onChange={() => handleArbeitszeitToggle(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </Accordion>

          <Accordion title="Ort & Umkreis" defaultOpen={false}>
            <div className="filter-field">
              <label>Umkreis (km)</label>
              <select
                value={filters.umkreis || ""}
                onChange={(e) => handleSimpleChange("umkreis", e.target.value)}
                className="filter-select"
              >
                <option value="">Ganz Deutschland</option>
                <option value="10">10 km</option>
                <option value="20">20 km</option>
                <option value="50">50 km</option>
                <option value="100">100 km</option>
                <option value="200">200 km</option>
              </select>
            </div>
            <p className="filter-hint">Nutze das WO-Feld oben für den Ort.</p>
          </Accordion>
        </div>

        <div className="filter-sidebar-footer">
          <button className="filter-reset-btn" onClick={onReset}>
            Zurücksetzen
          </button>
          <button className="filter-apply-btn" onClick={onClose}>
            {totalResults} Ergebnisse anzeigen
          </button>
        </div>
      </aside>
    </>
  );
}
