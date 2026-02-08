import { fetchHtml } from "@/logic/products/extractors/fetch-html"
import { extractProduct } from "@/logic/products/extractors/extract-product"
import { parseJsonLd, findProductSchema } from "@/logic/products/extractors/parse-jsonld"

function trace(label: string, data: any) {
  console.log(`🔎 [TRACE] ${label}:`, data)
}

function urlTrace(stage: string, urlIn: string, urlOut: string | null, fn: string) {
  const out = urlOut ?? urlIn
  console.log(`[URLTRACE] ${stage}  IN=${urlIn}  OUT=${out}  FILE=scan-adapter.ts  FN=${fn}`)
}

export interface ProductRipResult {
  url: string
  product: any
}


export interface ProductOnlySnapshot {
  domain: string
  products: ProductRipResult[]
  extractedAt: string
}


function isShopifyStore(html: string): boolean {
  const lower = html.toLowerCase()
  return (
    lower.includes("cdn.shopify.com") ||
    lower.includes("/collections/") ||
    lower.includes("shopify.theme") ||
    lower.includes("window.shopify")
  )
}


function extractCollectionLinks(html: string, baseUrl: string): string[] {
  const collections = new Set<string>()
  const origin = new URL(baseUrl).origin
  const domain = new URL(baseUrl).hostname


  const regex = /<a[^>]+href=["']([^"']+)["']/gi
  let match


  while ((match = regex.exec(html)) !== null) {
    try {
      const url = new URL(match[1], origin)
      if (url.hostname !== domain) continue
      if (!url.pathname.includes("/collections/")) continue
      collections.add(`${origin}${url.pathname}`)
    } catch {}
  }


  return Array.from(collections)
}


function extractShopifyPdpUrlsFromHtml(html: string, baseUrl: string): string[] {
  const urls = new Set<string>()
  const origin = new URL(baseUrl).origin
  const domain = new URL(baseUrl).hostname


  const regex = /<a[^>]+href=["']([^"']+)["']/gi
  let match


  while ((match = regex.exec(html)) !== null) {
    try {
      const full = new URL(match[1], origin)
      if (full.hostname !== domain) continue
      if (!full.pathname.includes("/products/")) continue


      const parts = full.pathname.split("/").filter(Boolean)
      const idx = parts.lastIndexOf("products")
      if (idx === -1 || !parts[idx + 1]) continue


      const handle = parts[idx + 1]
      const canonical = `${origin}/products/${handle}`
      console.log("[URLTRACE] discovery_from_html  IN=" + match[1] + "  OUT=" + canonical + "  FILE=scan-adapter.ts  FN=extractShopifyPdpUrlsFromHtml")
      urls.add(canonical)
    } catch {}
  }


  return Array.from(urls)
}


async function discoverShopifyProductUrls(siteUrl: string, homepageHtml: string) {
  const origin = new URL(siteUrl).origin
  const productUrls = new Set<string>()
  const visitedCollections = new Set<string>()
  const queue: string[] = []


  queue.push(`${origin}/collections/all`)
  extractCollectionLinks(homepageHtml, siteUrl).forEach(u => queue.push(u))
  extractShopifyPdpUrlsFromHtml(homepageHtml, siteUrl).forEach(u => productUrls.add(u))


  const MAX_COLLECTIONS = 20


  while (queue.length > 0 && visitedCollections.size < MAX_COLLECTIONS) {
    const current = queue.shift()!
    if (visitedCollections.has(current)) continue
    visitedCollections.add(current)


    try {
      console.log(`[SCAN] Fetching Shopify collection: ${current}`)
      const html = await fetchHtml(current, {})
      extractShopifyPdpUrlsFromHtml(html, siteUrl).forEach(u => productUrls.add(u))
      extractCollectionLinks(html, siteUrl).forEach(u => {
        if (!visitedCollections.has(u)) queue.push(u)
      })
    } catch (err) {
      console.warn(`[SCAN] Failed collection: ${current}`)
    }
  }


  return Array.from(productUrls)
}


