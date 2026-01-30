/**
 * Web2Extractor V2 — field unification.
 * Maps raw extractor output to normalized shape: sku, price, name, description, images, specs, url.
 * Standalone: no imports from old pipeline.
 */

import type { RawProduct, NormalizedProduct } from "./types";

function asString(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string" && x.trim()).map((x) => (x as string).trim());
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
 * Unify name from productName, title, name.
 */
function normalizeName(raw: RawProduct): string {
  const name =
    raw.name ?? raw.productName ?? raw.title ?? null;
  return asString(name) ?? raw.url ?? "";
}

/**
 * Unify sku from sku, itemNumber, productNumber, modelNumber.
 */
function normalizeSku(raw: RawProduct): string | null {
  const sku =
    raw.sku ?? raw.itemNumber ?? raw.productNumber ?? raw.modelNumber ?? null;
  return asString(sku);
}

/**
 * Single normalized product from raw extractor output.
 */
export function normalizeProduct(raw: RawProduct): NormalizedProduct {
  const content = asString(raw.content);
  const features = Array.isArray(raw.features)
    ? raw.features.filter((x) => typeof x === "string" && x.trim().length >= 5).map((x) => (x as string).trim()).slice(0, 30)
    : [];
  return {
    url: raw.url,
    name: normalizeName(raw),
    price: asString(raw.price),
    description: asString(raw.description),
    content: content && content.length <= 10000 ? content : null,
    images: Array.isArray(raw.images) ? raw.images : [],
    sku: normalizeSku(raw),
    brand: asString(raw.brand),
    availability: asString(raw.availability),
    features,
    specs: asRecord(raw.specs),
  };
}

/**
 * Normalize an array of raw products.
 */
export function normalizeProducts(raws: RawProduct[]): NormalizedProduct[] {
  return raws.map(normalizeProduct);
}
