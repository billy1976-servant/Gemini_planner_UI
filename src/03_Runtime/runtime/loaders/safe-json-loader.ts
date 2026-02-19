/**
 * Safe JSON screen loader — no filesystem/require.context dependency.
 * JSON apps folder (apps-json/apps) removed; loader returns null for all paths.
 * Callers handle null; TSX screens are resolved via API and apps-tsx.
 */

/** No registry; no scanning. */
const appsRegistry: Record<string, unknown> = {};

/**
 * Load a screen JSON by path (no-op: no apps-json/apps at runtime).
 * @returns null always — JSON screens are not loaded from filesystem.
 */
export function loadScreenJson(_relativePath: string): unknown | null {
  return appsRegistry[_relativePath] ?? null;
}
