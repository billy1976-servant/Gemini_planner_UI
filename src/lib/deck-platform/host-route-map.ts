import { loadCatalog } from "./registry";

/**
 * Canonical in-app path for a deck (Phase 4). Optional `schema` becomes `?schema=`.
 */
export function buildLearnPath(appKey: string, flowKey: string, versionKey: string, schema?: string | null): string {
  const base = `/learn/${encodeURIComponent(appKey)}/${encodeURIComponent(flowKey)}/${encodeURIComponent(versionKey)}`;
  if (schema != null && String(schema).trim() !== "") {
    return `${base}?schema=${encodeURIComponent(String(schema).trim())}`;
  }
  return base;
}

function normalizePath(p: string): string {
  if (!p || p === "/") return "/";
  return p.endsWith("/") ? p.slice(0, -1) || "/" : p;
}

/**
 * Match `Host` + pathname (e.g. from a request) to a canonical `/learn/...` path using file-driven conventions:
 * - host: `learn.<appKey>.com`
 * - path: `/<flow>` (default version) or `/<flow>/<version>`
 * Node/server only (uses `loadCatalog`).
 */
export function resolvePublicUrlToLearnPath(hostHeader: string, pathname: string): string | null {
  const host = hostHeader.split(":")[0].toLowerCase();
  const pathNorm = normalizePath(pathname).replace(/^\/+/, "");
  const parts = pathNorm === "" ? [] : pathNorm.split("/");
  if (parts.length === 0 || parts.length > 2) return null;
  const flowKey = decodeURIComponent(parts[0] ?? "").trim();
  if (!flowKey) return null;
  const requestedVersion = parts.length === 2 ? decodeURIComponent(parts[1] ?? "").trim() : null;

  for (const entry of loadCatalog()) {
    if (entry.deckRef.flowKey !== flowKey) continue;
    const expectedHost = `learn.${entry.deckRef.appKey}.com`;
    if (host !== expectedHost) continue;
    if (requestedVersion == null) {
      return buildLearnPath(entry.deckRef.appKey, entry.deckRef.flowKey, entry.deckRef.defaultVersion);
    }
    if (!entry.availableVersions.includes(requestedVersion)) continue;
    return buildLearnPath(entry.deckRef.appKey, entry.deckRef.flowKey, requestedVersion);
  }
  return null;
}
