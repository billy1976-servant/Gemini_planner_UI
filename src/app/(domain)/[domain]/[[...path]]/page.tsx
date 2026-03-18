"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getResolvedPath, traceDomainResolutionFromWindow } from "@/lib/domain-config";
import { APP_MODULE_LOADERS } from "@/lib/app-loaders";
import { TSXScreenWithEnvelope } from "@/lib/tsx-structure/TSXScreenWithEnvelope";

/**
 * Canonical domain route for /{domain}/* (e.g. /christian/prayer, /learn.containercreations.com/onboarding).
 * Resolution: Domain/Subdomain/Route via getResolvedPath(domain, pathSegments). No path → default route (e.g. landing).
 */

export default function DomainPage() {
  const params = useParams();
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
  const resolvedPath = getResolvedPath(domain, pathSegments);
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Full domain→subdomain→layout→flow resolution trace (dev; or set window.__DOMAIN_RESOLVE_TRACE__ = true)
  useEffect(() => {
    traceDomainResolutionFromWindow(domain, pathSegments);
  }, [domain, pathSegments.join("/")]);

  useEffect(() => {
    const loaderKey = resolvedPath ?? "";
    if (process.env.NODE_ENV === "development") {
      console.log("[domain-page] Step 1 — domain param (from URL segment)", { domain });
      console.log("[domain-page] Step 2 — Domain/Subdomain/Route (getResolvedPath)", {
        domain,
        pathSegments,
        resolvedPath,
        ...(resolvedPath === null ? { "FALLBACK": "return null — will show Unknown domain" } : {}),
      });
      console.log("[domain-page] Step 3 — loader key", { loaderKey, "APP_MODULE_LOADERS has key": loaderKey in APP_MODULE_LOADERS });
    }
    if (!resolvedPath) {
      setError("Unknown domain");
      return;
    }
    const loader = APP_MODULE_LOADERS[loaderKey];
    if (loader) {
      if (process.env.NODE_ENV === "development") {
        console.log("[domain-page] Step 4 — resolved flow", { loaderKey, status: "loading" });
      }
      loader()
        .then((mod) => {
          setComponent(() => mod.default);
          setError(null);
          if (process.env.NODE_ENV === "development") {
            console.log("[domain-page] Step 4 — resolved flow", { loaderKey, status: "ok" });
          }
        })
        .catch((err) => {
          console.warn("[domain-router] Loader failed for", loaderKey, err);
          setComponent(null);
          setError(`Module load failed: ${loaderKey}`);
          if (process.env.NODE_ENV === "development") {
            console.log("[domain-page] FALLBACK — loader failed", { loaderKey, err: String(err) });
          }
        });
      return;
    }
    setComponent(null);
    const expectedPath = `01_App/${loaderKey}`;
    setError(`Module not found: ${expectedPath}`);
    if (process.env.NODE_ENV === "development") {
      console.log("[domain-page] FALLBACK — no loader for key", {
        loaderKey,
        expectedPath,
        "available keys": Object.keys(APP_MODULE_LOADERS),
      });
    }
  }, [domain, resolvedPath, pathSegments.join("/")]);

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
  const routeKey = `${resolvedPath ?? ""}-${pathSegments.join("-")}`;

  const loaderKey = resolvedPath ?? "";
  const isPrayer = loaderKey === "Christian/prayer" || loaderKey === "HIClarify/Christian/prayer";
  if (isPrayer) {
    return (
      <TSXScreenWithEnvelope
        screenPath="Christian/Prayer/PrayerApp"
        Component={(envelopeProps: Record<string, unknown>) => (
          <Component key={routeKey} slug={appSlug} basePath={appBase} {...envelopeProps} />
        )}
      />
    );
  }

  return <Component key={routeKey} slug={appSlug} basePath={appBase} />;
}
