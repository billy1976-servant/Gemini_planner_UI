/**
 * GeneratedSiteViewer
 * 
 * Schema-driven site renderer.
 * Fetches compiled SiteSchema JSON and NormalizedSite data,
 * then renders using schema layout blocks.
 */

"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SitePage } from "@/types/siteSchema";
import { NormalizedSite } from "@/lib/site-compiler/normalizeSiteData";
import { renderLayoutBlocks } from "@/lib/site-renderer/renderFromSchema";
import { resolveProfileLayout } from "@/lib/layout/profile-resolver";
import { resolveScreenLayout } from "@/lib/layout/screen-layout-resolver";
import { getLayout, subscribeLayout } from "@/engine/core/layout-store";
import PageContainer from "@/components/site/PageContainer";
import "@/styles/site-theme.css";
import { SiteLayout } from "@/lib/site-schema/siteLayout.types";

interface BrandInfo {
  logoUrl?: string;
  palette?: {
    primary?: string;
    surface?: string;
    onSurface?: string;
    outline?: string;
  };
}

interface GeneratedSiteViewerProps {
  domain?: string;
}

function getContainerLayout(experience: "website" | "app" | "learning"): React.CSSProperties {
  if (experience === "website") {
    return {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "clamp(16px, 3vw, 40px)",
      width: "100%",
    };
  }
  const profile = resolveProfileLayout(experience);
  const containerType = profile?.container || "page";
  const screenLayout = resolveScreenLayout(containerType, null, { maxWidth: profile?.maxWidth });
  return {
    maxWidth: screenLayout.maxWidth || profile?.maxWidth || "100%",
    padding: screenLayout.padding || "2rem",
    margin: "0 auto",
    width: "100%",
  };
}

