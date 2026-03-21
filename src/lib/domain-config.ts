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
    console.log("[domain-resolve]", msg, data ? data : "");
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
  if (!normalized) {
    throw new Error("DOMAIN PARSE FAILED — NO FALLBACK ALLOWED");
  }
  if (!normalized.includes(".")) {
    throw new Error("DOMAIN PARSE FAILED — NO FALLBACK ALLOWED");
  }

  const parts = normalized.split(".");
  if (parts.length < 3) {
    throw new Error("DOMAIN PARSE FAILED — NO FALLBACK ALLOWED");
  }

  const subdomain = parts[0];
  const root = parts.slice(-2).join(".");
  if (!subdomain || !root) {
    throw new Error("DOMAIN PARSE FAILED — NO FALLBACK ALLOWED");
  }
  return { subdomain, root };
}

/** Root domain (e.g. containercreations.com) → Domain folder name (01_App top-level). */
const ROOT_TO_DOMAIN: Record<string, string> = {
  "containercreations.com": "ContainerCreations",
  "hiclarify.com": "HIClarify",
};

/** Subdomain (lowercase) → PascalCase segment for path. */
function subdomainToSegment(sub: string): string {
  if (!sub) throw new Error("DOMAIN PARSE FAILED — NO FALLBACK ALLOWED");
  return sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase();
}

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
 * - learn.containercreations.com + ["<route>"] → ContainerCreations/Learn/<route>
 * - learn.containercreations.com + ["onboarding"] → ContainerCreations/Learn/onboarding
 * - christian.hiclarify.com + [] → HIClarify/Christian
 * - christian (path) + ["prayer"] → HIClarify/Christian/prayer
 */
export function getResolvedPath(domain: string, pathSegments: string[]): string | null {
  if (!pathSegments || pathSegments.length < 1) {
    throw new Error("RESOLVER FAILURE — DO NOT FALLBACK");
  }
  const { subdomain, root } = parseDomainParts(domain);
  trace("getResolvedPath: parse", { domain, subdomain, root, pathSegments });

  if (root.includes("containercreations")) {
    const domainFolder = ROOT_TO_DOMAIN[root];
    if (!domainFolder) throw new Error("RESOLVER FAILURE — DO NOT FALLBACK");
    const subSegment = subdomainToSegment(subdomain);
    const route = pathSegments[0].toLowerCase();
    const result = `${domainFolder}/${subSegment}/${route}`;
    if (DOMAIN_TRACE && typeof console !== "undefined" && console.log) {
      console.log("[AUTO-RESOLVE] → " + result);
      if (typeof window !== "undefined") (window as any).__LAST_AUTO_RESOLVE__ = result;
    }
    trace("getResolvedPath: containercreations", { Domain: domainFolder, Subdomain: subSegment, Route: route, result });
    return result;
  }

  if (root.includes("hiclarify")) {
    const base = HICLARIFY_SUBDOMAIN_TO_FOLDER[subdomain];
    if (!base) throw new Error("RESOLVER FAILURE — DO NOT FALLBACK");
    const route = pathSegments[0].toLowerCase();
    const result = `${base}/${route}`;
    if (DOMAIN_TRACE && typeof console !== "undefined" && console.log) {
      console.log("[AUTO-RESOLVE] → " + result);
      if (typeof window !== "undefined") (window as any).__LAST_AUTO_RESOLVE__ = result;
    }
    trace("getResolvedPath: hiclarify", { base, route, result });
    return result;
  }

  throw new Error("RESOLVER FAILURE — DO NOT FALLBACK");
}

/**
 * Map full domain (or path segment) to loader path. Uses default route when path is empty.
 * Backward-compat: returns same as getResolvedPath(domain, []).
 */
export function getFolderForSubdomain(domain: string): string | null {
  // Strict contract: no default routeFolder; caller must provide routeFolder from URL.
  throw new Error("RESOLVER FAILURE — DO NOT FALLBACK");
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
  const domainFirst = pathname.split("/").filter(Boolean)[0];
  const domainFromPath = pathname === "/" ? "" : domainFirst ? domainFirst : "";

  const domain = domainSegmentFromParams ? domainSegmentFromParams : domainFromPath;
  const pathSegments = pathSegmentsFromParams ? pathSegmentsFromParams : pathname.split("/").filter(Boolean).slice(1);

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

  const loaderKey = resolvedPath as string;
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
 * - first = route folder (e.g. "route")
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
  if (!resolvedPath) throw new Error("RESOLVER FAILURE — DO NOT FALLBACK");
  if (!pathSegments || pathSegments.length < 2) throw new Error("RESOLVER FAILURE — DO NOT FALLBACK");

  const resolvedParts = resolvedPath.split("/").filter(Boolean);
  const routeFromResolvedPath = resolvedParts.pop();
  if (!routeFromResolvedPath) throw new Error("RESOLVER FAILURE — DO NOT FALLBACK");
  const domainFolderRaw = resolvedParts[0];
  const subdomainFolderRaw = resolvedParts[1];
  if (!domainFolderRaw || !subdomainFolderRaw) {
    throw new Error("RESOLVER FAILURE — DO NOT FALLBACK");
  }

  const routeFromUrl = pathSegments[0];
  if (routeFromUrl.toLowerCase() !== routeFromResolvedPath.toLowerCase()) {
    throw new Error("RESOLVER FAILURE — DO NOT FALLBACK");
  }

  const fileStem = pathSegments[pathSegments.length - 1];
  const jsonFileName = fileStem.toLowerCase().endsWith(".json") ? fileStem : `${fileStem}.json`;
  const domainFolder = domainFolderRaw.toLowerCase();
  const subdomainFolder = subdomainFolderRaw.toLowerCase();
  const routeFolder = routeFromResolvedPath.toLowerCase();
  const jsonPath = `${domainFolder}/${subdomainFolder}/${routeFolder}/${jsonFileName}`;
  const debugFullPath = `src/01_App/${jsonPath}`;

  if (process.env.NODE_ENV === "development") {
    console.log("[domain-path] final json path", {
      resolvedPath,
      pathSegments,
      oldPath: `${routeFromResolvedPath}/${jsonFileName}`,
      newPath: jsonPath,
      fullPath: debugFullPath,
    });
  }

  return {
    route: routeFromResolvedPath,
    fileName: fileStem,
    jsonPath,
  };
}
