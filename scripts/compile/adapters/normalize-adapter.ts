/**
 * Normalize Adapter - Wraps existing product normalization logic
 * 
 * Reuses: normalizeProduct, ProductRepository
 */

import { normalizeProduct } from "../../../src/logic/products/product-normalizer";
import type { SiteSnapshot } from "../compile-website";
import type { ProductGraph, Product, CategoryExtraction } from "../../../src/logic/products/product-types";

/**
 * Normalize site snapshot to product graph
 */
export async function normalizeToProductGraph(siteSnapshot: SiteSnapshot): Promise<ProductGraph> {
  const products: Product[] = [];
  const categories: string[] = [];
  const brands: string[] = [];

  // If we have a product extraction, normalize it
  if (siteSnapshot.rawData.type === "product" && siteSnapshot.rawData.extraction) {
    const rawExtraction = siteSnapshot.rawData.extraction;
    const normalized = normalizeProduct(rawExtraction);
    
    if (normalized.product) {
      products.push(normalized.product);
      if (normalized.product.brand) {
        brands.push(normalized.product.brand);
      }
      if (normalized.product.category) {
        categories.push(normalized.product.category);
      }
    }
  }

  // If we have a category extraction, extract category name
  if (siteSnapshot.rawData.type === "category" && siteSnapshot.rawData.extraction) {
    const categoryExtraction = siteSnapshot.rawData.extraction as CategoryExtraction;
    // Extract category from URL or use default
    const categoryName = categoryExtraction.categoryUrl.split("/").filter(Boolean).pop() || "uncategorized";
    categories.push(categoryName);
  }

  // Deduplicate
  const uniqueCategories = Array.from(new Set(categories));
  const uniqueBrands = Array.from(new Set(brands));

  return {
    products,
    categories: uniqueCategories,
    brands: uniqueBrands,
    extractedAt: new Date().toISOString(),
    sourceUrls: [siteSnapshot.url],
  };
}
