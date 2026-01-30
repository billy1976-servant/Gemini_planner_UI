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

function asRecord(v: unknown): Record<string, string> {
  if (v == null) return {};
  if (Array.isArray(v)) {
    const out: Record<string, string> = {};
    for (const item of v) {
      if (item && typeof item === "object" && "key" in item && "value" in item) {
        out[String(item.key).trim()] = String(item.value).trim();
      }
    }
    return out;
  }
  if (typeof v === "object" && v !== null) {
    const out: Record<string, string> = {};
    for (const [k, val] of Object.entries(v)) {
      if (k && val != null) out[k.trim()] = String(val).trim();
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
  return {
    url: raw.url,
    name: normalizeName(raw),
    price: asString(raw.price),
    description: asString(raw.description),
    images: Array.isArray(raw.images) ? raw.images : [],
    sku: normalizeSku(raw),
    specs: asRecord(raw.specs),
  };
}

/**
 * Normalize an array of raw products.
 */
export function normalizeProducts(raws: RawProduct[]): NormalizedProduct[] {
  return raws.map(normalizeProduct);
}
