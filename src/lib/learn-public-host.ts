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
 * Map browser URL on a learn host to a canonical `/learn/...` path (matches middleware segment rules).
 */
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
