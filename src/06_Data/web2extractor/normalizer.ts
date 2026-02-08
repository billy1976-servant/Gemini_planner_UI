/**
 * Web2Extractor V2 — field unification.
 * Separates universal fields (name, url, price, images, description) from discovered attributes.
 * Auto-extracts specs/features from content, normalizes media, dedupes.
 */

import type { RawProduct, NormalizedProduct, DiscoveredAttributes } from "./types";

function asString(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

/** Keys that are page UI / CSS / JS, not product attributes. Omit from catalog. */
const UI_SPEC_KEYS = new Set([
  "action", "addToCart", "align", "android", "appearance", "background", "begin", "body", "border",
  "bottom", "button", "color", "content", "context", "cursor", "data", "decoration", "desktop",
  "direction", "display", "ease", "emit", "error", "family", "footer", "height", "href", "http",
  "id", "image", "init", "innerHeight", "language", "legacy", "lowstock", "metadata", "mobile",
  "modern", "navigator", "og", "once", "onerror", "origin", "padding", "payload", "position",
  "produce", "ratio", "rating", "repeat", "rgb", "roundingMode", "routes", "scale", "shadow",
  "size", "soldOut", "spacing", "src", "status", "strings", "style", "timestamp", "top", "twitter",
  "type", "url", "variantStrings", "version", "width", "wpm",
]);

function isProductSpecKey(key: string): boolean {
  const k = key.trim().toLowerCase();
  if (k.startsWith("--") || k.length < 2) return false;
  if (UI_SPEC_KEYS.has(k)) return false;
  return true;
}

function looksLikeProductValue(value: string): boolean {
  const v = value.trim();
  if (v.length > 500) return false;
  if (/=>|function\s*\(|url\s*\(|var\s*\(|format\s*\(|\.woff2|\.min\.js/i.test(v)) return false;
  if (/^[`{[\]]/.test(v)) return false;
  return true;
}

function asRecord(v: unknown): Record<string, string> {
  if (v == null) return {};
  if (Array.isArray(v)) {
    const out: Record<string, string> = {};
    for (const item of v) {
      if (item && typeof item === "object" && "key" in item && "value" in item) {
        const key = String(item.key).trim();
        const value = String(item.value).trim();
        if (isProductSpecKey(key) && looksLikeProductValue(value)) out[key] = value;
      }
    }
    return out;
  }
  if (typeof v === "object" && v !== null) {
    const out: Record<string, string> = {};
    for (const [k, val] of Object.entries(v)) {
      const value = val != null ? String(val).trim() : "";
      if (k && value && isProductSpecKey(k) && looksLikeProductValue(value)) out[k.trim()] = value;
    }
    return out;
  }
  return {};
}

/**
 * Auto-extract structured specs (key: value) and feature bullets from content text.
 */
function extractSpecsAndFeaturesFromContent(content: string | null): { specs: Record<string, string>; features: string[] } {
  const specs: Record<string, string> = {};
  const features: string[] = [];
  const seenFeatures = new Set<string>();
  if (!content || content.length < 20) return { specs, features };

  // Key: value or Key – value (single line)
  const keyValuePattern = /(?:^|\n)\s*([A-Za-z][A-Za-z0-9\s\-]{1,40})\s*[:–—]\s*([^\n]{1,200})/g;
  let m: RegExpExecArray | null;
  while ((m = keyValuePattern.exec(content)) !== null) {
    const key = m[1].replace(/\s+/g, " ").trim();
    const value = m[2].trim();
    if (isProductSpecKey(key) && looksLikeProductValue(value) && value.length >= 2) specs[key] = value;
  }

  // Bullet-style features: • item, - item, * item, or lines after "Features:" / "Includes:"
  const bulletPattern = /(?:^|\n)\s*(?:[•\-*]\s+|\d+\.\s+)([^\n]{8,300})/g;
  while ((m = bulletPattern.exec(content)) !== null) {
    const text = m[1].trim();
    if (text.length >= 8 && text.length <= 300 && !seenFeatures.has(text)) {
      seenFeatures.add(text);
      features.push(text);
    }
  }

  // "HEADER • bullet" style (e.g. "PRECISE DESIGN • Only product designed...")
  const headerBulletPattern = /(?:^|\n)\s*([A-Z][A-Z\s&]+)\s*[•]\s+([^\n]{10,250})/g;
  while ((m = headerBulletPattern.exec(content)) !== null) {
    const text = m[2].trim();
    if (!seenFeatures.has(text)) {
      seenFeatures.add(text);
      features.push(text);
    }
  }

  return { specs, features: features.slice(0, 30) };
}

/**
 * Normalize media: dedupe by base URL (strip query), ensure https, drop icons/tiny, prefer main image first.
 */
function normalizeMedia(urls: string[], baseUrl: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  try {
    const origin = new URL(baseUrl).origin;
    for (const u of urls) {
      const trimmed = u.trim();
      if (!trimmed || trimmed.startsWith("data:") || /icon|logo|favicon|sprite|_20x|thumbnail/i.test(trimmed)) continue;
      let normalized = trimmed;
      if (normalized.startsWith("//")) normalized = "https:" + normalized;
      else if (normalized.startsWith("/")) normalized = origin + normalized;
      else if (!normalized.startsWith("http")) normalized = origin + "/" + normalized;
      if (normalized.startsWith("http://")) normalized = "https://" + normalized.slice(7);
      const withoutQuery = normalized.split("?")[0];
      if (seen.has(withoutQuery)) continue;
      seen.add(withoutQuery);
      result.push(normalized);
    }
  } catch {
    return urls.filter((x) => x && !x.startsWith("data:"));
  }
  return result;
}

/**
 * Unify name from productName, title, name.
 */
function normalizeName(raw: RawProduct): string {
  const name = raw.name ?? raw.productName ?? raw.title ?? null;
  return asString(name) ?? raw.url ?? "";
}

/**
 * Unify sku from sku, itemNumber, productNumber, modelNumber.
 */
function normalizeSku(raw: RawProduct): string | null {
  const sku = raw.sku ?? raw.itemNumber ?? raw.productNumber ?? raw.modelNumber ?? null;
  return asString(sku);
}

/**
 * Single normalized product: universal fields + discovered attributes.
 */
export function normalizeProduct(raw: RawProduct): NormalizedProduct {
  const content = asString(raw.content);
  const fromContent = extractSpecsAndFeaturesFromContent(content);
  const htmlSpecs = asRecord(raw.specs);
  const mergedSpecs: Record<string, string> = { ...fromContent.specs, ...htmlSpecs };
  const htmlFeatures = Array.isArray(raw.features)
    ? raw.features.filter((x) => typeof x === "string" && (x as string).trim().length >= 5).map((x) => (x as string).trim())
    : [];
  const mergedFeatures = [...new Set([...htmlFeatures, ...fromContent.features])].slice(0, 30);
  const images = normalizeMedia(Array.isArray(raw.images) ? raw.images : [], raw.url);

  const attributes: DiscoveredAttributes = {
    sku: normalizeSku(raw),
    brand: asString(raw.brand),
    availability: asString(raw.availability),
    content: content && content.length <= 10000 ? content : null,
    features: mergedFeatures,
    specs: mergedSpecs,
  };

  return {
    universal: {
      name: normalizeName(raw),
      url: raw.url,
      price: asString(raw.price),
      images,
      description: asString(raw.description),
    },
    attributes,
  };
}

/**
 * Normalize an array of raw products.
 */
export function normalizeProducts(raws: RawProduct[]): NormalizedProduct[] {
  return raws.map(normalizeProduct);
}
