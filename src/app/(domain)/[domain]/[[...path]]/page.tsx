"use client";

import React, { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { getFolderForSubdomain } from "@/lib/domain-config";
import { APP_MODULE_LOADERS } from "@/lib/app-loaders";

/**
 * Canonical domain route for /{domain}/* (e.g. /christian/prayer, /christian/prayer/live).
 * Middleware rewrites /prayer to /christian/prayer, so this page serves all Prayer app URLs.
 * Passes appSlug to apps with leading "prayer" stripped so PrayerApp receives e.g. ["live"] or ["room", id].
 * Use this route for Prayer; _domain/[domain]/[[...path]] does not strip the leading segment.
 *
 * Discover *App.tsx from src/01_App at build time.
 * Fallback: when require.context is unavailable, use APP_MODULE_LOADERS.
 */
const req = typeof require !== "undefined" ? (require as any) : null;
const appContext =
  req?.context != null ? req.context("@/01_App", true, /.*\/[^/]+App\.tsx$/) : null;

if (typeof window !== "undefined" && appContext) {
  const keys = appContext.keys().filter(
    (k: string) => !k.includes("/(dead)") && !k.startsWith("./_")
  );
  console.log("[domain-router] Discovered modules (require.context):", keys);
}

function normalizeSegment(s: string): string {
  return s.toLowerCase().replace(/-/g, "_");
}

function findContextKey(domainFolder: string, pathSegments: string[]): string | null {
  if (!appContext) return null;
  const keys = appContext.keys().filter(
    (k: string) => !k.includes("/(dead)") && !k.startsWith("./_")
  );
  if (pathSegments.length === 0) {
    return keys.find((k: string) => {
      const parts = k.split("/");
      return (
        parts.length === 3 &&
        parts[1] === domainFolder &&
        parts[2] === `${domainFolder}App.tsx`
      );
    }) ?? null;
  }
  const appSegment = normalizeSegment(pathSegments[0]);
  return keys.find((k: string) => {
    const parts = k.split("/");
    if (parts.length !== 4 || parts[1] !== domainFolder || !parts[3].endsWith("App.tsx"))
      return false;
    return normalizeSegment(parts[2]) === appSegment;
  }) ?? null;
}

function resolveDomainModuleFromFilesystem(
  domainFolder: string,
  pathSegments: string[]
): React.ComponentType<any> | null {
  const key = findContextKey(domainFolder, pathSegments);
  if (!appContext) {
    if (typeof console !== "undefined" && console.log) {
      console.log("[domain-router] require.context unavailable; will use APP_MODULE_LOADERS fallback.");
    }
    return null;
  }
  if (!key) {
    if (typeof console !== "undefined" && console.warn) {
      const expected =
        pathSegments.length === 0
          ? `01_App/${domainFolder}/${domainFolder}App.tsx`
          : `01_App/${domainFolder}/${pathSegments[0]}/${pathSegments[0]}App.tsx`;
      console.warn("[domain-router] Module not found. Expected path:", expected);
    }
    return null;
  }
  try {
    const mod = appContext(key);
    const exportName = key.split("/").pop()!.replace(/\.tsx$/, "");
    const Comp = mod.default ?? mod[exportName] ?? null;
    if (!Comp && typeof console !== "undefined" && console.warn) {
      console.warn("[domain-router] No default or named export:", exportName, "in", key);
    }
    if (Comp && typeof console !== "undefined" && console.log) {
      console.log("[domain-router] Resolved (context):", key, "→", exportName);
    }
    return Comp;
  } catch (err) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[domain-router] Import failed for", key, err);
    }
    return null;
  }
}

function getLoaderKey(domainFolder: string, pathSegments: string[]): string {
  if (pathSegments.length === 0) return domainFolder;
  return `${domainFolder}/${pathSegments[0].toLowerCase()}`;
}

export default function DomainPage() {
  const params = useParams();
  const pathname = usePathname();
  let domain = (params?.domain as string) ?? "";
  const pathParam = params?.path;
  const pathArray = Array.isArray(pathParam) ? pathParam : pathParam != null ? [String(pathParam)] : [];
  let rawPath = pathArray;
  // Path-based /prayer routes: when first segment is "prayer" (no rewrite), treat as christian + path ["prayer", ...] so Prayer app resolves.
  if (domain.toLowerCase() === "prayer") {
    domain = "christian";
    rawPath = ["prayer", ...rawPath];
  }
  // Strip leading segment if it duplicates the domain (rewrite can produce /christian/christian/prayer or path param may include domain).
  const pathSegments =
    rawPath.length > 0 && rawPath[0].toLowerCase() === domain.toLowerCase()
      ? rawPath.slice(1)
      : rawPath;
  const folder = getFolderForSubdomain(domain);
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loaderKey = getLoaderKey(folder ?? "", pathSegments);
    const resolvedFilePath =
      pathSegments.length === 0
        ? `src/01_App/${folder}/${folder}App.tsx`
        : `src/01_App/${folder}/${pathSegments[0]}/${pathSegments[0]}App.tsx`;
    if (typeof console !== "undefined" && console.log) {
      console.log("[domain-router] incoming domain=", JSON.stringify(domain));
      console.log("[domain-router] incoming path=", JSON.stringify(pathArray), "→ pathSegments=", pathSegments);
      console.log("[domain-router] resolved folder=", folder);
      console.log("[domain-router] resolved loader key=", loaderKey);
      console.log("[domain-router] resolved file path=", resolvedFilePath);
    }
    if (!folder) {
      setError("Unknown domain");
      return;
    }
    const Comp = resolveDomainModuleFromFilesystem(folder, pathSegments);
    if (Comp) {
      setComponent(() => Comp);
      setError(null);
      return;
    }
    const loader = APP_MODULE_LOADERS[loaderKey];
    if (loader) {
      if (typeof console !== "undefined" && console.log) {
        console.log("[domain-router] Resolved (APP_MODULE_LOADERS):", loaderKey, "→ file:", resolvedFilePath);
      }
      loader()
        .then((mod) => {
          setComponent(() => mod.default);
          setError(null);
        })
        .catch((err) => {
          console.warn("[domain-router] Loader failed for", loaderKey, err);
          setComponent(null);
          setError(`Module load failed: ${loaderKey}`);
        });
      return;
    }
    setComponent(null);
    const expectedPath =
      pathSegments.length === 0
        ? `01_App/${folder}/${folder}App.tsx`
        : `01_App/${folder}/${pathSegments[0]}/${pathSegments[0]}App.tsx`;
    setError(`Module not found: ${expectedPath}`);
  }, [domain, folder, pathSegments.join("/")]);

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
        {error}
      </div>
    );
  }
  if (!Component) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>Loading…</div>
    );
  }
  // Prayer app expects in-app path only; strip leading "prayer" segment when present
  const appSlug =
    pathSegments[0]?.toLowerCase() === "prayer" ? pathSegments.slice(1) : pathSegments;
  // Stable base path for all app links (e.g. /christian/prayer). Prevents link breakage when pathname fluctuates.
  const appBase =
    pathSegments.length > 0 ? `/${domain}/${pathSegments[0]}` : `/${domain}`;
  const routeKey = `${folder ?? ""}-${pathSegments.join("-")}`;
  return <Component key={routeKey} slug={appSlug} basePath={appBase} />;
}