export default function GeneratedSiteViewer({ domain: domainProp }: GeneratedSiteViewerProps = {}) {
  // Get experience from layout store reactively (reacts to layout dropdown changes)
  const layout = useSyncExternalStore(
    subscribeLayout,
    getLayout,
    () => ({ type: "column", preset: null }) // Fallback
  );
  const experience = ((layout as any)?.experience as "website" | "app" | "learning") || "website";
  const containerStyles = getContainerLayout(experience);
  
  const searchParams = useSearchParams();
  const [siteData, setSiteData] = useState<NormalizedSite | null>(null);
  const [brandInfo, setBrandInfo] = useState<BrandInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  
  // Disable engine overlays by default (as per requirements)
  const ENABLE_ENGINE_OVERLAYS = false;
  
  // Debug overlay flag (temporary, for development)
  const ENABLE_DEBUG_OVERLAY = false;

  // Apply brand palette to CSS variables
  useEffect(() => {
    if (!brandInfo?.palette) return;
    
    const root = document.documentElement;
    const palette = brandInfo.palette;
    
    // Override palette colors with brand colors
    if (palette.primary) {
      root.style.setProperty("--color-primary", palette.primary);
      root.style.setProperty("--color-primary-hover", palette.primary);
    }
    if (palette.surface) {
      root.style.setProperty("--color-bg-primary", palette.surface);
    }
    if (palette.onSurface) {
      root.style.setProperty("--color-text-primary", palette.onSurface);
    }
    if (palette.outline) {
      root.style.setProperty("--color-border", palette.outline);
    }
  }, [brandInfo]);

  // Store per-page data (loaded from /compiled/pages/*.json)
  const [pageData, setPageData] = useState<Map<string, SitePage>>(new Map());

  useEffect(() => {
    // Use domain prop if provided, otherwise fall back to search params, then default
    const domain = domainProp || searchParams.get("domain") || "gibson-com";
    
    // Fetch pages list, normalized data, and brand info in parallel
    Promise.all([
      fetch(`/api/sites/${domain}/pages`).then(res => {
        if (!res.ok) {
          return res.json().then((errData) => {
            throw new Error(errData.message || errData.error || `Failed to load pages list: ${res.statusText}`);
          });
        }
        return res.json();
      }),
      fetch(`/api/sites/${domain}/normalized`).then(res => {
        if (!res.ok) {
          return res.json().then((errData) => {
            throw new Error(errData.message || errData.error || `Failed to load normalized data: ${res.statusText}`);
          });
        }
        return res.json();
      }),
      fetch(`/api/sites/${domain}/brand`).then(res => {
        if (!res.ok) {
          // Brand info is optional, don't fail if missing
          return null;
        }
        return res.json();
      }).catch(() => null), // Brand info is optional
    ])
      .then(([pagesList, normalizedData, brand]: [Array<{id: string; path: string; title: string}>, NormalizedSite, BrandInfo | null]) => {
        setSiteData(normalizedData);
        setBrandInfo(brand);
        
        // Load all page files in parallel
        Promise.all(
          pagesList.map(pageInfo => 
            fetch(`/api/sites/${domain}/pages/${pageInfo.id}`)
              .then(res => res.ok ? res.json() : null)
              .catch(() => null)
          )
        ).then(pageFiles => {
          const pageMap = new Map<string, SitePage>();
          pageFiles.forEach((page, index) => {
            if (page && pagesList[index]) {
              pageMap.set(pagesList[index].id, page);
            }
          });
          setPageData(pageMap);
          setLoading(false);
          setError(null);
          
          console.log("🖥 VIEWER LOADED PAGES", {
            pagesCount: pageMap.size,
            pageIds: Array.from(pageMap.keys()),
          });
        }).catch((err) => {
          console.error("Error loading page files:", err);
          setError(err.message || `Failed to load page files: ${domain}`);
          setLoading(false);
        });
      })
      .catch((err) => {
        console.error("Error loading site:", err);
        setError(err.message || `Failed to load site: ${domain}`);
        setLoading(false);
      });
  }, [searchParams, domainProp]);

  // ✅ STEP E: Use derived pages from siteData, render from per-page files
  const derivedPages = siteData?.derivedPages;
  
  // Convert derivedPages to SitePage format using per-page files
  // IMPORTANT: Use derived page titles, load sections from per-page files
  // Only compute pages when both derivedPages and pageData are available
  const pages = (derivedPages && derivedPages.length > 0 && pageData.size > 0)
    ? derivedPages.map(dp => {
        // Get page data from per-page files
        const pageFile = pageData.get(dp.id);
        if (!pageFile) {
          console.warn(`[GeneratedSiteViewer] Page file not found for ${dp.id}`);
        }
        return {
          id: dp.id,
          path: dp.slug, // Use derived slug (not constructed path)
          title: dp.title, // ✅ Use derived page title (Home, Products, etc.)
          sections: pageFile?.sections || [],
        };
      })
    : [];
  
  const defaultPageId = pages.find(p => p.path === "/" || p.id === "home")?.id ?? pages[0]?.id ?? "home";
  
  // ✅ STEP F: Debug dump (dev only)
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.log('[GeneratedSiteViewer] Pages Debug', {
      derivedPagesLength: derivedPages?.length || 0,
      pageDataSize: pageData.size,
      finalPagesLength: pages.length,
      finalPagesTitles: pages.map(p => p.title || p.id),
      derivedPages: derivedPages?.map(p => ({
        id: p.id,
        title: p.title,
        sectionIdsCount: p.sectionIds.length,
      })),
      pages: pages.map(p => ({
        id: p.id,
        title: p.title,
        sectionsCount: p.sections.length,
      })),
      activePageId,
    });
  }

  // Set activePageId to defaultPageId if null (useEffect guard to run once)
  // This must be before any early returns to satisfy React hooks rules
  useEffect(() => {
    if (activePageId === null && defaultPageId) {
      setActivePageId(defaultPageId);
    }
  }, [activePageId, defaultPageId]);

  const domain = domainProp || searchParams.get("domain") || "gibson-com";

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontSize: "var(--font-size-lg)",
        color: "var(--color-text-secondary)",
      }}>
        Loading site...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "var(--spacing-8)",
        textAlign: "center",
      }}>
        <h1 style={{
          fontSize: "var(--font-size-3xl)",
          fontWeight: "var(--font-weight-bold)",
          marginBottom: "var(--spacing-4)",
          color: "var(--color-text-primary)",
        }}>
          Site API Failed
        </h1>
        <p style={{
          fontSize: "var(--font-size-lg)",
          color: "var(--color-text-secondary)",
          marginBottom: "var(--spacing-4)",
        }}>
          Domain: {searchParams.get("domain") || "gibson-com"}
        </p>
        <p style={{
          fontSize: "var(--font-size-base)",
          color: "var(--color-text-secondary)",
          fontFamily: "monospace",
          backgroundColor: "var(--color-bg-secondary)",
          padding: "var(--spacing-4)",
          borderRadius: "var(--radius-md)",
          maxWidth: "600px",
        }}>
          {error}
        </p>
      </div>
    );
  }

  if (!siteData || pageData.size === 0) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontSize: "var(--font-size-lg)",
        color: "var(--color-text-secondary)",
      }}>
        No site data available
      </div>
    );
  }

  // Derive active page from per-page files
  const activePage = activePageId
    ? pages.find(p => p.id === activePageId)
    : pages.find(p => p.path === "/" || p.id === "home") ?? pages[0] ?? null;
  
  // Get sections directly from active page (per-page files already have correct sections)
  const activePageSections = activePage?.sections || [];
  
  // 🔍 TRACE 4 — GENERATED WEBSITE VIEWER: After page selection
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log("📄 ACTIVE PAGE", {
      pageId: activePage?.id,
      pageTitle: activePage?.title,
      sectionsCount: activePageSections.length,
      sectionTypes: activePageSections.map((s: any) => s.type),
    });
  }

  // Create runtime helpers object for schema renderer
  const runtimeHelpers = {
    activePageId: activePageId || defaultPageId || "home",
    setActivePageId,
    pages: pages, // Include pages for path-based navigation
  };
  
  if (!activePage) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "var(--spacing-8)",
        textAlign: "center",
      }}>
        <h1 style={{
          fontSize: "var(--font-size-2xl)",
          fontWeight: "var(--font-weight-semibold)",
          marginBottom: "var(--spacing-4)",
          color: "var(--color-text-primary)",
        }}>
          No Pages Available
        </h1>
        <p style={{
          fontSize: "var(--font-size-base)",
          color: "var(--color-text-secondary)",
        }}>
          Domain: {domain}
        </p>
        <p style={{
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-muted)",
          marginTop: "var(--spacing-4)",
        }}>
          No pages were found in the compiled data. Run 'npm run website' to package the site.
        </p>
      </div>
    );
  }

  // Helper to get section label - extract meaningful names from content
  const getSectionLabel = (block: any, index: number): string => {
    // Try block.content.title or block.content.heading first
    if (block.content?.title) return block.content.title;
    if (block.content?.heading) return block.content.heading;
    
    // Try block-level title/heading
    if (block.title) return block.title;
    if (block.heading) return block.heading;
    
    // For text blocks, try to extract first line or meaningful text
    if (block.type === "text" && block.content?.body) {
      const body = typeof block.content.body === "string" 
        ? block.content.body 
        : String(block.content.body);
      // Get first line, max 50 chars
      const firstLine = body.split("\n")[0].trim();
      if (firstLine && firstLine.length > 0 && firstLine.length < 50) {
        return firstLine;
      }
    }
    
    // For productGrid, use a meaningful label
    if (block.type === "productGrid") {
      return "Products";
    }
    
    // For hero, use heading or "Hero"
    if (block.type === "hero") {
      return block.content?.heading || block.heading || "Hero";
    }
    
    // For nav/footer, use type name
    if (block.type === "nav") return "Navigation";
    if (block.type === "footer") return "Footer";
    
    // Fallback: capitalize type name
    const typeName = block.type || 'section';
    return typeName.charAt(0).toUpperCase() + typeName.slice(1);
  };

  // Helper to scroll to section
  const scrollToSection = (blockId: string) => {
    const element = document.getElementById(`block-${blockId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Render page using schema layout blocks
  return (
    <>
      {/* Debug Overlay (temporary, for development) */}
      {ENABLE_DEBUG_OVERLAY && activePage && (
        <div style={{
          position: "fixed",
          bottom: "16px",
          right: "16px",
          zIndex: 9999,
          background: "rgba(0, 0, 0, 0.85)",
          color: "#fff",
          padding: "var(--spacing-4)",
          borderRadius: "var(--radius-md)",
          fontSize: "var(--font-size-sm)",
          fontFamily: "monospace",
          lineHeight: "1.6",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          minWidth: "200px",
        }}>
          <div style={{ fontWeight: "var(--font-weight-bold)", marginBottom: "var(--spacing-2)", borderBottom: "1px solid rgba(255, 255, 255, 0.2)", paddingBottom: "var(--spacing-2)" }}>
            Debug Info
          </div>
          <div style={{ marginBottom: "var(--spacing-1)" }}>
            <strong>activePageId:</strong> {activePageId || "null"}
          </div>
          <div style={{ marginBottom: "var(--spacing-1)" }}>
            <strong>activePage.path:</strong> {activePage.path}
          </div>
          <div>
            <strong>sections:</strong> {activePageSections.length}
          </div>
        </div>
      )}
      
      {/* Hero-area CTA + Pages / Sections Navigation */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "var(--color-bg-primary)",
        borderBottom: "1px solid var(--color-border)",
        padding: "var(--spacing-4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "var(--spacing-4)",
        flexWrap: "wrap",
      }}>
        <Link
          href={`/?screen=tsx:SiteOnboardingScreen&domain=${encodeURIComponent(domain)}`}
          style={{
            padding: "var(--spacing-2) var(--spacing-4)",
            fontSize: "var(--font-size-sm)",
            fontWeight: "var(--font-weight-semibold)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-primary)",
            background: "var(--color-primary)",
            color: "#fff",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Find Your Best Fit
        </Link>
        {/* Pages Dropdown - only show if more than 1 page */}
        {pages.length > 1 && (
            <>
              <label style={{
                fontSize: "var(--font-size-sm)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--color-text-secondary)",
              }}>
                Pages:
              </label>
              <select
                value={activePageId || ""}
                onChange={(e) => {
                  const pageId = e.target.value;
                  if (pageId) {
                    setActivePageId(pageId);
                    // Reset section selection when page changes
                    // (sections dropdown will update automatically)
                  }
                }}
                style={{
                  padding: "var(--spacing-2) var(--spacing-4)",
                  fontSize: "var(--font-size-base)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-bg-primary)",
                  color: "var(--color-text-primary)",
                  cursor: "pointer",
                  minWidth: "200px",
                }}
              >
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.title || page.path || page.id}
                  </option>
                ))}
              </select>
            </>
          )}
          
          {/* Sections Dropdown - only show if sections exist for current page */}
          {activePageSections.length > 0 && (
            <>
              <label style={{
                fontSize: "var(--font-size-sm)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--color-text-secondary)",
              }}>
                Sections:
              </label>
              <select
                defaultValue=""
                onChange={(e) => {
                  const blockId = e.target.value;
                  if (blockId) {
                    scrollToSection(blockId);
                  }
                }}
                style={{
                  padding: "var(--spacing-2) var(--spacing-4)",
                  fontSize: "var(--font-size-base)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-bg-primary)",
                  color: "var(--color-text-primary)",
                  cursor: "pointer",
                  minWidth: "200px",
                }}
              >
                <option value="">Select a section...</option>
                {activePageSections.map((block: any, index: number) => {
                  const blockId = block.id || String(index);
                  return (
                    <option key={blockId} value={blockId}>
                      {getSectionLabel(block, index)}
                    </option>
                  );
                })}
              </select>
            </>
          )}
      </div>
      <PageContainer containerStyles={containerStyles}>
        {activePage && (() => {
          // Render sections from per-page file (already filtered - each page file has only its own sections)
          const blocks = activePageSections;
          
          // Show placeholder if no sections
          if (blocks.length === 0) {
            return (
              <div style={{
                padding: "var(--spacing-16)",
                textAlign: "center",
                color: "var(--color-text-secondary)",
              }}>
                <h2 style={{
                  fontSize: "var(--font-size-2xl)",
                  marginBottom: "var(--spacing-4)",
                }}>
                  No sections for this page
                </h2>
                <p>
                  Page: {activePage.title} (ID: {activePageId})
                </p>
              </div>
            );
          }
          
          // renderLayoutBlocks now accepts both LayoutBlock[] and SiteLayout[]
          return renderLayoutBlocks(blocks, siteData, experience, runtimeHelpers);
        })()}
      </PageContainer>
    </>
  );
}
