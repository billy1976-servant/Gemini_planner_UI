"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getResolvedPath, traceDomainResolutionFromWindow } from "@/lib/domain-config";
import { APP_MODULE_LOADERS } from "@/lib/app-loaders";
import { parseVersionFromSegment, normalizeIdentifier, extractVersionFromFilename } from "@/lib/version-utils";

/**
 * Alternate domain route (path segment _domain in URL). Not used for /prayer;
 * middleware rewrites /prayer to /christian/prayer, which is served by (domain)/[domain]/[[...path]].
 * This page passes slug without stripping leading "prayer", so PrayerApp would receive
 * ["prayer", "room", id] here vs ["room", id] from the canonical (domain) page.
 *
 * Discover *App.tsx and *App-N.tsx from src/01_App at build time for version-aware TSX loading.
 * Excludes (dead) and _ roots. Fallback: APP_MODULE_LOADERS.
 */
const req = typeof require !== "undefined" ? (require as any) : null;
const appContext =
  req?.context != null ? req.context("@/01_App", true, /.*\/[^/]+App(-[0-9]+)?\.tsx$/) : null;

/** Log discovered context keys once for debugging (domain=christian, path=prayer). */
if (typeof window !== "undefined" && appContext) {
  const keys = appContext.keys().filter(
    (k: string) => !k.includes("/(dead)") && !k.startsWith("./_")
  );
  console.log("[domain-router] Discovered modules (require.context):", keys);
}

function normalizeSegment(s: string): string {
  return s.toLowerCase().replace(/[-_]/g, "");
}

/**
 * Version-aware TSX selection: same rules as JSON resolver.
 * - If versionNumber set → exact match.
 * - Else → highest version.
 * - Else → base file (no version in name).
 * - If only one TSX in section folder → use it (no version needed).
 */
function findContextKey(
  domainFolder: string,
  pathSegments: string[],
  versionNumber: number | null
): string | null {
  if (!appContext) return null;
  const keys = appContext.keys().filter(
    (k: string) => !k.includes("/(dead)") && !k.startsWith("./_")
  );
  if (pathSegments.length === 0) {
    // Domain root: 01_App/<Domain>/<Domain>App.tsx (or <Domain>App-N.tsx)
    const rootKeys = keys.filter((k: string) => {
      const parts = k.split("/");
      if (parts.length !== 3 || parts[1] !== domainFolder) return false;
      const name = parts[2];
      return /^[^/]+App(-[0-9]+)?\.tsx$/.test(name);
    });
    if (rootKeys.length === 0) return null;
    if (rootKeys.length === 1) return rootKeys[0];
    const withVersions = rootKeys.map((k: string) => ({
      key: k,
      version: extractVersionFromFilename(k.split("/").pop() ?? ""),
    }));
    if (versionNumber != null) {
      const exact = withVersions.find((x) => x.version === versionNumber);
      return exact?.key ?? null;
    }
    const versioned = withVersions.filter((x) => x.version != null) as { key: string; version: number }[];
    if (versioned.length > 0) {
      versioned.sort((a, b) => b.version - a.version);
      return versioned[0].key;
    }
    return rootKeys[0];
  }
  // Section folder: 01_App/<Domain>/<Section>/<Section>App(-N).tsx
  const sectionSegment = pathSegments[0] ?? "";
  const normalizedSection = normalizeSegment(sectionSegment);
  const sectionKeys = keys.filter((k: string) => {
    const parts = k.split("/");
    if (parts.length !== 4 || parts[1] !== domainFolder) return false;
    const filename = parts[3];
    if (!/^[^/]+App(-[0-9]+)?\.tsx$/.test(filename)) return false;
    return normalizeSegment(parts[2]) === normalizedSection;
  });
  if (sectionKeys.length === 0) return null;
  if (sectionKeys.length === 1) return sectionKeys[0];
  const withVersions = sectionKeys.map((k: string) => ({
    key: k,
    version: extractVersionFromFilename(k.split("/").pop() ?? ""),
  }));
  if (versionNumber != null) {
    const exact = withVersions.find((x) => x.version === versionNumber);
    return exact?.key ?? null;
  }
  const versioned = withVersions.filter((x) => x.version != null) as { key: string; version: number }[];
  if (versioned.length > 0) {
    versioned.sort((a, b) => b.version - a.version);
    return versioned[0].key;
  }
  return sectionKeys[0];
}

