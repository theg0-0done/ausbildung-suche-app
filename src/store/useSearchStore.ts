import { create } from "zustand";
import type { JobFilters } from "../types";

interface SearchState {
  filters: JobFilters;
  setFilters: (filters: JobFilters) => void;
  updateFilter: (
    key: keyof JobFilters,
    value: JobFilters[keyof JobFilters],
  ) => void;
  removeFilter: (key: keyof JobFilters, value?: string) => void;
  clearFilters: () => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

const defaultFilters: JobFilters = {};

export const useSearchStore = create<SearchState>((set) => ({
  filters: defaultFilters,

  setFilters: (newFilters) => set({ filters: newFilters }),

  updateFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  removeFilter: (key, value) =>
    set((state) => {
      const updated = { ...state.filters };
      if (
        key === "arbeitszeit" &&
        value &&
        Array.isArray(updated.arbeitszeit)
      ) {
        updated.arbeitszeit = updated.arbeitszeit.filter(
          (v: string) => v !== value,
        );
        if (updated.arbeitszeit.length === 0) {
          delete updated.arbeitszeit;
        }
      } else {
        delete updated[key];
        if (key === "angebotsart") {
          delete updated.ausbildungsart;
        }
      }
      return { filters: updated };
    }),

  clearFilters: () => set({ filters: defaultFilters }),

  isSidebarOpen: false,
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}));
