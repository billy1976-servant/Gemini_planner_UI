/**
 * Normalize Adapter - V2: Extracts one product per PDP
 *
 * Upgraded to:
 * - Extract products from PDP pages (one product per PDP)
 * - Extract category paths from URLs
 * - Build proper product graph structure
 */

import { normalizeProduct } from "@/logic/products/product-normalizer";
import { extractProduct } from "@/logic/products/extractors/extract-product";
import type { SiteSnapshot } from "../compile-website";
import type {
  ProductGraph,
  Product,
  CategoryExtraction,
} from "@/logic/products/product-types";

/**
 * Extract category path from URL
 * 
 * Returns clean, hierarchical categories:
 * - effects/pedals, effects/amplifiers
 * - guitars/electric, guitars/acoustic
 * - guitars, effects (general)
 * - uncategorized (fallback)
 */
function extractCategoryPath(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const pathParts = pathname.split("/").filter(Boolean);
    
    // Remove product-specific parts
    const categoryParts = pathParts.filter(part => 
      !part.match(/^p-|^product-|^item-|^dp-/i) &&
      part !== "products" &&
      part !== "product"
    );
    
    // Combine pathname and product slug for keyword detection
    const fullPath = pathname + " " + categoryParts.join(" ");
    
    // === EFFECTS CATEGORY DETECTION ===
    // Check for effects/pedals keywords
    const pedalKeywords = ["pedal", "fuzz", "distortion", "phaser", "boost", "effects-pedal", "effects"];
    const isPedal = pedalKeywords.some(keyword => fullPath.includes(keyword));
    
    // Check for amplifiers
    const ampKeywords = ["amplifier", "amplifiers", "amp", "combo", "head", "rectifier", "boogie"];
    const isAmplifier = ampKeywords.some(keyword => fullPath.includes(keyword));
    
    if (isPedal) {
      return "effects/pedals";
    }
    if (isAmplifier) {
      return "effects/amplifiers";
    }
    
    // General effects category (if path contains "effects" but not specific enough)
    if (fullPath.includes("effects") || fullPath.includes("maestro")) {
      return "effects";
    }
    
    // === GUITARS CATEGORY DETECTION ===
    // Check for electric guitars
    const electricKeywords = ["electric", "es-", "sg", "les-paul", "flying-v", "explorer", "firebird"];
    const isElectric = electricKeywords.some(keyword => fullPath.includes(keyword));
    
    // Check for acoustic guitars
    const acousticKeywords = ["acoustic", "j-", "hummingbird", "dove"];
    const isAcoustic = acousticKeywords.some(keyword => fullPath.includes(keyword));
    
    // Check for general guitar keywords
    const guitarKeywords = ["guitar", "gibson-custom", "epiphone"];
    const isGuitar = guitarKeywords.some(keyword => fullPath.includes(keyword));
    
    if (isElectric) {
      return "guitars/electric";
    }
    if (isAcoustic) {
      return "guitars/acoustic";
    }
    if (isGuitar) {
      return "guitars";
    }
    
    // === COLLECTIONS HANDLING ===
    // Collapse collections/* into appropriate category
    if (categoryParts[0] === "collections") {
      const collectionPath = categoryParts.slice(1).join("/").toLowerCase();
      
      // Map collection patterns to categories
      if (collectionPath.includes("electric") || collectionPath.includes("es-") || collectionPath.includes("sg")) {
        return "guitars/electric";
      }
      if (collectionPath.includes("acoustic")) {
        return "guitars/acoustic";
      }
      if (collectionPath.includes("effects") || collectionPath.includes("pedal") || collectionPath.includes("amplifier")) {
        if (collectionPath.includes("pedal") || collectionPath.includes("effects")) {
          return "effects/pedals";
        }
        if (collectionPath.includes("amplifier") || collectionPath.includes("amp")) {
          return "effects/amplifiers";
        }
        return "effects";
      }
      if (collectionPath.includes("guitar")) {
        return "guitars";
      }
      
      // If collection doesn't match known patterns, try to infer from name
      // e.g., "collections/gibson-es-electric-spanish-guitars" → "guitars/electric"
      if (collectionPath.includes("gibson") || collectionPath.includes("epiphone")) {
        return "guitars";
      }
    }
    
    // === FALLBACK ===
    // If we have path parts but couldn't categorize, return cleaned path
    if (categoryParts.length > 0) {
      // Last resort: return first meaningful part
      return categoryParts[0];
    }
    
    return "uncategorized";
  } catch {
    return "uncategorized";
  }
}

/**
 * Get domain brand name from URL
 */
