/**
 * Site Loader - Multi-page support
 * Phase 1 - Core Site Structure
 */
"use client";

import type { SiteConfig, PageMetadata } from "@/types/site.types";

const SITE_BASE = "/api/sites";

/**
 * Load site configuration (pages, navigation, footer)
 */
export async function loadSite(siteId: string): Promise<SiteConfig> {
  const cacheBuster = `?t=${Date.now()}`;
  const fetchUrl = `${SITE_BASE}/${siteId}${cacheBuster}`;
  
  console.log("[site-loader] 🔍 Fetching site config", {
    siteId,
    fetchUrl,
    timestamp: Date.now(),
  });
  
  const res = await fetch(fetchUrl, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "No error details");
    console.error("[site-loader] ❌ Fetch failed", {
      status: res.status,
      statusText: res.statusText,
      siteId,
      errorText,
    });
    throw new Error(
      `Site load failed (${res.status}): ${siteId} - ${errorText}`
    );
  }

  const siteConfig = await res.json();
  
  console.log("[site-loader] 📥 LOADED", {
    siteId,
    pagesCount: siteConfig?.pages?.length || 0,
    hasNavigation: !!siteConfig?.navigation,
    hasFooter: !!siteConfig?.footer,
    timestamp: Date.now(),
  });

  return siteConfig;
}

/**
 * Find page by path in site config
 */
export function findPageByPath(
  siteConfig: SiteConfig,
  path: string
): PageMetadata | null {
  // Normalize path (remove trailing slash, ensure leading slash)
  const normalizedPath = path === "/" ? "/" : `/${path.replace(/^\/+|\/+$/g, "")}`;
  
  const page = siteConfig.pages.find((p) => p.path === normalizedPath);
  
  if (!page) {
    console.warn("[site-loader] ⚠️ Page not found", {
      requestedPath: path,
      normalizedPath,
      availablePaths: siteConfig.pages.map((p) => p.path),
    });
  }
  
  return page || null;
}

/**
 * Update document metadata (title, description, og tags)
 */
export function updatePageMetadata(page: PageMetadata): void {
  if (typeof document === "undefined") return;
  
  // Update title
  if (page.title) {
    document.title = page.title;
  }
  
  // Update meta description
  if (page.description) {
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", page.description);
  }
  
  // Update og:title
  if (page.title) {
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", page.title);
  }
  
  // Update og:description
  if (page.description) {
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement("meta");
      ogDesc.setAttribute("property", "og:description");
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute("content", page.description);
  }
  
  // Update og:image
  if (page.ogImage) {
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement("meta");
      ogImage.setAttribute("property", "og:image");
      document.head.appendChild(ogImage);
    }
    ogImage.setAttribute("content", page.ogImage);
  }
  
  console.log("[site-loader] 📄 Metadata updated", {
    title: page.title,
    description: page.description,
    ogImage: page.ogImage,
  });
}
