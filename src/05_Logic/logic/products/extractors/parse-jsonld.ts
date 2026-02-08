/**
 * Parse JSON-LD - Extract structured data from JSON-LD scripts
 * 
 * Priority:
 * 1) JSON-LD Product schema (name, images, offers price)
 * 2) Other structured data schemas
 */

import type { RawExtraction } from "../product-types";

/**
 * Extract JSON-LD data from HTML
 */
export function parseJsonLd(html: string): any[] {
  const jsonLdData: any[] = [];
  
  // Match all <script type="application/ld+json"> tags
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
  
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const jsonText = match[1].trim();
      const data = JSON.parse(jsonText);
      
      // Handle both single objects and arrays
      if (Array.isArray(data)) {
        jsonLdData.push(...data);
      } else {
        jsonLdData.push(data);
      }
    } catch (error) {
      // Skip invalid JSON
      console.warn("[parseJsonLd] Failed to parse JSON-LD:", error);
    }
  }
  
  return jsonLdData;
}

/**
 * Find Product schema in JSON-LD data
 */
export function findProductSchema(jsonLdData: any[]): any | null {
  // Look for Product schema (most specific)
  const product = jsonLdData.find(
    (item) =>
      item["@type"] === "Product" ||
      (Array.isArray(item["@type"]) && item["@type"].includes("Product"))
  );
  
  if (product) {
    return product;
  }
  
  // Fallback: Look for any schema with product-like fields
  const productLike = jsonLdData.find(
    (item) =>
      item.name &&
      (item.image || item.offers || item.aggregateRating)
  );
  
  return productLike || null;
}

/**
 * Extract product data from JSON-LD Product schema
 */
export function extractFromJsonLd(productSchema: any): Partial<RawExtraction> {
  const result: Partial<RawExtraction> = {};
  
  // Extract name
  if (productSchema.name) {
    result.jsonLd = { ...result.jsonLd, name: productSchema.name };
  }
  
  // Extract brand
  if (productSchema.brand) {
    const brand = typeof productSchema.brand === "string"
      ? productSchema.brand
      : productSchema.brand.name || productSchema.brand["@type"];
    result.jsonLd = { ...result.jsonLd, brand: { name: brand } };
  }
  
  // Extract category
  if (productSchema.category) {
    const category = typeof productSchema.category === "string"
      ? productSchema.category
      : productSchema.category.name || productSchema.category;
    result.jsonLd = { ...result.jsonLd, category };
  }
  
  // Extract images
  if (productSchema.image) {
    const images = Array.isArray(productSchema.image)
      ? productSchema.image
      : [productSchema.image];
    
    result.images = images.map((img: any) => {
      const url = typeof img === "string" ? img : img.url || img["@id"] || img;
      return {
        url: normalizeImageUrl(url),
        alt: typeof img === "object" ? img.caption || img.alt || "" : "",
      };
    });
  }
  
  // Extract price from offers
  if (productSchema.offers) {
    const offers = Array.isArray(productSchema.offers)
      ? productSchema.offers
      : [productSchema.offers];
    
    // Find the best offer (prefer price, then priceRange)
    const offer = offers.find((o: any) => o.price) || offers[0];
    
    if (offer) {
      if (offer.price) {
        const price = typeof offer.price === "string"
          ? parseFloat(offer.price.replace(/[^\d.,]/g, "").replace(",", "."))
          : offer.price;
        
        const currency = offer.priceCurrency || offer.currency || "USD";
        
        result.price = {
          amount: price,
          currency,
          text: `${currency} ${price}`,
        };
      } else if (offer.priceRange) {
        // Price range (e.g., "$100 - $200")
        const range = offer.priceRange;
        const min = typeof range === "string"
          ? parseFloat(range.split("-")[0].replace(/[^\d.,]/g, "").replace(",", "."))
          : range.min || 0;
        const max = typeof range === "string"
          ? parseFloat(range.split("-")[1]?.replace(/[^\d.,]/g, "").replace(",", ".") || String(min))
          : range.max || min;
        
        const currency = offer.priceCurrency || offer.currency || "USD";
        
        result.price = {
          amount: min,
          currency,
          text: `${currency} ${min} - ${max}`,
        };
      }
    }
  }
  
  // Extract description
  if (productSchema.description) {
    const description = typeof productSchema.description === "string"
      ? productSchema.description
      : productSchema.description.text || "";
    
    if (description) {
      result.descriptionBlocks = [
        {
          text: description,
        },
      ];
    }
  }
  
  // Store full JSON-LD for reference
  result.jsonLd = { ...result.jsonLd, ...productSchema };
  
  return result;
}

/**
 * Normalize image URL (handle relative URLs)
 */
function normalizeImageUrl(url: string, baseUrl?: string): string {
  if (!url) {
    return "";
  }
  
  // Already absolute URL
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  
  // Data URL
  if (url.startsWith("data:")) {
    return url;
  }
  
  // Relative URL - resolve against base URL if provided
  if (baseUrl) {
    try {
      return new URL(url, baseUrl).href;
    } catch {
      // Invalid base URL, return as-is
      return url;
    }
  }
  
  return url;
}

/**
 * Extract meta tags from HTML
 */
export function parseMetaTags(html: string): Record<string, string> {
  const metaTags: Record<string, string> = {};
  
  // Match <meta> tags
  const metaRegex = /<meta[^>]*>/gi;
  let match;
  
  while ((match = metaRegex.exec(html)) !== null) {
    const metaTag = match[0];
    
    // Extract property/content or name/content
    const propertyMatch = metaTag.match(/property=["']([^"']+)["']/i);
    const nameMatch = metaTag.match(/name=["']([^"']+)["']/i);
    const contentMatch = metaTag.match(/content=["']([^"']+)["']/i);
    
    if (contentMatch) {
      const key = propertyMatch
        ? propertyMatch[1]
        : nameMatch
        ? nameMatch[1]
        : null;
      
      if (key) {
        metaTags[key] = contentMatch[1];
      }
    }
  }
  
  return metaTags;
}
