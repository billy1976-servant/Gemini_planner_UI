/**
 * Web2Extractor V2 — product page extraction.
 * Fetches HTML and extracts name, price, description, images, sku, specs.
 * Regex-based parsing; no external HTML parser. Standalone.
 */

import type { RawProduct } from "./types";

const USER_AGENT = "Mozilla/5.0 (compatible; Web2ExtractorV2/1)";

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

/**
 * Extract product name from <h1>, og:title, or <title>.
 */
function extractName(html: string): string | null {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return stripTags(h1[1]);
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  if (ogTitle) return ogTitle[1].trim();
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title) return stripTags(title[1]);
  return null;
}

/**
 * Extract first price (e.g. $12.99, €10.00).
 */
function extractPrice(html: string): string | null {
  const patterns = [
    /\$[\d,]+(?:\.\d{2})?/,
    /€[\d,]+(?:\.\d{2})?/,
    /USD\s*[\d,]+(?:\.\d{2})?/i,
    /price["']?\s*[:=]\s*["']?([\d.,]+)/i,
    /data-price=["']([^"']+)["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return m[1] ?? m[0];
  }
  return null;
}

/**
 * Extract description from meta description, og:description, or first long paragraph.
 */
function extractDescription(html: string): string | null {
  const meta = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  if (meta) return meta[1].trim();
  const og = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
  if (og) return og[1].trim();
  const p = html.match(/<p[^>]*>([\s\S]{50,500})<\/p>/i);
  if (p) return stripTags(p[1]);
  return null;
}

/**
 * Extract image URLs (main content / product images; skip icons and logos).
 */
function extractImages(html: string, baseUrl: string): string[] {
  const seen = new Set<string>();
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const src = match[1].trim();
    if (src.startsWith("data:") || /icon|logo|favicon|sprite/i.test(src)) continue;
    const absolute = resolveUrl(src, baseUrl);
    seen.add(absolute);
  }
  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogImage) seen.add(resolveUrl(ogImage[1], baseUrl));
  return Array.from(seen);
}

/**
 * Extract SKU / Item # / Product # / Model # — normalize to one value.
 */
