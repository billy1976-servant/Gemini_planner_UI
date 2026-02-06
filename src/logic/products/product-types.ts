/**
 * Product Graph Schema - Strict, deterministic types
 * 
 * All facts must have sources. No AI guessing.
 * Every claim must have a source link/snippet.
 * 
 * CONTRACT-BOUNDARY: Do not change shape without updating SystemContract.ts
 */

import type {
  ProductContract,
  ProductPriceContract,
  ProductImageContract,
  ProductAttributeValueContract,
  ProductDescriptionBlockContract,
  ProductSpecContract,
  ProductSourceContract,
} from "@/contracts/SystemContract";

/**
 * Source - Represents where a fact was extracted from
 */
export type Source = ProductSourceContract;

/**
 * AttributeValue - Represents a single product attribute value
 */
export type AttributeValue = ProductAttributeValueContract;

/**
 * Product Image
 */
export type ProductImage = ProductImageContract;

/**
 * Description Block - Structured description content
 */
export type DescriptionBlock = ProductDescriptionBlockContract;

/**
 * Product Spec - Key-value specification
 */
export type ProductSpec = ProductSpecContract;

/**
 * Product - Canonical product representation
 * Must satisfy ProductContract
 */
export type Product = ProductContract;

/**
 * AttributeDictionary - Defines canonical attribute keys and normalization rules
 */
export type AttributeDictionary = {
  canonicalKey: string; // Canonical key (e.g., "weight_kg")
  aliases: string[]; // Alternative keys that map to this (e.g., ["weight", "Weight", "WEIGHT"])
  type: "string" | "number" | "boolean" | "enum"; // Value type
  group: string; // Attribute group (e.g., "format", "controls", "power", "dimensions")
  comparisonMode: "strict" | "loose"; // Default comparison mode
  defaultImportanceClass: "core" | "secondary" | "cosmetic"; // Default importance
  enumValues?: string[]; // Valid enum values (if type is "enum")
  unit?: string; // Expected unit (for normalization)
};

/**
 * ProductGraph - Collection of normalized products
 */
export type ProductGraph = {
  products: Product[];
  categories: string[]; // Unique categories
  brands: string[]; // Unique brands
  extractedAt: string; // ISO timestamp of extraction
  sourceUrls: string[]; // All source URLs scanned
};

/**
 * Raw Extraction Output - Before normalization
 */
export type RawExtraction = {
  url: string; // Source URL
  html?: string; // Raw HTML (optional, for debugging)
  jsonLd?: any; // Extracted JSON-LD data
  metaTags?: Record<string, string>; // Meta tags
  specTable?: Array<{ key: string; value: string; rowHtml?: string }>; // Spec table rows
  descriptionBlocks?: Array<{ heading?: string; text: string }>; // Description blocks
  images?: Array<{ url: string; alt?: string }>; // Images found
  title?: string; // Optional extracted title
  description?: string; // Optional flattened description text
  specs?: Array<{ key: string; value: string }>; // Optional specs array used in rip logs
  price?: {
    amount: number;
    currency: string;
    text: string; // Raw price text
  };
  supportLinks?: Array<{ label: string; url: string }>; // Support/manual links
  extractedAt: string; // ISO timestamp
};

/**
 * Category Extraction Output
 */
export type CategoryExtraction = {
  categoryUrl: string; // Category page URL
  productUrls: string[]; // Product URLs found on category page
  labels?: Record<string, string>; // Optional labels for products (if available)
  extractedAt: string; // ISO timestamp
};

/**
 * Comparison Matrix - Result of comparing multiple products
 */
export type ComparisonMatrix = {
  products: Product[]; // Products being compared
  mode: "strict" | "loose"; // Comparison mode used
  similarities: AttributeComparison[]; // Attributes where most products share same value
  differences: AttributeComparison[]; // Attributes where values vary the most
  generatedAt: string; // ISO timestamp
};

/**
 * Attribute Comparison - Single attribute comparison across products
 */
export type AttributeComparison = {
  attributeKey: string; // Canonical attribute key
  attributeGroup: string; // Attribute group
  values: Array<{
    productId: string;
    productName: string;
    value: AttributeValue;
  }>; // Values for each product
  similarity: number; // Similarity score (0-1, where 1 = all same)
  sources: Source[]; // Aggregated sources for this comparison
};

/**
 * Product Selection State - User's selected products
 */
export type ProductSelection = {
  selectedProductIds: string[]; // Selected product IDs
  comparison?: ComparisonMatrix; // Current comparison (if multiple selected)
  lastUpdated: string; // ISO timestamp
};
