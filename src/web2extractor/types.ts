/**
 * Web2Extractor V2 — product type definitions.
 * Single normalized shape for all extracted products.
 */

export interface NormalizedProduct {
  url: string;
  name: string;
  price: string | null;
  description: string | null;
  images: string[];
  sku: string | null;
  specs: Record<string, string>;
}

/**
 * Raw shape from extractor before normalizer runs.
 * Field names may vary (e.g. itemNumber, productNumber, productName).
 */
export interface RawProduct {
  url: string;
  name?: string | null;
  productName?: string | null;
  title?: string | null;
  price?: string | null;
  description?: string | null;
  images?: string[];
  sku?: string | null;
  itemNumber?: string | null;
  productNumber?: string | null;
  modelNumber?: string | null;
  specs?: Record<string, string> | Array<{ key: string; value: string }> | null;
}