function getDomainBrand(url: string): string {
  try {
    const domain = new URL(url).hostname.replace(/^www\./, "");
    return domain.split(".")[0]; // e.g., "gibson" from "gibson.com"
  } catch {
    return "unknown";
  }
}

/**
 * Hash URL to create product ID
 */
function hashUrl(url: string): string {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `prod_${Math.abs(hash).toString(36)}`;
}

/**
 * Extract H1 text from HTML
 */
function extractH1(html: string): string | null {
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match) {
    return h1Match[1].replace(/<[^>]*>/g, "").trim();
  }
  return null;
}

/**
 * Extract price from HTML
 */
function extractPrice(html: string): { amount: number; currency: string } | undefined {
  // Try $123 pattern
  const dollarMatch = html.match(/\$(\d+(?:\.\d{2})?)/);
  if (dollarMatch) {
    return {
      amount: parseFloat(dollarMatch[1]),
      currency: "USD",
    };
  }
  
  // Try USD 123 pattern
  const usdMatch = html.match(/usd\s*:?\s*(\d+(?:\.\d{2})?)/i);
  if (usdMatch) {
    return {
      amount: parseFloat(usdMatch[1]),
      currency: "USD",
    };
  }
  
  // Try price: $123 pattern
  const priceMatch = html.match(/price[:\s]*\$?(\d+(?:\.\d{2})?)/i);
  if (priceMatch) {
    return {
      amount: parseFloat(priceMatch[1]),
      currency: "USD",
    };
  }
  
  return undefined;
}

/**
 * Extract product gallery images from HTML
 */
function extractGalleryImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];
  
  // Try to find product gallery container
  const galleryRegex = /<(?:div|section)[^>]*(?:class|id)=["'][^"']*(?:gallery|product-image|product-images)[^"']*["'][^>]*>(.*?)<\/(?:div|section)>/gis;
  let galleryMatch;
  
  while ((galleryMatch = galleryRegex.exec(html)) !== null) {
    const galleryHtml = galleryMatch[1];
    const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch;
    
    while ((imgMatch = imgRegex.exec(galleryHtml)) !== null) {
      try {
        const fullUrl = new URL(imgMatch[1], baseUrl).href;
        if (!images.includes(fullUrl)) {
          images.push(fullUrl);
        }
      } catch {
        // Skip invalid URLs
      }
    }
  }
  
  // If no gallery found, extract all images
  if (images.length === 0) {
    const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch;
    
    while ((imgMatch = imgRegex.exec(html)) !== null && images.length < 10) {
      try {
        const fullUrl = new URL(imgMatch[1], baseUrl).href;
        // Skip very small images (likely icons)
        if (!fullUrl.includes("icon") && !fullUrl.includes("logo") && !images.includes(fullUrl)) {
          images.push(fullUrl);
        }
      } catch {
        // Skip invalid URLs
      }
    }
  }
  
  return images.slice(0, 10); // Limit to 10 images
}

/**
 * Extract product description from HTML
 */
