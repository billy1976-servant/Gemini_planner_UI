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

const DOMAIN_TRACE =
  (typeof process !== "undefined" && process.env?.NODE_ENV === "development") ||
  (typeof window !== "undefined" && (window as any).__DOMAIN_RESOLVE_TRACE__ === true);

function trace(msg: string, data?: object) {
  if (DOMAIN_TRACE && typeof console !== "undefined" && console.log) {
    console.log("[domain-resolve]", msg, data ?? "");
  }
}

/** Check if host is a known subdomain and return the subdomain key, or null. */
export function getSubdomainFromHost(host: string): string | null {
  const hostname = host.includes(":") ? host.slice(0, host.indexOf(":")) : host;
  const normalized = hostname.replace(/^www\./, "").toLowerCase();
  trace("getSubdomainFromHost: host parse", { host, hostname, normalized });

  if (normalized.endsWith(`.${DOMAIN_BASE_HOST}`)) {
    const parts = normalized.slice(0, -DOMAIN_BASE_HOST.length - 1).split(".");
    const sub = parts[parts.length - 1];
    if (sub && SUBDOMAIN_TO_FOLDER[sub]) {
      trace("getSubdomainFromHost: match .hiclarify.com", { sub, folder: SUBDOMAIN_TO_FOLDER[sub] });
      return sub;
    }
    trace("getSubdomainFromHost: FALLBACK — .hiclarify.com but sub not in SUBDOMAIN_TO_FOLDER", { sub });
    return null;
  }
  if (normalized.endsWith(".localhost")) {
    const sub = normalized.slice(0, -".localhost".length).split(".").pop();
    if (sub && SUBDOMAIN_TO_FOLDER[sub]) {
      trace("getSubdomainFromHost: match .localhost", { sub });
      return sub;
    }
    trace("getSubdomainFromHost: FALLBACK — .localhost but sub not in SUBDOMAIN_TO_FOLDER", { sub });
    return null;
  }
  if (normalized === "localhost" || normalized.startsWith("127.0.0.1")) {
    trace("getSubdomainFromHost: return null (localhost/127 — no subdomain)");
    return null;
  }
  trace("getSubdomainFromHost: return null (no match for base host or localhost)");
  return null;
}

/**
 * Return the path segment to use for domain routing (rewrite target).
 * - *.hiclarify.com / *.localhost → subdomain only (e.g. "christian")
 * - *containercreations* → full host (e.g. "learn.containercreations.com") so getResolvedPath can map to Domain/Subdomain/Route
 */
export function getDomainSegmentForHost(host: string | null): string | null {
  if (!host) return null;

  const normalized = host.toLowerCase();

  // STRIP PORT
  const cleanHost = normalized.split(":")[0];

  // HANDLE VERCEL + CUSTOM DOMAINS
  if (cleanHost.includes("containercreations")) {
    return cleanHost;
  }

  if (cleanHost.includes("hiclarify")) {
    return cleanHost;
  }

  return null;
}

/**
 * Parse domain into subdomain and root.
 * Example: "learn.containercreations.com" → { subdomain: "learn", root: "containercreations.com" }
 * Single segment (e.g. "christian" from path rewrite) → { subdomain: "christian", root: "hiclarify.com" }
 */
function parseDomainParts(domain: string): { subdomain: string; root: string } {
  const normalized = domain.toLowerCase().trim();
  if (!normalized) return { subdomain: "", root: "" };
  if (normalized.includes(".")) {
    const parts = normalized.split(".");
    const subdomain = parts[0] ?? "";
    const root = parts.length >= 2 ? parts.slice(-2).join(".") : "";
    return { subdomain, root };
  }
  // Path-only segment (e.g. from hiclarify rewrite): treat as subdomain with implied hiclarify root
  return { subdomain: normalized, root: "hiclarify.com" };
}

/** Root domain (e.g. containercreations.com) → Domain folder name (01_App top-level). */
const ROOT_TO_DOMAIN: Record<string, string> = {
  "containercreations.com": "ContainerCreations",
  "hiclarify.com": "HIClarify",
};