function resolveDomainModuleFromFilesystem(
  domainFolder: string,
  pathSegments: string[],
  versionNumber: number | null
): React.ComponentType<any> | null {
  const key = findContextKey(domainFolder, pathSegments, versionNumber);
  if (!appContext) {
    if (typeof console !== "undefined" && console.log) {
      console.log("[domain-router] require.context unavailable; will use APP_MODULE_LOADERS fallback.");
    }
    return null;
  }
  if (!key) {
    const expected =
      pathSegments.length === 0
        ? `01_App/${domainFolder}/${domainFolder}App.tsx`
        : `01_App/${domainFolder}/${pathSegments[0]}/${pathSegments[0]}App.tsx`;
    if (typeof console !== "undefined" && console.warn) {
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

/** Loader key for APP_MODULE_LOADERS: e.g. "Christian" or "Christian/prayer". */
function getLoaderKey(domainFolder: string, pathSegments: string[]): string {
  if (pathSegments.length === 0) return domainFolder;
  return `${domainFolder}/${pathSegments[0].toLowerCase()}`;
}

export default function DomainPage() {
  const params = useParams();
  const domain = (params?.domain as string) ?? "";
  const rawPath = params?.path as string[] | string | undefined;
  const pathSegments = Array.isArray(rawPath) ? rawPath : rawPath ? [rawPath] : [];
  const resolvedPath = getResolvedPath(domain, pathSegments);
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    traceDomainResolutionFromWindow(domain, pathSegments);
  }, [domain, pathSegments.join("/")]);

  const section = pathSegments[0] ?? "";
  const versionSegment = pathSegments[1] ?? "";
  const versionNumber = parseVersionFromSegment(versionSegment);

  useEffect(() => {
    const loaderKey = resolvedPath ?? "";
    if (process.env.NODE_ENV === "development") {
      console.log("[domain-page _domain] domain=", domain, "pathSegments=", pathSegments, "resolvedPath=", resolvedPath, "loaderKey=", loaderKey);
      if (!resolvedPath) console.log("[domain-page _domain] FALLBACK: resolved path is null — Unknown domain");
      else if (!(loaderKey in APP_MODULE_LOADERS)) console.log("[domain-page _domain] FALLBACK: no loader for", loaderKey);
    }
    const resolvedFilePath = resolvedPath ? `src/01_App/${resolvedPath}` : "";
    if (typeof console !== "undefined" && console.log) {
      console.log("[domain-router] incoming domain=", JSON.stringify(domain));
      console.log("[domain-router] incoming path=", JSON.stringify(rawPath), "→ pathSegments=", pathSegments);
      console.log("[domain-router] resolved path (Domain/Subdomain/Route)=", resolvedPath);
      console.log("[domain-router] resolved loader key=", loaderKey);
      console.log("[domain-router] resolved file path=", resolvedFilePath);
      console.log("[domain-router] resolved section=", section, "versionNumber=", versionNumber);
    }
    if (!resolvedPath) {
      setError("Unknown domain");
      return;
    }
    // Prefer APP_MODULE_LOADERS (includes ContainerCreations/Learn/landing and ContainerCreations/Learn/onboarding)
    const loader = APP_MODULE_LOADERS[loaderKey];
    if (loader) {
      if (typeof console !== "undefined" && console.log) {
        console.log("[domain-router] Resolved (APP_MODULE_LOADERS):", loaderKey, "→ path:", resolvedFilePath);
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
    // Fallback: filesystem resolve (findContextKey expects parts[1] = domainFolder, pathSegments[0] = section)
    const pathParts = resolvedPath.split("/");
    const domainFolder = pathParts[1] ?? pathParts[0] ?? "";
    const routeSegments = pathParts.slice(2);
    const Comp = resolveDomainModuleFromFilesystem(domainFolder, routeSegments, versionNumber);
    if (Comp) {
      setComponent(() => Comp);
      setError(null);
      return;
    }
    setComponent(null);
    setError(`Module not found: 01_App/${resolvedPath}`);
  }, [domain, resolvedPath, section, versionNumber, rawPath, pathSegments.join("/")]);

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
  return <Component slug={pathSegments} section={section} versionNumber={versionNumber} />;
}
