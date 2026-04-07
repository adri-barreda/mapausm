"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";

interface MapContextValue {
  selectedUSM: string | null;
  setSelectedUSM: (id: string | null) => void;
  flyToMunicipality: (name: string) => void;
  registerFlyTo: (fn: (name: string) => void) => void;
}

const MapContext = createContext<MapContextValue | null>(null);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [selectedUSM, setSelectedUSM] = useState<string | null>(null);
  const flyToRef = useRef<((name: string) => void) | null>(null);

  const registerFlyTo = useCallback((fn: (name: string) => void) => {
    flyToRef.current = fn;
  }, []);

  const flyToMunicipality = useCallback((name: string) => {
    flyToRef.current?.(name);
  }, []);

  return (
    <MapContext.Provider
      value={{ selectedUSM, setSelectedUSM, flyToMunicipality, registerFlyTo }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMapContext must be used within MapProvider");
  return ctx;
}