/** Subdomain (lowercase) → PascalCase segment for path. */
function subdomainToSegment(sub: string): string {
  if (!sub) return "";
  return sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase();
}

/** Default route when path is empty (e.g. learn.containercreations.com/ → landing). */
const CONTAINERCREATIONS_DEFAULT_ROUTE = "landing";

/** HIClarify subdomain → folder path (Domain/Subdomain; route appended by path). */
const HICLARIFY_SUBDOMAIN_TO_FOLDER: Record<string, string> = {
  christian: "HIClarify/Christian",
  learn: "HIClarify/Learn",
  plan: "HIClarify/Plan",
  protect: "HIClarify/Protect",
  research: "HIClarify/Research",
};

/**
 * Resolve domain + path segments to loader key: Domain/Subdomain/Route.
 * - learn.containercreations.com + [] → ContainerCreations/Learn/landing (default route)
 * - learn.containercreations.com + ["onboarding"] → ContainerCreations/Learn/onboarding
 * - christian.hiclarify.com + [] → HIClarify/Christian
 * - christian (path) + ["prayer"] → HIClarify/Christian/prayer
 */
export function getResolvedPath(domain: string, pathSegments: string[]): string | null {
  const { subdomain, root } = parseDomainParts(domain);
  trace("getResolvedPath: parse", { domain, subdomain, root, pathSegments });

  if (root.includes("containercreations")) {
    const domainFolder = ROOT_TO_DOMAIN[root] ?? "ContainerCreations";
    const subSegment = subdomainToSegment(subdomain);
    const route = pathSegments[0]?.toLowerCase() ?? CONTAINERCREATIONS_DEFAULT_ROUTE;
    const result = `${domainFolder}/${subSegment}/${route}`;
    if (DOMAIN_TRACE && typeof console !== "undefined" && console.log) {
      console.log("[AUTO-RESOLVE] → " + result);
      if (typeof window !== "undefined") (window as any).__LAST_AUTO_RESOLVE__ = result;
    }
    trace("getResolvedPath: containercreations", { Domain: domainFolder, Subdomain: subSegment, Route: route, result });
    return result;
  }

  if (root.includes("hiclarify")) {
    const base = HICLARIFY_SUBDOMAIN_TO_FOLDER[subdomain] ?? null;
    if (base === null) {
      trace("getResolvedPath: FALLBACK — hiclarify subdomain not in map", { subdomain });
      return null;
    }
    const route = pathSegments[0]?.toLowerCase();
    const result = route ? `${base}/${route}` : base;
    if (DOMAIN_TRACE && typeof console !== "undefined" && console.log) {
      console.log("[AUTO-RESOLVE] → " + result);
      if (typeof window !== "undefined") (window as any).__LAST_AUTO_RESOLVE__ = result;
    }
    trace("getResolvedPath: hiclarify", { base, route, result });
    return result;
  }

  trace("getResolvedPath: return null (root not containercreations or hiclarify)", { root });
  return null;
}

/**
 * Map full domain (or path segment) to loader path. Uses default route when path is empty.
 * Backward-compat: returns same as getResolvedPath(domain, []).
 */
export function getFolderForSubdomain(domain: string): string | null {
  const result = getResolvedPath(domain, []);
  if (typeof console !== "undefined" && console.log) {
    console.log("[domain-map]", { domain, resolved: result });
  }
  return result;
}

/**
 * Prayer app base path (domain-agnostic). Use for all links and navigation.
 * Domain is determined by the subdomain (e.g. christian.hiclarify.com); paths are always /prayer, /prayer/admin, etc.
 */
export function getPrayerBasePathForHost(_host?: string): string {
  return "/prayer";
}

/**
 * Run the full domain→subdomain→layout→flow resolution from current window location
 * and log each step. Call from the domain page on mount to see why a hostname
 * did or didn't resolve. Enable by setting window.__DOMAIN_RESOLVE_TRACE__ = true.
 */