function extractProductDescription(html: string): string | undefined {
  // Try product description containers
  const descSelectors = [
    /<(?:div|section)[^>]*(?:class|id)=["'][^"']*description[^"']*["'][^>]*>(.*?)<\/(?:div|section)>/gis,
    /<(?:div|section)[^>]*(?:class|id)=["'][^"']*product-description[^"']*["'][^>]*>(.*?)<\/(?:div|section)>/gis,
  ];
  
  for (const selector of descSelectors) {
    const match = selector.exec(html);
    if (match) {
      const text = match[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      if (text.length > 50) {
        return text.substring(0, 500); // Limit length
      }
    }
  }
  
  // Fallback: extract first few paragraphs
  const paraRegex = /<p[^>]*>(.*?)<\/p>/gi;
  const paragraphs: string[] = [];
  let paraMatch;
  
  while ((paraMatch = paraRegex.exec(html)) !== null && paragraphs.length < 3) {
    const text = paraMatch[1].replace(/<[^>]*>/g, " ").trim();
    if (text.length > 20) {
      paragraphs.push(text);
    }
  }
  
  return paragraphs.length > 0 ? paragraphs.join(" ") : undefined;
}

/**
 * Extract structured product data directly from a PDP URL (no page model)
 */
async function extractShopifyProductFromUrl(pdpUrl: string): Promise<Product | null> {
  try {
    const baseUrl = pdpUrl;
    const brand = getDomainBrand(pdpUrl);

    // Fetch HTML for this PDP
    const { fetchHtml } = await import("@/logic/products/extractors/fetch-html");
    const html = await fetchHtml(pdpUrl);

    const name = extractH1(html) || "Product";
    const price = extractPrice(html);
    const images = extractGalleryImages(html, baseUrl);
    const description = extractProductDescription(html);
    const categoryPath = extractCategoryPath(pdpUrl);

    // Build price with source (required by ProductPriceContract)
    const priceWithSource = price
      ? {
          amount: price.amount,
          currency: price.currency,
          source: {
            label: "Extracted from page",
            url: pdpUrl,
            snippet: `Price found on ${pdpUrl}`,
            kind: "price" as const,
          },
        }
      : undefined;

    // Build description blocks (required by ProductContract)
    const descriptionBlocks = description
      ? [
          {
            heading: undefined,
            text: description,
            sourceUrl: pdpUrl, // Required by ProductDescriptionBlockContract
          },
        ]
      : [];

    return {
      id: hashUrl(pdpUrl),
      brand,
      name,
      category: categoryPath,
      url: pdpUrl,
      price: priceWithSource,
      images: images.map((url) => ({
        url,
        alt: name,
        sourceUrl: pdpUrl, // Required by ProductImageContract
      })),
      descriptionBlocks, // Required by ProductContract (not description)
      attributes: {},
      specs: [], // Required by ProductContract (not specifications)
      sources: [
        {
          label: "Extracted from page",
          url: pdpUrl,
          snippet: `Product data extracted from ${pdpUrl}`,
          kind: "description" as const, // Must be one of: "spec" | "description" | "support" | "image" | "price"
        },
      ],
    };
  } catch {
    return null;
  }
}

/**
 * Normalize site snapshot to product graph (V2)
 */
export async function normalizeToProductGraph(
  siteSnapshot: SiteSnapshot
): Promise<ProductGraph> {
  const products: Product[] = [];
  const categories: string[] = [];
  const brands: string[] = [];
  const sourceUrls: string[] = [];

  // Product-only snapshots are the new canonical path
  // If scan emitted a product-only rip, normalize directly from that
  if (siteSnapshot.rawData?.type === "product-only" && siteSnapshot.rawData.productRip) {
    const rip = siteSnapshot.rawData.productRip as {
      domain: string;
      products: Array<{ url: string; product: any }>;
      extractedAt: string;
    };

    console.log(`[NORMALIZE] Normalizing ${rip.products.length} ripped products into product graph`);

    for (const entry of rip.products) {
      const normalized = normalizeProduct(entry.product);
      if (normalized.product) {
        const product: Product = {
          ...normalized.product,
          id: hashUrl(entry.url),
          url: entry.url,
          category: extractCategoryPath(entry.url),
        };

        products.push(product);
        sourceUrls.push(entry.url);

        if (product.brand) brands.push(product.brand);
        const categoryPath = extractCategoryPath(entry.url);
        if (categoryPath && categoryPath !== "uncategorized") {
          categories.push(categoryPath);
        }
      }
    }

    console.log(`[NORMALIZE] Extracted ${products.length} products from product-only snapshot`);
  }

  // Legacy support: If we have old structure, use it
  if (products.length === 0) {
    // If we have a product extraction, normalize it
    if (
      siteSnapshot.rawData?.type === "product" &&
      siteSnapshot.rawData?.extraction
    ) {
      const rawExtraction = siteSnapshot.rawData.extraction;
      const normalized = normalizeProduct(rawExtraction);

      if (normalized.product) {
        products.push(normalized.product);
        if (normalized.product.brand) {
          brands.push(normalized.product.brand);
        }
        if (normalized.product.category) {
          categories.push(normalized.product.category);
        }
      }
    }

    // If we have a category extraction, extract category name
    if (
      siteSnapshot.rawData?.type === "category" &&
      siteSnapshot.rawData?.extraction
    ) {
      const categoryExtraction =
        siteSnapshot.rawData.extraction as CategoryExtraction;
      // Extract category from URL or use default
      const categoryName =
        categoryExtraction.categoryUrl
          .split("/")
          .filter(Boolean)
          .pop() || "uncategorized";
      categories.push(categoryName);
    }

    if (siteSnapshot.url) {
      sourceUrls.push(siteSnapshot.url);
    }
  }

  // Deduplicate
  const uniqueCategories = Array.from(new Set(categories));
  const uniqueBrands = Array.from(new Set(brands));

  return {
    products,
    categories: uniqueCategories,
    brands: uniqueBrands,
    extractedAt: new Date().toISOString(),
    sourceUrls: sourceUrls.length > 0 ? sourceUrls : [siteSnapshot.url || ""],
  };
}

