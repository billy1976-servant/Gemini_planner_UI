/**
 * Build Product Catalog
 * Reads web2-results.json, normalizes URLs to canonical Shopify form,
 * deduplicates by canonical URL, merges duplicates (prefer longer description, more images),
 * writes to src/content/generated/{site}/products.catalog.json
 */

import * as fs from "fs";
import * as path from "path";

export interface CatalogProduct {
  url: string;
  handle: string;
  name: string;
  price: string | null;
  description: string | null;
  images: string[];
}

interface Web2Entry {
  url?: string;
  name?: string | null;
  price?: string | null;
  description?: string | null;
  images?: string[];
  [key: string]: unknown;
}

/**
 * Normalize product URL to canonical Shopify form.
 * e.g. collections/any/products/slug becomes origin + products/slug (same origin).
 */
function toCanonicalProductUrl(url: string): string {
  try {
    const u = new URL(url);
    const pathname = u.pathname;
    const match = pathname.match(/\/products\/([^/]+)(?:\/|$)/);
    if (match) {
      const slug = match[1];
      return `${u.origin}/products/${slug}`;
    }
    return url.split("?")[0].split("#")[0];
  } catch {
    return url;
  }
}

/** URL is invalid if it looks like a social/share link (not a real product). */
const INVALID_URL_PATTERNS = /facebook|twitter|pinterest|share|intent|pin(?!t)/i;

function isInvalidProductUrl(url: string): boolean {
  return INVALID_URL_PATTERNS.test(url);
}

/**
 * Extract handle from URL (last segment after /products/).
 */
function handleFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/products\/([^/]+)(?:\/|$)/);
    return m ? m[1] : u.pathname.replace(/^\//, "").replace(/\//g, "-") || "product";
  } catch {
    return "product";
  }
}

/**
 * Merge two entries: prefer longer description, more images.
 */
function mergeEntries(a: Web2Entry, b: Web2Entry): Web2Entry {
  const descA = (a.description && String(a.description).trim()) || "";
  const descB = (b.description && String(b.description).trim()) || "";
  const imagesA = Array.isArray(a.images) ? a.images.length : 0;
  const imagesB = Array.isArray(b.images) ? b.images.length : 0;
  const preferA = descA.length >= descB.length && imagesA >= imagesB;
  return preferA ? { ...b, ...a } : { ...a, ...b };
}

/**
 * Build catalog from web2-results path and write to output path.
 * @param web2Path - path to web2-results.json (default: cwd/web2-results.json)
 * @param outputDir - e.g. src/content/generated/containercreations
 */
export function buildProductCatalog(
  web2Path: string = path.join(process.cwd(), "web2-results.json"),
  outputDir: string = path.join(process.cwd(), "src", "content", "generated", "containercreations")
): CatalogProduct[] {
  if (!fs.existsSync(web2Path)) {
    throw new Error(`web2-results.json not found: ${web2Path}`);
  }

  const raw: Web2Entry[] = JSON.parse(fs.readFileSync(web2Path, "utf-8"));
  if (!Array.isArray(raw)) {
    throw new Error("web2-results.json must be an array");
  }

  const byCanonical = new Map<string, Web2Entry>();
  for (const entry of raw) {
    const url = entry.url && String(entry.url).trim();
    if (!url) continue;
    if (isInvalidProductUrl(url)) continue;
    const canonical = toCanonicalProductUrl(url);
    const existing = byCanonical.get(canonical);
    const merged = existing ? mergeEntries(existing, { ...entry, url: canonical }) : { ...entry, url: canonical };
    byCanonical.set(canonical, merged);
  }

  const catalog: CatalogProduct[] = [];
  for (const entry of byCanonical.values()) {
    const url = (entry.url && String(entry.url)) || "";
    if (isInvalidProductUrl(url)) continue;
    catalog.push({
      url,
      handle: handleFromUrl(url),
      name: (entry.name && String(entry.name).trim()) || "",
      price: entry.price != null ? String(entry.price).trim() : null,
      description: entry.description != null ? String(entry.description).trim() : null,
      images: Array.isArray(entry.images) ? entry.images.filter((u): u is string => typeof u === "string") : [],
    });
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const outPath = path.join(outputDir, "products.catalog.json");
  fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2), "utf-8");
  console.log(`[buildProductCatalog] Wrote ${catalog.length} products to ${outPath}`);
  return catalog;
}

function main(): void {
  const site = process.argv[2] || "containercreations";
  const outDir = path.join(process.cwd(), "src", "content", "generated", site);
  buildProductCatalog(path.join(process.cwd(), "web2-results.json"), outDir);
}

main();
