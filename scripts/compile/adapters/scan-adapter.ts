/**
 * Scan Adapter - Wraps existing product extraction logic
 * 
 * Reuses: extractProduct, extractCategory, fetchHtml
 */

import { extractProduct } from "../../../src/logic/products/extractors/extract-product";
import { extractCategory } from "../../../src/logic/products/extractors/extract-category";
import { fetchHtml } from "../../../src/logic/products/extractors/fetch-html";
import type { SiteSnapshot } from "../compile-website";

/**
 * Scan website and return site snapshot
 */
export async function scanWebsite(siteUrl: string): Promise<SiteSnapshot> {
  // Fetch HTML
  const html = await fetchHtml(siteUrl, {});

  // Try to extract as product first
  let rawData: any = {};
  try {
    const productExtraction = await extractProduct(siteUrl);
    rawData = {
      type: "product",
      extraction: productExtraction,
    };
  } catch (error: any) {
    // If not a product page, try category
    try {
      const categoryExtraction = await extractCategory(siteUrl);
      rawData = {
        type: "category",
        extraction: categoryExtraction,
      };
    } catch (error2: any) {
      // Fallback: just store HTML and URL
      rawData = {
        type: "unknown",
        url: siteUrl,
        error: error?.message || error2?.message || "Unknown error",
      };
    }
  }

  return {
    url: siteUrl,
    html: html || undefined,
    extractedAt: new Date().toISOString(),
    rawData,
  };
}
