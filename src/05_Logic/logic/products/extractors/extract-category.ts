/**
 * Extract Category - Extract product URLs from category pages
 * 
 * Priority:
 * 1) JSON-LD ItemList if present
 * 2) Anchor patterns (links to product pages)
 * 3) Known selectors in config
 */

import { fetchHtml, validateUrl } from "./fetch-html";
import { parseJsonLd, findProductSchema } from "./parse-jsonld";
import type { CategoryExtraction } from "../product-types";
import { ProductRepository } from "../product-repository";

export type CategoryExtractorConfig = {
  selectors?: {
    productLinks?: string[]; // CSS selectors for product links
    productList?: string; // CSS selector for product list container
  };
  urlPatterns?: RegExp[]; // Patterns to match product URLs
  excludePatterns?: RegExp[]; // Patterns to exclude
};

const DEFAULT_CONFIG: CategoryExtractorConfig = {
  selectors: {
    productLinks: [
      "a[href*='/product/']",
      "a[href*='/p/']",
      "a[href*='/item/']",
      ".product-link",
      ".product-item a",
    ],
    productList: ".product-list, .products, .items, .grid",
  },
  urlPatterns: [
    /\/product\//i,
    /\/p\//i,
    /\/item\//i,
    /\/dp\//i, // Amazon-style
  ],
  excludePatterns: [
    /\/category\//i,
    /\/search\//i,
    /\/cart\//i,
    /\/checkout\//i,
  ],
};

/**
 * Extract product URLs from category page
 */
export async function extractCategory(
  categoryUrl: string,
  config: CategoryExtractorConfig = {},
  repository?: ProductRepository
): Promise<CategoryExtraction> {
  // Validate URL
  if (!validateUrl(categoryUrl)) {
    throw new Error(`Invalid category URL: ${categoryUrl}`);
  }
  
  // Check cache first
  if (repository) {
    const cached = await repository.loadCategoryExtraction(categoryUrl);
    if (cached) {
      return cached;
    }
    
    const cachedHtml = repository.getCachedHtml(categoryUrl);
    if (cachedHtml) {
      return extractFromHtml(cachedHtml, categoryUrl, config, repository);
    }
  }
  
  // Fetch HTML
  const html = await fetchHtml(categoryUrl);
  
  // Cache HTML
  if (repository) {
    await repository.cacheHtml(categoryUrl, html);
  }
  
  // Extract from HTML
  return extractFromHtml(html, categoryUrl, config, repository);
}

/**
 * Extract product URLs from HTML
 */
function extractFromHtml(
  html: string,
  categoryUrl: string,
  config: CategoryExtractorConfig,
  repository?: ProductRepository
): CategoryExtraction {
  const opts = { ...DEFAULT_CONFIG, ...config };
  const productUrls: string[] = [];
  const labels: Record<string, string> = {};
  
  // Method 1: JSON-LD ItemList
  const jsonLdData = parseJsonLd(html);
  const itemList = jsonLdData.find(
    (item) =>
      item["@type"] === "ItemList" ||
      (Array.isArray(item["@type"]) && item["@type"].includes("ItemList"))
  );
  
  if (itemList && itemList.itemListElement) {
    const items = Array.isArray(itemList.itemListElement)
      ? itemList.itemListElement
      : [itemList.itemListElement];
    
    items.forEach((item: any) => {
      const url = item.url || item["@id"] || item.item?.url;
      if (url && isValidProductUrl(url, opts)) {
        const normalizedUrl = normalizeUrl(url, categoryUrl);
        if (!productUrls.includes(normalizedUrl)) {
          productUrls.push(normalizedUrl);
          
          // Extract label if available
          const label = item.name || item.item?.name || item.headline;
          if (label) {
            labels[normalizedUrl] = label;
          }
        }
      }
    });
  }
  
  // Method 2: Anchor patterns
  if (productUrls.length === 0 || opts.selectors?.productLinks) {
    const anchorUrls = extractAnchors(html, categoryUrl, opts);
    anchorUrls.forEach((url) => {
      if (!productUrls.includes(url)) {
        productUrls.push(url);
      }
    });
  }
  
  const extraction: CategoryExtraction = {
    categoryUrl,
    productUrls: [...new Set(productUrls)], // Deduplicate
    labels: Object.keys(labels).length > 0 ? labels : undefined,
    extractedAt: new Date().toISOString(),
  };
  
  // Save extraction
  if (repository) {
    repository.saveCategoryExtraction(extraction).catch((err) => {
      console.error("[extractCategory] Failed to save extraction:", err);
    });
  }
  
  return extraction;
}

/**
 * Extract product URLs from anchor tags
 */
function extractAnchors(
  html: string,
  baseUrl: string,
  config: CategoryExtractorConfig
): string[] {
  const urls: string[] = [];
  
  // Match all anchor tags
  const anchorRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match;
  
  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2].replace(/<[^>]*>/g, "").trim();
    
    if (isValidProductUrl(href, config)) {
      const normalizedUrl = normalizeUrl(href, baseUrl);
      if (!urls.includes(normalizedUrl)) {
        urls.push(normalizedUrl);
      }
    }
  }
  
  return urls;
}

/**
 * Check if URL is a valid product URL
 */
function isValidProductUrl(
  url: string,
  config: CategoryExtractorConfig
): boolean {
  // Must match at least one pattern
  if (config.urlPatterns && config.urlPatterns.length > 0) {
    const matches = config.urlPatterns.some((pattern) => pattern.test(url));
    if (!matches) {
      return false;
    }
  }
  
  // Must not match exclude patterns
  if (config.excludePatterns && config.excludePatterns.length > 0) {
    const excluded = config.excludePatterns.some((pattern) => pattern.test(url));
    if (excluded) {
      return false;
    }
  }
  
  // Must be a valid URL
  try {
    new URL(url, "http://example.com");
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalize URL (resolve relative URLs)
 */
function normalizeUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}
