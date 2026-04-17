/**
 * Deprecated `appKey` values from pre-normalization manifests / bookmarks.
 * Incoming API and URL params are mapped to current brand keys before catalog lookup.
 */
const DEPRECATED_APP_KEY_ALIASES: Record<string, string> = {
  "container-creations": "containercreations",
  "gospel-discipleship": "hiclarify",
};

export function normalizeDeckAppKey(appKey: string): string {
  const t = appKey.trim().toLowerCase();
  return DEPRECATED_APP_KEY_ALIASES[t] ?? t;
}
