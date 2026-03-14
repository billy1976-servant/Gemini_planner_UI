/**
 * Domain routing config: subdomain → 01_App folder name.
 * Only folders under src/01_App that pass domain rules are included:
 * - No parentheses in name, no leading _, no leading "dead".
 */
export const SUBDOMAIN_TO_FOLDER: Record<string, string> = {
  christian: "Christian",
  business: "Business",
  plan: "Plan",
  protect: "Protect",
  research: "Research",
  learn: "Learn",
} as const;

export type DomainKey = keyof typeof SUBDOMAIN_TO_FOLDER;

/** Base host for subdomain routing (e.g. hiclarify.com). */
export const DOMAIN_BASE_HOST = "hiclarify.com";

/** Check if host is a known subdomain and return the subdomain key, or null. */
export function getSubdomainFromHost(host: string): string | null {
  const hostname = host.includes(":") ? host.slice(0, host.indexOf(":")) : host;
  const normalized = hostname.replace(/^www\./, "").toLowerCase();
  if (normalized.endsWith(`.${DOMAIN_BASE_HOST}`)) {
    const parts = normalized.slice(0, -DOMAIN_BASE_HOST.length - 1).split(".");
    const sub = parts[parts.length - 1];
    if (sub && SUBDOMAIN_TO_FOLDER[sub]) return sub;
  }
  // Local dev: christian.localhost → christian
  if (normalized.endsWith(".localhost")) {
    const sub = normalized.slice(0, -".localhost".length).split(".").pop();
    if (sub && SUBDOMAIN_TO_FOLDER[sub]) return sub;
  }
  if (normalized === "localhost" || normalized.startsWith("127.0.0.1")) return null;
  return null;
}

/** Get folder name for a subdomain key (e.g. christian → Christian). */
export function getFolderForSubdomain(subdomain: string): string | null {
  return SUBDOMAIN_TO_FOLDER[subdomain.toLowerCase()] ?? null;
}

/**
 * Prayer app base path (domain-agnostic). Use for all links and navigation.
 * Domain is determined by the subdomain (e.g. christian.hiclarify.com); paths are always /prayer, /prayer/admin, etc.
 */
export function getPrayerBasePathForHost(_host?: string): string {
  return "/prayer";
}