export function traceDomainResolutionFromWindow(domainSegmentFromParams?: string, pathSegmentsFromParams?: string[]): void {
  if (typeof window === "undefined") return;
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  const domainFromPath = pathname === "/" ? "" : pathname.split("/").filter(Boolean)[0] ?? "";
  const domain = domainSegmentFromParams ?? domainFromPath;
  const pathSegments = pathSegmentsFromParams ?? (pathname.split("/").filter(Boolean).slice(1));

  console.log("[domain-resolve] ========== FULL RESOLUTION TRACE (window) ==========");
  console.log("[domain-resolve] Step 1 — hostname parse", { hostname, pathname, "domain (param/path)": domain, pathSegments });

  const segment = getDomainSegmentForHost(hostname);
  console.log("[domain-resolve] Step 2 — resolver output (getDomainSegmentForHost)", {
    hostname,
    domainSegment: segment,
    ...(segment === null ? { "FALLBACK": "resolver returned null" } : {}),
  });

  const resolvedPath = getResolvedPath(domain, pathSegments);
  console.log("[domain-resolve] Step 3 — Domain/Subdomain/Route (getResolvedPath)", {
    domain,
    pathSegments,
    resolvedPath,
    ...(resolvedPath === null ? { "FALLBACK": "resolved path null — Unknown domain" } : {}),
  });

  const loaderKey = resolvedPath ?? "";
  console.log("[domain-resolve] Step 4 — selected layout/folder", { resolvedPath, loaderKey });
  console.log("[domain-resolve] Step 5 — selected flow/component", {
    loaderKey,
    note: "Check APP_MODULE_LOADERS in @/lib/app-loaders.ts for this key.",
    ...(resolvedPath === null ? { "FALLBACK": "resolved path is null — page will show Unknown domain" } : {}),
  });
  console.log("[domain-resolve] ========== END RESOLUTION TRACE ==========");
}

/**
 * Build the exact JSON file request path for domain routing.
 *
 * URL path segments contract (after middleware rewrites):
 * - first = route folder (e.g. "landing")
 * - second (optional) = file name stem without ".json" (e.g. "ContainerCreationsLanding-5")
 *
 * Rules:
 * - If fileName is present:
 *   -> `${resolvedPath}/${fileName}.json`
 * - If fileName is absent:
 *   -> `${resolvedPath}/${route}.json` (API will fallback to first available *.json in folder if missing)
 *
 * Note: This function does not do any FS guessing/version picking.
 */
export function buildDomainJsonPath(resolvedPath: string | null, pathSegments: string[]): {
  route: string;
  fileName?: string;
  jsonPath: string;
} | null {
  if (!resolvedPath) return null;

  const resolvedParts = resolvedPath.split("/").filter(Boolean);
  const routeFromResolvedPath = resolvedParts.pop() ?? "landing";
  const baseResolvedPath = resolvedParts.join("/");
  // Folder name is authoritative (getResolvedPath lowercases for container-creations routes),
  // and default JSON preference is "<folderName>.json".
  let route = routeFromResolvedPath;

  let fileName = pathSegments[1];
  // When URL is /<slug> under containercreations subdomains, avoid slug-as-folder pathing.
  // Example bad: ContainerCreations/Learn/<slug>/<slug>.json
  // Example good: ContainerCreations/Learn/landing/<slug>.json
  if (!fileName && pathSegments[0] && pathSegments[0].toLowerCase() === routeFromResolvedPath.toLowerCase()) {
    route = "landing";
    fileName = pathSegments[0];
  }
  if (fileName && fileName.toLowerCase().endsWith(".json")) {
    // Allow URL patterns that include the extension: /.../MyScreen.json
    // while keeping the contract of loading `${fileNameStem}.json`.
    fileName = fileName.slice(0, -5);
  }
  const routeRoot = route === routeFromResolvedPath ? resolvedPath : `${baseResolvedPath}/${route}`;
  if (fileName) {
    return {
      route,
      fileName,
      jsonPath: `${routeRoot}/${fileName}.json`,
    };
  }

  return {
    route,
    jsonPath: `${routeRoot}/${route}.json`,
  };
}