function extractSku(html: string): string | null {
  const dataSku = html.match(/data-sku=["']([^"']+)["']/i);
  if (dataSku) return dataSku[1].trim();
  const jsonSku = html.match(/"sku"\s*:\s*"([^"]+)"/i);
  if (jsonSku) return jsonSku[1].trim();
  const labelSku = html.match(/(?:sku|item\s*#?|product\s*#?|model\s*#?|part\s*#?)\s*[:=\s]*["']?([a-z0-9\-_]+)["']?/i);
  if (labelSku) return labelSku[1].trim();
  return null;
}

/**
 * Extract product-specific data from JSON-LD Product schema.
 */
function extractJsonLdProduct(html: string): Partial<RawProduct> {
  const out: Partial<RawProduct> = {};
  const ldJson = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of ldJson) {
    try {
      const raw = m[1].replace(/<!--[\s\S]*?-->/g, "").trim();
      const data = JSON.parse(raw) as { "@type"?: string; "@graph"?: unknown[]; name?: string; description?: string; sku?: string; brand?: { name?: string }; image?: string | string[]; offers?: { price?: string | number; availability?: string; priceCurrency?: string } | { price?: string | number; availability?: string; priceCurrency?: string }[] };
      const products: unknown[] = [];
      if (data["@type"] === "Product") products.push(data);
      if (Array.isArray(data["@graph"])) {
        for (const item of data["@graph"] as { "@type"?: string }[]) {
          if (item && item["@type"] === "Product") products.push(item);
        }
      }
      for (const p of products) {
        const prod = p as { name?: string; description?: string; sku?: string; brand?: { name?: string }; image?: string | string[]; offers?: { price?: string | number; availability?: string; priceCurrency?: string } | { price?: string | number; availability?: string; priceCurrency?: string }[] };
        if (prod.name && !out.name) out.name = String(prod.name).trim();
        if (prod.description && !out.description) out.description = String(prod.description).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (prod.sku && !out.sku) out.sku = String(prod.sku).trim();
        if (prod.brand && typeof prod.brand === "object" && prod.brand.name) out.brand = String(prod.brand.name).trim();
        const offers = Array.isArray(prod.offers) ? prod.offers[0] : prod.offers;
        if (offers && typeof offers === "object") {
          if (offers.availability && !out.availability) out.availability = String(offers.availability).replace(/^https?:\/\/schema\.org\//i, "").trim();
          if (offers.price != null && !out.price) {
            const price = offers.price;
            const currency = (offers as { priceCurrency?: string }).priceCurrency || "USD";
            out.price = typeof price === "number" ? `${currency === "USD" ? "$" : ""}${price}` : String(price);
          }
        }
      }
    } catch {
      // ignore invalid JSON
    }
  }
  return out;
}

/**
 * Extract long-form product content (main body text).
 */
function extractContent(html: string): string | null {
  const patterns = [
    /<div[^>]+class=["'][^"']*product[^"']*description[^"']*["'][^>]*>([\s\S]{100,5000})<\/div>/i,
    /<div[^>]+class=["'][^"']*product-single__description[^"']*["'][^>]*>([\s\S]{50,5000})<\/div>/i,
    /<div[^>]+itemprop=["']description["'][^>]*>([\s\S]{50,5000})<\/div>/i,
    /<div[^>]+data-product-description[^>]*>([\s\S]{50,5000})<\/div>/i,
    /<section[^>]+class=["'][^"']*product[^"']*content[^"']*["'][^>]*>([\s\S]{100,5000})<\/section>/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) {
      const text = stripTags(m[1]);
      if (text.length >= 80) return text.slice(0, 8000).trim();
    }
  }
  // Fallback: first block of consecutive paragraphs in main-like area
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) || html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const searchHtml = mainMatch ? mainMatch[1] : html;
  const paras = searchHtml.match(/<p[^>]*>([\s\S]{60,800})<\/p>/gi);
  if (paras && paras.length >= 1) {
    const combined = paras.slice(0, 15).map((p) => stripTags(p)).join(" ").trim();
    if (combined.length >= 80) return combined.slice(0, 8000);
  }
  return null;
}

/**
 * Extract product feature bullets (ul/li in product area).
 */
function extractFeatures(html: string): string[] {
  const features: string[] = [];
  const seen = new Set<string>();
  // Common product feature list patterns
  const ulPatterns = [
    /<div[^>]+class=["'][^"']*product[^"']*(?:feature|detail|highlight|bullet)[^"']*["'][^>]*>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/gi,
    /<ul[^>]+class=["'][^"']*product[^"']*features[^"']*["'][^>]*>([\s\S]*?)<\/ul>/gi,
    /<div[^>]+itemprop=["']description["'][^>]*>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/gi,
  ];
  for (const re of ulPatterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const lis = m[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);
      for (const li of lis) {
        const text = stripTags(li[1]).trim();
        if (text.length >= 10 && text.length <= 300 && !seen.has(text)) {
          seen.add(text);
          features.push(text);
        }
      }
    }
  }
  // Single ul with multiple li near "feature" or "detail" text
  const ulBlock = html.match(/<ul[^>]*>([\s\S]{50,3000})<\/ul>/gi);
  if (ulBlock && features.length === 0) {
    for (const block of ulBlock) {
      const before = html.slice(Math.max(0, html.indexOf(block) - 200), html.indexOf(block));
      if (!/feature|detail|highlight|include|what's|whats|benefit/i.test(before)) continue;
      const lis = block.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);
      for (const li of lis) {
        const text = stripTags(li[1]).trim();
        if (text.length >= 8 && text.length <= 300 && !seen.has(text)) {
          seen.add(text);
          features.push(text);
        }
      }
      if (features.length > 0) break;
    }
  }
  return features.slice(0, 30);
}

/**
 * Extract product specs only from semantic HTML: <table> th/td and <dl> dt/dd.
 * Does not scan the whole page for "key: value" (avoids CSS, JS, meta, and other page UI).
 */
function extractSpecs(html: string): Record<string, string> {
  const specs: Record<string, string> = {};

  const tables = html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi);
  for (const t of tables) {
    const rows = t[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
    for (const row of rows) {
      const cells = row[1].match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi);
      if (cells && cells.length >= 2) {
        const key = stripTags(cells[0]).replace(/:$/, "").trim();
        const value = stripTags(cells[1]).trim();
        if (key && value) specs[key] = value;
      }
    }
  }

  const dls = html.matchAll(/<dl[^>]*>([\s\S]*?)<\/dl>/gi);
  for (const dl of dls) {
    const pairs = dl[1].matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi);
    for (const p of pairs) {
      const key = stripTags(p[1]).replace(/:$/, "").trim();
      const value = stripTags(p[2]).trim();
      if (key && value) specs[key] = value;
    }
  }

  return specs;
}

/**
 * Extract one product page; returns raw shape for normalizer.
 * Fetches the product URL and extracts all product-specific details (no page UI).
 */
export async function extractProduct(url: string): Promise<RawProduct> {
  const html = await fetchHtml(url);

  const name = extractName(html);
  const price = extractPrice(html);
  const description = extractDescription(html);
  const images = extractImages(html, url);
  const sku = extractSku(html);
  const specs = extractSpecs(html);
  const content = extractContent(html);
  const features = extractFeatures(html);
  const jsonLd = extractJsonLdProduct(html);

  return {
    url,
    name: jsonLd.name ?? name ?? undefined,
    price: jsonLd.price ?? price ?? undefined,
    description: jsonLd.description ?? description ?? undefined,
    content: content ?? undefined,
    images,
    sku: jsonLd.sku ?? sku ?? undefined,
    brand: jsonLd.brand ?? undefined,
    availability: jsonLd.availability ?? undefined,
    features: features.length > 0 ? features : undefined,
    specs: Object.keys(specs).length > 0 ? specs : undefined,
  };
}
