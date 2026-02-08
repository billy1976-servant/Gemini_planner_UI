/**
 * Site Compiler Entry Point
 * 
 * Orchestrates loading and normalization of site data.
 */

import { CompiledSiteModel } from "./types";
import {
  loadSnapshot,
  loadProducts,
  loadResearch,
  loadValueModel,
  loadFinalReport,
  siteExists,
} from "./loaders";
import { normalizeSiteData } from "./normalize";

/**
 * Compile a site from all available data sources
 */
export async function compileSite(domain: string): Promise<CompiledSiteModel> {
  // Validate domain
  if (!domain) {
    throw new Error("Domain is required");
  }

  // Check if site exists
  if (!siteExists(domain)) {
    throw new Error(`Site not found: ${domain}`);
  }

  // Load all data sources
  const snapshot = loadSnapshot(domain);
  const products = loadProducts(domain);
  const research = loadResearch(domain);
  const valueModel = loadValueModel(domain);
  const report = loadFinalReport(domain);

  // Normalize into unified model
  const compiledSite = normalizeSiteData(
    domain,
    snapshot,
    products,
    research,
    valueModel,
    report
  );

  return compiledSite;
}

/**
 * Get a specific page from a compiled site
 */
export function getPage(site: CompiledSiteModel, path: string): CompiledSiteModel["pages"][0] | null {
  const normalizedPath = path === "" ? "/" : path;
  return site.pages.find((page) => page.path === normalizedPath) || null;
}

/**
 * Get homepage
 */
export function getHomepage(site: CompiledSiteModel): CompiledSiteModel["pages"][0] | null {
  return getPage(site, "/");
}
