/**
 * Variant Pattern Detector
 * 
 * Detects variant patterns in products by analyzing product fields
 * for common variant keywords (finish, color, size, etc.)
 */

export type VariantPatternMap = Record<string, Set<string>>;

const OPTION_KEYWORDS = [
  "finish", "color", "size", "scent", "flavor",
  "style", "type", "version", "model", "pack",
  "watt", "power", "length", "width", "height"
];

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function detectVariantPatterns(products: any[]) {
  const patternMap: VariantPatternMap = {};

  for (const product of products) {
    for (const key in product) {
      const normKey = normalizeKey(key);

      if (!OPTION_KEYWORDS.some(k => normKey.includes(k))) continue;

      const value = product[key];
      if (typeof value !== "string") continue;

      if (!patternMap[normKey]) patternMap[normKey] = new Set();
      patternMap[normKey].add(value.trim());
    }
  }

  return Object.fromEntries(
    Object.entries(patternMap)
      .filter(([, values]) => values.size > 1) // only real variants
      .map(([key, values]) => [key, Array.from(values)])
  );
}
