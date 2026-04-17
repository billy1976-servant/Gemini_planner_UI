/**
 * Client-safe helpers for the learn launcher (no Node `fs` / server-only imports).
 */

/** flowKey segment: lowercase, digits, hyphens; must match learn flow folder name. */
const SAFE_FLOW_KEY = /^[a-z0-9][a-z0-9-]{0,62}$/;

export function isSafeLearnFlowKey(flowKey: string): boolean {
  const t = flowKey.trim();
  return t.length > 0 && t === flowKey.trim() && SAFE_FLOW_KEY.test(t);
}

/**
 * Normalize a typed or stored version id to the bare stem (no `.json`).
 * Catalog keys, routes, and API `versionKey` use this stem; on disk the file is `<stem>.json`.
 */
export function stripLearnVersionStemInput(raw: string): string {
  return String(raw ?? "").trim().replace(/\.json$/i, "");
}

/**
 * UI label for a learn version file: `{stem}.json` (matches on-disk name).
 */
export function learnDeckVersionDisplayLabel(stemOrLabel: string): string {
  const stem = stripLearnVersionStemInput(stemOrLabel);
  if (!stem) return "";
  return `${stem}.json`;
}

