/**
 * Product Normalizer - Converts raw extraction to normalized Product objects
 * 
 * Deterministic normalization:
 * - Maps keys to canonical AttributeDictionary keys
 * - Converts units when obvious (e.g., mm→in) but preserves rawText
 * - Assigns importanceClass defaults
 * - Produces warnings for unmapped attributes (does not discard)
 */

import type {
  Product,
  ProductImage,
  DescriptionBlock,
  ProductSpec,
  Source,
  AttributeValue,
  RawExtraction,
  AttributeDictionary,
} from "./product-types";

/**
 * Default attribute dictionary
 * This can be extended per category/domain
 */
export const DEFAULT_ATTRIBUTE_DICTIONARY: AttributeDictionary[] = [
  // Dimensions
  {
    canonicalKey: "width_mm",
    aliases: ["width", "Width", "WIDTH", "w", "W"],
    type: "number",
    group: "dimensions",
    comparisonMode: "strict",
    defaultImportanceClass: "core",
    unit: "mm",
  },
  {
    canonicalKey: "height_mm",
    aliases: ["height", "Height", "HEIGHT", "h", "H"],
    type: "number",
    group: "dimensions",
    comparisonMode: "strict",
    defaultImportanceClass: "core",
    unit: "mm",
  },
  {
    canonicalKey: "depth_mm",
    aliases: ["depth", "Depth", "DEPTH", "d", "D", "length", "Length"],
    type: "number",
    group: "dimensions",
    comparisonMode: "strict",
    defaultImportanceClass: "core",
    unit: "mm",
  },
  {
    canonicalKey: "weight_kg",
    aliases: ["weight", "Weight", "WEIGHT", "mass", "Mass"],
    type: "number",
    group: "dimensions",
    comparisonMode: "strict",
    defaultImportanceClass: "core",
    unit: "kg",
  },
  
  // Power
  {
    canonicalKey: "power_watts",
    aliases: ["power", "Power", "POWER", "wattage", "Wattage"],
    type: "number",
    group: "power",
    comparisonMode: "strict",
    defaultImportanceClass: "core",
    unit: "W",
  },
  {
    canonicalKey: "voltage_volts",
    aliases: ["voltage", "Voltage", "VOLTAGE", "v", "V"],
    type: "number",
    group: "power",
    comparisonMode: "strict",
    defaultImportanceClass: "core",
    unit: "V",
  },
  
  // Format/Type
  {
    canonicalKey: "format",
    aliases: ["type", "Type", "TYPE", "format", "Format", "model", "Model"],
    type: "string",
    group: "format",
    comparisonMode: "loose",
    defaultImportanceClass: "core",
  },
  
  // Controls
  {
    canonicalKey: "controls",
    aliases: ["controls", "Controls", "CONTROLS", "control", "Control"],
    type: "string",
    group: "controls",
    comparisonMode: "loose",
    defaultImportanceClass: "secondary",
  },
];

/**
 * Normalization warnings
 */
export type NormalizationWarning = {
  type: "unmapped_attribute" | "unit_conversion_failed" | "missing_source";
  attributeKey?: string;
  message: string;
};

/**
 * Normalize raw extraction to Product
 */
