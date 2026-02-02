"use client";

/**
 * View-state store for per-section layout preset overrides.
 * Keyed by screenId + sectionKey; persisted to localStorage so refresh keeps selection.
 */

const STORAGE_KEY = "section-layout-preset-overrides";

export type OverridesMap = Record<string, Record<string, string>>;

/** Stable empty object so useSyncExternalStore doesn't see a new reference every render. */
const EMPTY_OVERRIDES: OverridesMap = {};

let overrides: OverridesMap = EMPTY_OVERRIDES;
let loaded = false;

function loadFromStorage(): OverridesMap {
  if (typeof window === "undefined") return EMPTY_OVERRIDES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_OVERRIDES;
    const parsed = JSON.parse(raw) as OverridesMap;
    return typeof parsed === "object" && parsed !== null ? parsed : EMPTY_OVERRIDES;
  } catch {
    return EMPTY_OVERRIDES;
  }
}

function saveToStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // ignore
  }
}

const listeners = new Set<() => void>();

export function getSectionLayoutPresetOverrides(): OverridesMap {
  if (typeof window !== "undefined" && !loaded) {
    loaded = true;
    const loadedMap = loadFromStorage();
    overrides = Object.keys(loadedMap).length > 0 ? loadedMap : EMPTY_OVERRIDES;
  }
  return overrides;
}

export function getSectionLayoutPresetOverride(screenId: string, sectionKey: string): string | undefined {
  const map = getSectionLayoutPresetOverrides();
  return map[screenId]?.[sectionKey];
}

export function setSectionLayoutPresetOverride(
  screenId: string,
  sectionKey: string,
  presetId: string
): void {
  const prev = getSectionLayoutPresetOverrides();
  overrides = {
    ...prev,
    [screenId]: {
      ...(prev[screenId] ?? {}),
      [sectionKey]: presetId,
    },
  };
  saveToStorage();
  listeners.forEach((l) => l());
}

/** Stable empty object for getOverridesForScreen so callers get same reference when no overrides. */
const EMPTY_SCREEN_OVERRIDES: Record<string, string> = {};

/**
 * Get overrides for a single screen (for passing to JsonRenderer / panel).
 */
export function getOverridesForScreen(screenId: string): Record<string, string> {
  const map = getSectionLayoutPresetOverrides();
  const screenOverrides = map[screenId];
  return screenOverrides != null && Object.keys(screenOverrides).length > 0 ? screenOverrides : EMPTY_SCREEN_OVERRIDES;
}

export function subscribeSectionLayoutPresetOverrides(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
