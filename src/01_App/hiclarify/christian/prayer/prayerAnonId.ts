/**
 * Anonymous participant ID for prayer room when auth is disabled for testing.
 * Persists in sessionStorage so the same tab keeps the same identity for create/join/token.
 */

const STORAGE_KEY = "prayer-anon-id";

export function getPrayerAnonId(): string {
  if (typeof window === "undefined") return `anon-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  let id = sessionStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
