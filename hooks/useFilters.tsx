import React, { createContext, useContext, useState, ReactNode } from "react";
import { ToiletFilters, DEFAULT_FILTERS } from "../types";

interface FilterContextValue {
  filters: ToiletFilters;
  setFilters: (filters: ToiletFilters) => void;
  resetFilters: () => void;
  activeCount: number;
}

const FilterContext = createContext<FilterContextValue | null>(null);

function countActive(filters: ToiletFilters): number {
  let n = 0;
  if (filters.feeMode !== "all") n++;
  if (filters.hoursMode !== "all") n++;
  if (filters.insideTicketGate) n++;
  if (filters.hasParking) n++;
  n += Object.values(filters.facilities).filter(Boolean).length;
  return n;
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<ToiletFilters>(DEFAULT_FILTERS);

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilters,
        resetFilters: () => setFilters(DEFAULT_FILTERS),
        activeCount: countActive(filters),
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used within FilterProvider");
  return ctx;
}
