import { normalizeDeckAppKey } from "@/lib/deck-platform/legacy-app-keys";

/** Public hostname only (no port), lowercased. */
export function publicHostnameFromHeaders(headers: Headers): string {
  const forwarded =
    headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    headers.get("x-vercel-forwarded-host")?.split(",")[0]?.trim() ??
    "";
  const host = (forwarded || headers.get("host") || "").split(":")[0]?.toLowerCase() ?? "";
  return host;
}

function parseCommaHosts(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

/**
 * Product / Learn-system hosts where the legacy screen runtime (`/api/screens`, `loadScreen`, etc.)
 * must never run. Add hostnames here when you add new domains; optionally extend via env (see .env.example).
 */
export const LEGACY_RUNTIME_DISABLED_EXACT_HOSTS: readonly string[] = [
  "business.hiclarify.com",
  "home.hiclarify.com",
] as const;

/**
 * True when this hostname must not use the legacy domain/screen pipeline (API or client loaders).
 * Includes every `learn.*` host and entries in {@link LEGACY_RUNTIME_DISABLED_EXACT_HOSTS} plus env lists.
 */
export function isLegacyRuntimeDisabledHostname(hostname: string): boolean {
  const h = hostname.split(":")[0]?.toLowerCase() ?? "";
  if (h.startsWith("learn.")) return true;
  for (const entry of LEGACY_RUNTIME_DISABLED_EXACT_HOSTS) {
    if (entry.toLowerCase() === h) return true;
  }
  for (const entry of parseCommaHosts(
    typeof process !== "undefined" ? process.env.LEGACY_RUNTIME_DISABLED_HOSTS : undefined
  )) {
    if (entry === h) return true;
  }
  for (const entry of parseCommaHosts(
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_LEGACY_RUNTIME_DISABLED_HOSTS : undefined
  )) {
    if (entry === h) return true;
  }
  return false;
}

export function isLegacyRuntimeDisabledFromHeaders(headers: Headers): boolean {
  return isLegacyRuntimeDisabledHostname(publicHostnameFromHeaders(headers));
}

/** Browser: legacy runtime must not run (same policy as server). */
export function isLegacyRuntimeDisabledClient(): boolean {
  if (typeof window === "undefined") return false;
  return isLegacyRuntimeDisabledHostname(window.location.hostname);
}

export function isLearnPublicHostFromHeaders(headers: Headers): boolean {
  return publicHostnameFromHeaders(headers).startsWith("learn.");
}

/** Client-only: host is `learn.*` (used for learn URL rewrites / minimal shell tied to learn public URLs). */
export function isLearnPublicHostClient(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname.split(":")[0]?.toLowerCase().startsWith("learn.") ?? false;
}

/**
 * True when `pathname` is the compatibility URL for filesystem Learn decks:
 * `GET /api/screens/<appKey>/learn/<flowKey>/<version>.json`
 * (legacy callers use this shape; payload is served from deck-platform SSOT, not `(dead) Json`).
 */
export function isLearnDeckScreensApiPathname(pathname: string): boolean {
  if (!pathname.startsWith("/api/screens/")) return false;
  const rest = pathname.slice("/api/screens/".length);
  return isLearnDeckScreensRelativePath(rest);
}

/**
 * Relative path after `/api/screens/` (e.g. `hiclarify/learn/track-1/v1.json`).
 */
export function isLearnDeckScreensRelativePath(path: string): boolean {
  const p = path.replace(/^\/+/, "").toLowerCase();
  const parts = p.split("/").filter(Boolean);
  if (parts.length !== 4) return false;
  if (parts[1] !== "learn") return false;
  if (!parts[3].endsWith(".json")) return false;
  const app = parts[0];
  const flow = parts[2];
  const ver = parts[3].slice(0, -".json".length);
  if (!app || !flow || !ver) return false;
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(app)) return false;
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(flow)) return false;
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(ver)) return false;
  return true;
}

/** Same path normalization as `safeImportJson` / `loadScreen` before `/api/screens/...` fetch. */
export function isLearnDeckJsonLoaderPath(rawPath: string): boolean {
  let p = rawPath;
  try {
    p = decodeURIComponent(rawPath);
  } catch {
    p = rawPath;
  }
  const normalized = p
    .replace(/^\/+/, "")
    .replace(/^src\//, "")
    .replace(/^apps-json\/apps\//, "")
    .replace(/^apps-json\//, "")
    .replace(/^apps\//, "");
  const withJson = /\.json$/i.test(normalized) ? normalized : `${normalized}.json`;
  return isLearnDeckScreensRelativePath(withJson);
}

/** Map browser URL on a `learn.*` host to canonical `/learn/...` (matches middleware segment rules). */
export function buildLearnPublicRedirectPathFromWindow(): string | null {
  if (typeof window === "undefined") return null;
  const h = window.location.hostname.split(":")[0]?.toLowerCase() ?? "";
  if (!h.startsWith("learn.")) return null;
  const hostParts = h.split(".");
  const rawApp = hostParts.length >= 3 && hostParts[0] === "learn" ? hostParts[1] ?? "" : "";
  const appKey = normalizeDeckAppKey(rawApp);
  if (!appKey) return "/learn";
  const segs = window.location.pathname.split("/").filter(Boolean);
  const q = window.location.search;
  if (segs.length >= 2) {
    return `/learn/${encodeURIComponent(appKey)}/${encodeURIComponent(segs[0])}/${encodeURIComponent(segs[1])}${q}`;
  }
  if (segs.length === 1) {
    return `/learn/${encodeURIComponent(appKey)}/${encodeURIComponent(segs[0])}${q}`;
  }
  return `/learn/${encodeURIComponent(appKey)}${q}`;
}
