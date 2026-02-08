/**
 * Web2Extractor V2 — product type definitions.
 * Universal fields (name, url, price, images, description) are separate from discovered attributes.
 */

/** Universal product fields — always present and normalized. */
export interface UniversalFields {
  name: string;
  url: string;
  price: string | null;
  images: string[];
  description: string | null;
}

/** Discovered attributes — extracted from page (specs, features, sku, brand, etc.). */
export interface DiscoveredAttributes {
  sku?: string | null;
  brand?: string | null;
  availability?: string | null;
  content?: string | null;
  features: string[];
  specs: Record<string, string>;
}

/** Catalog attributes — discovered attributes without content (content is top-level rawContent). */
export type CatalogAttributes = Omit<DiscoveredAttributes, "content">;

/** Single normalized product: universal + discovered. */
export interface NormalizedProduct {
  /** Universal fields (name, url, price, images, description). */
  universal: UniversalFields;
  /** Discovered attributes (specs, features, sku, brand, availability, content). */
  attributes: DiscoveredAttributes;
}

/** Product catalog entry — universal fields + rawContent + discovered attributes. Attribute groups are generated later by pattern analysis. */
export interface ProductCatalogEntry {
  /** Universal fields. */
  name: string;
  url: string;
  /** Price as number (e.g. 49.99). */
  price: number | null;
  description: string | null;
  images: string[];
  /** Raw product content (moved from attributes.content). */
  rawContent?: string | null;
  /** Discovered attributes without content (only non-empty). */
  attributes?: CatalogAttributes;
  /** Variant URLs when this entry is the canonical product for a variant group. */
  variants?: Array<{ url: string; price: number | null; sku?: string | null }>;
}

/** Catalog output: product entries only. Attribute groups are generated later by pattern analysis. */
export interface ProductCatalog {
  products: ProductCatalogEntry[];
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
  content?: string | null;
  images?: string[];
  sku?: string | null;
  itemNumber?: string | null;
  productNumber?: string | null;
  modelNumber?: string | null;
  brand?: string | null;
  availability?: string | null;
  features?: string[];
  specs?: Record<string, string> | Array<{ key: string; value: string }> | null;
}