function extractProductLinks(html: string, baseUrl: string): string[] {
  const urls = new Set<string>()
  const origin = new URL(baseUrl).origin


  const linkRegex = /<a[^>]+href=["']([^"']*\/products\/[^"']+)["']/gi
  let match


  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const full = new URL(match[1], origin).href.split("?")[0]
      urls.add(full)
    } catch {}
  }


  return Array.from(urls)
}


function isLikelyProductPage(html: string): boolean {
  const jsonLd = parseJsonLd(html)
  if (findProductSchema(jsonLd)) return true
  const lower = html.toLowerCase()
  return lower.includes("add to cart") || lower.includes("price") || /\$\d+/.test(html)
}


export async function scanWebsite(siteUrl: string): Promise<any> {
  const domain = new URL(siteUrl).hostname.replace(/^www\./, "")
  console.log(`\n🔍 PRODUCT RIP STARTED for ${domain}\n`)


  const homepageHtml = await fetchHtml(siteUrl, {})
  let productUrls: string[] = []


  if (isShopifyStore(homepageHtml)) {
    console.log("[SCAN] Detected Shopify store, crawling collections")
    productUrls = await discoverShopifyProductUrls(siteUrl, homepageHtml)
  } else {
    console.log("[SCAN] Generic store, scanning homepage links")
    productUrls = extractProductLinks(homepageHtml, siteUrl)
  }


  console.log("🧪 PDP URLs Found:", productUrls)
  console.log(`📦 Found ${productUrls.length} potential product URLs\n`)

  productUrls.forEach((u, i) => urlTrace("discovery", u, u, "scanWebsite"))
  const products: ProductRipResult[] = []
  let success = 0, failed = 0, skipped = 0


  for (const url of productUrls) {
    try {
      urlTrace("loop_entry", url, null, "scanWebsite")
      trace("RAW URL", url)
      const normalizedUrl = url.split("?")[0] // 🔥 DO NOT REBUILD HANDLE
      urlTrace("after_strip_query", url, normalizedUrl, "scanWebsite")
      trace("NORMALIZED BY", "strip ?query only")
      trace("NORMALIZED RESULT", normalizedUrl)
      urlTrace("before_fetchHtml", normalizedUrl, normalizedUrl, "scanWebsite")
      trace("FETCHING", normalizedUrl)
      console.log(`➡️ Fetching product page: ${normalizedUrl}`)


      const html = await fetchHtml(normalizedUrl, {})
      trace("FETCH STATUS", html ? "SUCCESS" : "EMPTY HTML")

      const likely = isLikelyProductPage(html)
      trace("IS_LIKELY_PRODUCT_PAGE", likely)
      if (!likely) {
        console.log("⏭ Skipped (not real product page)")
        skipped++
        continue
      }


      urlTrace("before_extractProduct", normalizedUrl, normalizedUrl, "scanWebsite")
      const product = await extractProduct(normalizedUrl)
      if (!product || !product.title) {
        console.log("⚠️ Product extraction returned empty")
        trace("PRODUCT TITLE FOUND", null)
        failed++
        continue
      }


      trace("PRODUCT TITLE FOUND", product.title || null)
      products.push({ url: normalizedUrl, product })
      success++


      console.log(`✅ Extracted: ${product.title}`)
      console.log(`   Images: ${product.images?.length || 0}`)
      console.log(`   Specs: ${product.specs?.length || 0}`)
      console.log(`   Description length: ${product.description?.length || 0}\n`)


      await new Promise(r => setTimeout(r, 400))
    } catch {
      console.log(`❌ Failed to process ${url}`)
      failed++
    }
  }


  console.log("\n================ PRODUCT RIP SUMMARY ================")
  console.log(`🌐 Domain: ${domain}`)
  console.log(`🔗 Product URLs Found: ${productUrls.length}`)
  console.log(`✅ Products Successfully Extracted: ${success}`)
  console.log(`⚠️ Skipped: ${skipped}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📦 Final Product Count Stored: ${products.length}`)
  console.log("=====================================================\n")


  const snapshot: ProductOnlySnapshot = {
    domain,
    products,
    extractedAt: new Date().toISOString(),
  }


  return {
    url: siteUrl,
    extractedAt: new Date().toISOString(),
    rawData: {
      type: "product-only",
      productRip: snapshot,
    },
  }
}


