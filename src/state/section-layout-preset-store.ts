"use client";

/**
 * View-state store for per-section layout preset overrides.
 * Two independent maps:
 * - sectionLayoutPresetOverrides: section container layout (hero split, full width, etc.)
 * - cardLayoutPresetOverrides: card internal layout (image left, image top, etc.)
 * Keyed by screenId + sectionKey; persisted to localStorage so refresh keeps selection.
 */

const SECTION_STORAGE_KEY = "section-layout-preset-overrides";
const CARD_STORAGE_KEY = "card-layout-preset-overrides";

export type OverridesMap = Record<string, Record<string, string>>;

/** Stable empty object so useSyncExternalStore doesn't see a new reference every render. */
const EMPTY_OVERRIDES: OverridesMap = {};

let sectionOverrides: OverridesMap = EMPTY_OVERRIDES;
let cardOverrides: OverridesMap = EMPTY_OVERRIDES;
let loaded = false;

function loadFromStorage(key: string): OverridesMap {
  if (typeof window === "undefined") return EMPTY_OVERRIDES;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return EMPTY_OVERRIDES;
    const parsed = JSON.parse(raw) as OverridesMap;
    return typeof parsed === "object" && parsed !== null ? parsed : EMPTY_OVERRIDES;
  } catch {
    return EMPTY_OVERRIDES;
  }
}

function saveToStorage(key: string, data: OverridesMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

const listeners = new Set<() => void>();

function ensureLoaded() {
  if (typeof window !== "undefined" && !loaded) {
    loaded = true;
    const loadedSection = loadFromStorage(SECTION_STORAGE_KEY);
    const loadedCard = loadFromStorage(CARD_STORAGE_KEY);
    sectionOverrides = Object.keys(loadedSection).length > 0 ? loadedSection : EMPTY_OVERRIDES;
    cardOverrides = Object.keys(loadedCard).length > 0 ? loadedCard : EMPTY_OVERRIDES;
  }
}

export function getSectionLayoutPresetOverrides(): OverridesMap {
  ensureLoaded();
  return sectionOverrides;
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
  sectionOverrides = {
    ...prev,
    [screenId]: {
      ...(prev[screenId] ?? {}),
      [sectionKey]: presetId,
    },
  };
  saveToStorage(SECTION_STORAGE_KEY, sectionOverrides);
  listeners.forEach((l) => l());
}

/** Stable empty object for getOverridesForScreen so callers get same reference when no overrides. */
const EMPTY_SCREEN_OVERRIDES: Record<string, string> = {};

/**
 * Get section layout overrides for a single screen (for passing to JsonRenderer / panel).
 */
export function getOverridesForScreen(screenId: string): Record<string, string> {
  const map = getSectionLayoutPresetOverrides();
  const screenOverrides = map[screenId];
  return screenOverrides != null && Object.keys(screenOverrides).length > 0 ? screenOverrides : EMPTY_SCREEN_OVERRIDES;
}

/** Card layout overrides: sectionKey -> cardPresetId per screen. */
export function getCardLayoutPresetOverrides(): OverridesMap {
  ensureLoaded();
  return cardOverrides;
}

export function getCardLayoutPresetOverride(screenId: string, sectionKey: string): string | undefined {
  const map = getCardLayoutPresetOverrides();
  return map[screenId]?.[sectionKey];
}

export function setCardLayoutPresetOverride(
  screenId: string,
  sectionKey: string,
  presetId: string
): void {
  const prev = getCardLayoutPresetOverrides();
  cardOverrides = {
    ...prev,
    [screenId]: {
      ...(prev[screenId] ?? {}),
      [sectionKey]: presetId,
    },
  };
  saveToStorage(CARD_STORAGE_KEY, cardOverrides);
  listeners.forEach((l) => l());
}

/**
 * Get card layout overrides for a single screen (for passing to JsonRenderer / panel).
 */
export function getCardOverridesForScreen(screenId: string): Record<string, string> {
  const map = getCardLayoutPresetOverrides();
  const screenOverrides = map[screenId];
  return screenOverrides != null && Object.keys(screenOverrides).length > 0 ? screenOverrides : EMPTY_SCREEN_OVERRIDES;
}

export function subscribeSectionLayoutPresetOverrides(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Same listener set as section — both section and card changes trigger re-renders. */
export const subscribeCardLayoutPresetOverrides = subscribeSectionLayoutPresetOverrides;
