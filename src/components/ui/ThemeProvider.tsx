"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { PaletteId, PrayerPalette } from "@/lib/ui/palette";
import { palettes, DEFAULT_PALETTE_ID } from "@/lib/ui/palette";

const STORAGE_KEY = "prayer-palette-id";

function getStoredPaletteId(): PaletteId {
  if (typeof window === "undefined") return DEFAULT_PALETTE_ID;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && (raw === "dark" || raw === "light" || raw === "church")) return raw;
  } catch {
    // ignore
  }
  return DEFAULT_PALETTE_ID;
}

interface ThemeContextValue {
  palette: PrayerPalette;
  paletteId: PaletteId;
  setPaletteId: (id: PaletteId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function usePalette(): PrayerPalette {
  return useTheme().palette;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultPaletteId?: PaletteId;
}

export function ThemeProvider({ children, defaultPaletteId }: ThemeProviderProps) {
  const [paletteId, setPaletteIdState] = useState<PaletteId>(() =>
    defaultPaletteId ?? getStoredPaletteId()
  );

  const setPaletteId = useCallback((id: PaletteId) => {
    setPaletteIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      palette: palettes[paletteId],
      paletteId,
      setPaletteId,
    }),
    [paletteId, setPaletteId]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