export function normalizeProduct(
  raw: RawExtraction,
  dictionary: AttributeDictionary[] = DEFAULT_ATTRIBUTE_DICTIONARY
): {
  product: Product;
  warnings: NormalizationWarning[];
} {
  const warnings: NormalizationWarning[] = [];
  
  // Extract basic info from JSON-LD or meta tags
  const jsonLd = raw.jsonLd || {};
  const metaTags = raw.metaTags || {};
  
  // Generate deterministic ID from URL
  const id = generateProductId(raw.url);
  
  // Extract brand, name, category
  const brand = jsonLd.brand?.name || metaTags["og:brand"] || extractBrandFromUrl(raw.url) || "Unknown";
  const name = jsonLd.name || metaTags["og:title"] || metaTags.title || "Unknown Product";
  const category = jsonLd.category || metaTags["og:type"] || "uncategorized";
  
  // Normalize price
  const price = normalizePrice(raw.price, raw.url);
  
  // Normalize images
  const images = normalizeImages(raw.images || [], raw.url);
  
  // Normalize attributes from specs
  const { attributes, attributeWarnings } = normalizeAttributes(
    raw.specTable || [],
    dictionary,
    raw.url
  );
  warnings.push(...attributeWarnings);
  
  // Normalize description blocks
  const descriptionBlocks = normalizeDescriptionBlocks(
    raw.descriptionBlocks || [],
    raw.url
  );
  
  // Build specs (preserve raw)
  const specs: ProductSpec[] = (raw.specTable || []).map((row) => ({
    key: row.key,
    value: row.value,
    sourceUrl: raw.url,
  }));
  
  // Aggregate all sources
  const sources: Source[] = [];
  
  // Price source
  if (price.source) {
    sources.push(price.source);
  }
  
  // Image sources
  images.forEach((img) => {
    sources.push({
      label: `Image: ${img.alt || "Product image"}`,
      url: img.sourceUrl,
      snippet: `Image URL: ${img.url}`,
      kind: "image",
    });
  });
  
  // Spec sources
  specs.forEach((spec) => {
    sources.push({
      label: `Spec: ${spec.key}`,
      url: spec.sourceUrl,
      snippet: `${spec.key}: ${spec.value}`,
      kind: "spec",
    });
  });
  
  // Description sources
  descriptionBlocks.forEach((block) => {
    sources.push({
      label: block.heading ? `Description: ${block.heading}` : "Description",
      url: block.sourceUrl,
      snippet: block.text.substring(0, 100),
      kind: "description",
    });
  });
  
  // Support link sources
  (raw.supportLinks || []).forEach((link) => {
    sources.push({
      label: `Support: ${link.label}`,
      url: link.url,
      snippet: link.label,
      kind: "support",
    });
  });
  
  const product: Product = {
    id,
    brand,
    name,
    category,
    url: raw.url,
    price,
    images,
    attributes,
    descriptionBlocks,
    specs,
    sources: [...new Map(sources.map((s) => [s.url, s])).values()], // Deduplicate by URL
  };
  
  return { product, warnings };
}

/**
 * Generate deterministic product ID from URL
 */
function generateProductId(url: string): string {
  // Simple hash function (deterministic)
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `prod_${Math.abs(hash).toString(36)}`;
}

/**
 * Extract brand from URL (fallback)
 */
function extractBrandFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      return parts[parts.length - 2]; // Second-to-last part (e.g., "brand" from "brand.com")
    }
  } catch {
    // Invalid URL
  }
  return null;
}

/**
 * Normalize price
 */
function normalizePrice(
  rawPrice: RawExtraction["price"],
  sourceUrl: string
): Product["price"] {
  if (!rawPrice) {
    return {
      amount: 0,
      currency: "USD",
      source: {
        label: "Price not found",
        url: sourceUrl,
        snippet: "Price information not available",
        kind: "price",
      },
    };
  }
  
  return {
    amount: rawPrice.amount,
    currency: rawPrice.currency || "USD",
    source: {
      label: "Price",
      url: sourceUrl,
      snippet: rawPrice.text || `${rawPrice.currency} ${rawPrice.amount}`,
      kind: "price",
    },
  };
}

/**
 * Normalize images
 */
function normalizeImages(
  rawImages: RawExtraction["images"],
  sourceUrl: string
): ProductImage[] {
  return (rawImages || []).map((img) => ({
    url: img.url,
    alt: img.alt || "Product image",
    sourceUrl,
  }));
}

/**
 * Normalize attributes from spec table
 */
