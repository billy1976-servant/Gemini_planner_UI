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
 * Extract specs: <table> th/td, <dl> dt/dd, key: value lines.
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

  const keyValuePairs = html.matchAll(/\b([a-z][a-z\s]{1,24}):\s*([^\n<]{1,200})/gi);
  for (const m of keyValuePairs) {
    const key = m[1].trim().replace(/:$/, "");
    const value = m[2].replace(/<[^>]+>/g, "").trim();
    if (key.length >= 2 && value.length >= 1 && !specs[key]) specs[key] = value;
  }

  return specs;
}

/**
 * Extract one product page; returns raw shape for normalizer.
 */
export async function extractProduct(url: string): Promise<RawProduct> {
  const html = await fetchHtml(url);
  const name = extractName(html);
  const price = extractPrice(html);
  const description = extractDescription(html);
  const images = extractImages(html, url);
  const sku = extractSku(html);
  const specs = extractSpecs(html);

  return {
    url,
    name: name ?? undefined,
    price: price ?? undefined,
    description: description ?? undefined,
    images,
    sku: sku ?? undefined,
    specs: Object.keys(specs).length > 0 ? specs : undefined,
  };
}
