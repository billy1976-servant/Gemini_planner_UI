/**
 * Web2Extractor V2 — site crawl and product URL discovery.
 * Detects Shopify vs generic HTML, follows collections/pagination, no duplicates.
 * Standalone: no imports from old pipeline.
 */

const USER_AGENT = "Mozilla/5.0 (compatible; Web2ExtractorV2/1)";

export type StoreType = "shopify" | "generic";

export function normalizeSiteUrl(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://")) return "https://" + trimmed.slice(7);
  if (trimmed.startsWith("https://")) return trimmed;
  const host = trimmed.replace(/^www\./, "");
  return "https://" + host;
}

function getOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

export function detectStoreType(html: string): StoreType {
  const lower = html.toLowerCase();
  if (
    lower.includes("shopify") ||
    lower.includes("cdn.shopify") ||
    lower.includes("shopify-section")
  ) {
    return "shopify";
  }
  return "generic";
}

/**
 * Extract absolute URLs from HTML that match a path pattern.
 */
function extractLinks(html: string, baseUrl: string, pathContains: string): string[] {
  const origin = getOrigin(baseUrl);
  const seen = new Set<string>();
  const regex = /<a[^>]+href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    try {
      const href = match[1].trim();
      if (!href.includes(pathContains)) continue;
      const absolute = new URL(href, origin).href;
      const withoutHash = absolute.split("#")[0];
      const withoutQuery = withoutHash.split("?")[0];
      seen.add(withoutQuery);
    } catch {
      // skip invalid URLs
    }
  }
  return Array.from(seen);
}

/**
 * Get product URLs from a single HTML page (any URL that contains /products/ or /product/).
 */
function productUrlsFromHtml(html: string, baseUrl: string): string[] {
  const origin = getOrigin(baseUrl);
  const seen = new Set<string>();
  const regex = /<a[^>]+href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    try {
      const href = match[1].trim();
      if (!href.includes("/products/") && !href.includes("/product/")) continue;
      const absolute = new URL(href, origin).href;
      const clean = absolute.split("#")[0].split("?")[0];
      seen.add(clean);
    } catch {
      // skip
    }
  }
  return Array.from(seen);
}

/**
 * Find pagination / next-page links (same path with page= or /page/).
 */
function nextPageLinks(html: string, baseUrl: string): string[] {
  const origin = getOrigin(baseUrl);
  const seen = new Set<string>();
  const regex = /<a[^>]+href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    try {
      const href = match[1].trim();
      if (
        /[?&]page=\d+/.test(href) ||
        /\/page\/\d+/.test(href) ||
        /rel=["']?next["']?/i.test(html.slice(Math.max(0, match.index - 50), match.index + 200))
      ) {
        const absolute = new URL(href, origin).href;
        seen.add(absolute.split("#")[0].split("?")[0]);
      }
    } catch {
      // skip
    }
  }
  return Array.from(seen);
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
}

const MAX_COLLECTION_PAGES = 40;

/**
 * Crawl Shopify: start at /collections/all, follow pagination, collect all product URLs.
 */
async function crawlShopify(siteUrl: string): Promise<string[]> {
  const origin = getOrigin(siteUrl);
  const productUrls = new Set<string>();
  const toFetch = new Set<string>([`${origin}/collections/all`]);
  const fetched = new Set<string>();

  while (toFetch.size > 0 && fetched.size < MAX_COLLECTION_PAGES) {
    const url = toFetch.values().next().value as string;
    toFetch.delete(url);
    if (fetched.has(url)) continue;
    fetched.add(url);

    try {
      const html = await fetchHtml(url);
      const products = productUrlsFromHtml(html, siteUrl);
      products.forEach((u) => productUrls.add(u));

      const nextPages = nextPageLinks(html, siteUrl);
      nextPages.forEach((u) => toFetch.add(u));

      const collectionLinks = extractLinks(html, siteUrl, "/collections/");
      collectionLinks.forEach((u) => toFetch.add(u));
    } catch (err) {
      console.warn("[crawler] Failed:", url, (err as Error).message);
    }
  }

  return Array.from(productUrls);
}

/** True if URL looks like a listing index (e.g. /shop, /products) not a product PDP. */
function isListingOrPaginationUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.replace(/\/$/, "") || "/";
    if (path === "/" || path === "/shop" || path === "/products") return true;
    if (/\/page\/\d+/.test(path) || path.includes("page=")) return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * Crawl generic site: start at homepage, follow listing/shop and pagination.
 */
async function crawlGeneric(siteUrl: string): Promise<string[]> {
  const origin = getOrigin(siteUrl);
  const productUrls = new Set<string>();
  const toFetch = new Set<string>([siteUrl]);
  const fetched = new Set<string>();
  const maxPages = 50;
  let fetchedCount = 0;

  while (toFetch.size > 0 && fetchedCount < maxPages) {
    const url = toFetch.values().next().value as string;
    toFetch.delete(url);
    if (fetched.has(url)) continue;
    fetched.add(url);
    fetchedCount++;

    try {
      const html = await fetchHtml(url);
      const products = productUrlsFromHtml(html, siteUrl);
      products.forEach((u) => productUrls.add(u));

      const nextPages = nextPageLinks(html, siteUrl);
      nextPages.forEach((u) => toFetch.add(u));
      for (const u of extractLinks(html, siteUrl, "/shop")) {
        if (isListingOrPaginationUrl(u)) toFetch.add(u);
      }
      for (const u of extractLinks(html, siteUrl, "/products")) {
        if (isListingOrPaginationUrl(u)) toFetch.add(u);
      }
    } catch (err) {
      console.warn("[crawler] Failed:", url, (err as Error).message);
    }
  }

  return Array.from(productUrls);
}

/**
 * Discover all product URLs for a site. Auto-detects Shopify vs generic.
 */
export async function discoverProductUrls(siteUrl: string): Promise<string[]> {
  const normalized = normalizeSiteUrl(siteUrl);
  if (!normalized) return [];

  console.log("[crawler] Fetching homepage to detect store type...");
  const homepageHtml = await fetchHtml(normalized);
  const storeType = detectStoreType(homepageHtml);
  console.log("[crawler] Detected:", storeType);

  const productUrls =
    storeType === "shopify"
      ? await crawlShopify(normalized)
      : await crawlGeneric(normalized);

  const fromHome = productUrlsFromHtml(homepageHtml, normalized);
  fromHome.forEach((u) => productUrls.push(u));

  const unique = Array.from(new Set(productUrls));
  console.log("[crawler] Found", unique.length, "product URLs");
  return unique;
}
