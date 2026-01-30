/**
 * Data Loaders for Site Compilation
 * 
 * Loads and parses JSON export files from compiled site directories.
 * 
 * ⚠️ SERVER-ONLY: This module uses Node.js fs module and must only be imported
 * in server-side code (API routes, server components, server actions).
 */

// Ensure this is only used server-side
if (typeof window !== "undefined") {
  throw new Error(
    "siteCompiler/loaders cannot be imported in client-side code. " +
    "Use API routes instead."
  );
}

import fs from "fs";
import path from "path";

const COMPILED_SITES_DIR = path.join(process.cwd(), "src", "content", "compiled", "sites");

export interface SiteSnapshot {
  domain?: string;
  url?: string;
  title?: string;
  pages?: any[];
  navigation?: any[];
  images?: any[];
  links?: any[];
  metadata?: any;
  [key: string]: any;
}

export interface ProductGraph {
  products?: any[];
  relationships?: any[];
  categories?: any[];
  [key: string]: any;
}

export interface ResearchBundle {
  researchFacts?: string[];
  bindings?: Record<string, string[]>;
  headlines?: string[];
  copy?: string[];
  [key: string]: any;
}

export interface ValueModel {
  rankedValueConclusions?: any[];
  valueImpactBlocks?: any[];
  appliedAssumptions?: string[];
  [key: string]: any;
}

export interface FinalReport {
  domain?: string;
  summary?: string;
  insights?: any[];
  recommendations?: any[];
  [key: string]: any;
}

/**
 * Load site snapshot data
 */
export function loadSnapshot(domain: string): SiteSnapshot | null {
  try {
    const filePath = path.join(COMPILED_SITES_DIR, domain, "site.snapshot.json");
    if (!fs.existsSync(filePath)) {
      console.warn(`[SiteCompiler] Site snapshot not found: ${filePath}`);
      return null;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const rawData = JSON.parse(content);
    
    // Transform the data structure to match expected format
    // The snapshot may have data in rawData.extraction
    const extraction = rawData.rawData?.extraction || rawData;
    
    // Extract title from HTML or meta tags
    let title = extraction.metaTags?.title || extraction.metaTags?.["og:title"];
    if (!title && extraction.html) {
      // Try to extract from HTML title tag
      const titleMatch = extraction.html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
    }
    if (!title) {
      // Fallback: extract from URL domain
      const url = rawData.url || extraction.url || "";
      title = url.replace(/^https?:\/\//, "").replace(/^www\./, "").split(".")[0];
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }

    // Build a normalized snapshot structure
    const snapshot: SiteSnapshot = {
      domain: rawData.url || extraction.url,
      url: rawData.url || extraction.url,
      title: title || domain,
      metadata: {
        description: extraction.metaTags?.description || extraction.metaTags?.["og:description"] || extraction.descriptionBlocks?.[0] || "",
      },
      images: (extraction.images || []).map((img: any) => {
        // Fix URL encoding (replace &amp; with &)
        if (typeof img === "string") {
          return { url: img.replace(/&amp;/g, "&"), alt: "Gibson" };
        }
        return {
          ...img,
          url: (img.url || img.src || "").replace(/&amp;/g, "&"),
        };
      }),
      links: extraction.supportLinks || [],
      // Try to extract navigation from HTML or other sources
      navigation: [],
      pages: [],
      // Store raw extraction for more advanced parsing
      rawExtraction: extraction,
    };
    
    return snapshot;
  } catch (error) {
    console.error(`[SiteCompiler] Error loading snapshot for ${domain}:`, error);
    return null;
  }
}

/**
 * Load product graph data
 */
export function loadProducts(domain: string): ProductGraph | null {
  try {
    const filePath = path.join(COMPILED_SITES_DIR, domain, "product.graph.json");
    const exists = fs.existsSync(filePath);
    console.log("[TRACE loadProducts] path:", filePath);
    console.log("[TRACE loadProducts] exists:", exists);
    if (!exists) {
      console.warn(`[SiteCompiler] Product graph not found: ${filePath}`);
      return null;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content) as ProductGraph;
    const rawProducts = parsed?.products;
    console.log("[TRACE loadProducts] raw count:", rawProducts?.length || 0);
    return parsed;
  } catch (error) {
    console.error(`[SiteCompiler] Error loading products for ${domain}:`, error);
    return null;
  }
}

/**
 * Load research bundle data
 */
export function loadResearch(domain: string): ResearchBundle | null {
  try {
    const filePath = path.join(COMPILED_SITES_DIR, domain, "research.bundle.json");
    if (!fs.existsSync(filePath)) {
      console.warn(`[SiteCompiler] Research bundle not found: ${filePath}`);
      return null;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as ResearchBundle;
  } catch (error) {
    console.error(`[SiteCompiler] Error loading research for ${domain}:`, error);
    return null;
  }
}

/**
 * Load value model data
 */
export function loadValueModel(domain: string): ValueModel | null {
  try {
    const filePath = path.join(COMPILED_SITES_DIR, domain, "value.model.json");
    if (!fs.existsSync(filePath)) {
      console.warn(`[SiteCompiler] Value model not found: ${filePath}`);
      return null;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as ValueModel;
  } catch (error) {
    console.error(`[SiteCompiler] Error loading value model for ${domain}:`, error);
    return null;
  }
}

/**
 * Load final report data
 */
export function loadFinalReport(domain: string): FinalReport | null {
  try {
    const filePath = path.join(COMPILED_SITES_DIR, domain, "report.final.json");
    if (!fs.existsSync(filePath)) {
      console.warn(`[SiteCompiler] Final report not found: ${filePath}`);
      return null;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as FinalReport;
  } catch (error) {
    console.error(`[SiteCompiler] Error loading final report for ${domain}:`, error);
    return null;
  }
}

/**
 * Check if a site exists
 */
export function siteExists(domain: string): boolean {
  const siteDir = path.join(COMPILED_SITES_DIR, domain);
  return fs.existsSync(siteDir);
}

/**
 * List all available sites
 */
export function listSites(): string[] {
  try {
    if (!fs.existsSync(COMPILED_SITES_DIR)) {
      return [];
    }
    return fs
      .readdirSync(COMPILED_SITES_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch (error) {
    console.error("[SiteCompiler] Error listing sites:", error);
    return [];
  }
}