function normalizeAttributes(
  specTable: RawExtraction["specTable"],
  dictionary: AttributeDictionary[],
  sourceUrl: string
): {
  attributes: Record<string, AttributeValue>;
  warnings: NormalizationWarning[];
} {
  const attributes: Record<string, AttributeValue> = {};
  const warnings: NormalizationWarning[] = [];
  
  // Build alias map for fast lookup
  const aliasMap = new Map<string, AttributeDictionary>();
  dictionary.forEach((dict) => {
    dict.aliases.forEach((alias) => {
      aliasMap.set(alias.toLowerCase(), dict);
    });
    aliasMap.set(dict.canonicalKey.toLowerCase(), dict);
  });
  
  specTable.forEach((row) => {
    const key = row.key.trim();
    const value = row.value.trim();
    
    // Find matching dictionary entry
    const dict = aliasMap.get(key.toLowerCase());
    
    if (dict) {
      // Normalize value based on type
      const normalized = normalizeAttributeValue(value, dict);
      
      attributes[dict.canonicalKey] = {
        value: normalized.value,
        unit: normalized.unit || dict.unit,
        rawText: value,
        importanceClass: dict.defaultImportanceClass,
        source: {
          label: `Spec: ${key}`,
          url: sourceUrl,
          snippet: `${key}: ${value}`,
          kind: "spec",
        },
      };
    } else {
      // Unmapped attribute - store with warning
      warnings.push({
        type: "unmapped_attribute",
        attributeKey: key,
        message: `Attribute "${key}" not found in dictionary`,
      });
      
      // Store as-is with generic key
      const genericKey = `raw_${key.toLowerCase().replace(/\s+/g, "_")}`;
      attributes[genericKey] = {
        value: value,
        rawText: value,
        importanceClass: "secondary",
        source: {
          label: `Spec: ${key}`,
          url: sourceUrl,
          snippet: `${key}: ${value}`,
          kind: "spec",
        },
      };
    }
  });
  
  return { attributes, warnings };
}

/**
 * Normalize attribute value based on dictionary type
 */
function normalizeAttributeValue(
  rawValue: string,
  dict: AttributeDictionary
): { value: string | number | boolean | string[]; unit?: string } {
  if (dict.type === "number") {
    // Extract number and unit
    const match = rawValue.match(/^([\d.,]+)\s*([a-zA-Z]+)?$/);
    if (match) {
      const numStr = match[1].replace(/,/g, "");
      const num = parseFloat(numStr);
      const unit = match[2] || dict.unit;
      
      if (!isNaN(num)) {
        // Convert unit if needed
        const converted = convertUnit(num, unit || "", dict.unit || "");
        return { value: converted.value, unit: converted.unit };
      }
    }
    // Fallback: try to extract any number
    const numMatch = rawValue.match(/[\d.,]+/);
    if (numMatch) {
      const num = parseFloat(numMatch[0].replace(/,/g, ""));
      if (!isNaN(num)) {
        return { value: num, unit: dict.unit };
      }
    }
    return { value: rawValue }; // Return as string if can't parse
  }
  
  if (dict.type === "boolean") {
    const lower = rawValue.toLowerCase();
    if (lower === "yes" || lower === "true" || lower === "1") {
      return { value: true };
    }
    if (lower === "no" || lower === "false" || lower === "0") {
      return { value: false };
    }
    return { value: rawValue }; // Return as string if unclear
  }
  
  if (dict.type === "enum" && dict.enumValues) {
    // Check if value matches enum
    const normalized = rawValue.toLowerCase().trim();
    const match = dict.enumValues.find(
      (v) => v.toLowerCase() === normalized
    );
    if (match) {
      return { value: match };
    }
  }
  
  // String or unknown
  return { value: rawValue };
}

/**
 * Convert units deterministically (only obvious conversions)
 */
function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string
): { value: number; unit: string } {
  const from = fromUnit.toLowerCase();
  const to = toUnit.toLowerCase();
  
  // Length conversions
  if (from === "mm" && to === "in") {
    return { value: value / 25.4, unit: "in" };
  }
  if (from === "in" && to === "mm") {
    return { value: value * 25.4, unit: "mm" };
  }
  if (from === "cm" && to === "mm") {
    return { value: value * 10, unit: "mm" };
  }
  if (from === "m" && to === "mm") {
    return { value: value * 1000, unit: "mm" };
  }
  
  // Weight conversions
  if (from === "g" && to === "kg") {
    return { value: value / 1000, unit: "kg" };
  }
  if (from === "lb" && to === "kg") {
    return { value: value * 0.453592, unit: "kg" };
  }
  
  // If units match or no conversion available, return as-is
  if (from === to || !to) {
    return { value, unit: fromUnit };
  }
  
  // Unknown conversion - return original
  return { value, unit: fromUnit };
}

/**
 * Normalize description blocks
 */
function normalizeDescriptionBlocks(
  rawBlocks: RawExtraction["descriptionBlocks"],
  sourceUrl: string
): DescriptionBlock[] {
  return (rawBlocks || []).map((block) => ({
    heading: block.heading,
    text: block.text,
    sourceUrl,
  }));
}
