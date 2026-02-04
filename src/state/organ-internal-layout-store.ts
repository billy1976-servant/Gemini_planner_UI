"use client";

/**
 * View-state store for per-section organ internal layout (variant) overrides.
 * Dev/testing only: sectionKey -> internalLayoutId (e.g. hero -> "split-left").
 * Keyed by screenId + sectionKey; persisted to localStorage.
 * Do not mix with section layout dropdown in UI.
 */

const STORAGE_KEY = "organ-internal-layout-overrides";

export type OverridesMap = Record<string, Record<string, string>>;

const EMPTY_OVERRIDES: OverridesMap = {};
const EMPTY_SCREEN_OVERRIDES: Record<string, string> = {};

let state: OverridesMap = EMPTY_OVERRIDES;
let loaded = false;
const listeners = new Set<() => void>();

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

function saveToStorage(data: OverridesMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function ensureLoaded() {
  if (typeof window !== "undefined" && !loaded) {
    loaded = true;
    const loadedData = loadFromStorage();
    state = Object.keys(loadedData).length > 0 ? loadedData : EMPTY_OVERRIDES;
  }
}

export function getOrganInternalLayoutOverrides(): OverridesMap {
  ensureLoaded();
  return state;
}

export function getOrganInternalLayoutOverride(screenId: string, sectionKey: string): string | undefined {
  const map = getOrganInternalLayoutOverrides();
  return map[screenId]?.[sectionKey];
}

export function setOrganInternalLayoutOverride(
  screenId: string,
  sectionKey: string,
  internalLayoutId: string
): void {
  const prev = getOrganInternalLayoutOverrides();
  state = {
    ...prev,
    [screenId]: {
      ...(prev[screenId] ?? {}),
      [sectionKey]: internalLayoutId,
    },
  };
  saveToStorage(state);
  listeners.forEach((l) => l());
}

export function getOrganInternalLayoutOverridesForScreen(screenId: string): Record<string, string> {
  const map = getOrganInternalLayoutOverrides();
  const screenOverrides = map[screenId];
  return screenOverrides != null && Object.keys(screenOverrides).length > 0 ? screenOverrides : EMPTY_SCREEN_OVERRIDES;
}

export function subscribeOrganInternalLayoutOverrides(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
