/**
 * Registry for screens that support Editor vs Preview mode.
 * Not hardcoded to one screen: rule-based + override lists for explicit inclusion/exclusion.
 */

/** Screen paths that are always editor-capable (e.g. explicit list for future screens). */
const ALWAYS_EDITOR_CAPABLE: string[] = [];

/** Screen paths (or substrings) that are never editor-capable (exclusion overrides). */
const NEVER_EDITOR_CAPABLE: string[] = [];

/**
 * Returns true if the given screen path supports editor mode (Editor / Preview toggle).
 * Rule: (live) TSX screens are capable; override lists allow explicit inclusion/exclusion.
 */
export function isEditorCapable(screenPath: string): boolean {
  if (!screenPath || typeof screenPath !== "string") return false;

  const normalized = screenPath.trim();
  if (NEVER_EDITOR_CAPABLE.some((x) => normalized.includes(x))) return false;
  if (ALWAYS_EDITOR_CAPABLE.some((x) => normalized.includes(x))) return true;

  const isLive = normalized.includes("(live)");
  const lower = normalized.toLowerCase();
  const isTsx =
    normalized.endsWith(".tsx") || lower.startsWith("tsx:");
  return isLive && isTsx;
}
