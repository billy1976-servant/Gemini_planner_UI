/**
 * Extract Product - Extract product data from product pages
 * 
 * Priority:
 * 1) JSON-LD Product schema (name, images, offers price)
 * 2) Spec tables (key/value rows) with row-level source snippets
 * 3) Description blocks with source snippets
 * 4) Support links (manuals, specs PDFs) discovered on the page
 */

import { fetchHtml, validateUrl } from "./fetch-html";
import { parseJsonLd, findProductSchema, extractFromJsonLd, parseMetaTags } from "./parse-jsonld";
import type { RawExtraction } from "../product-types";
import { ProductRepository } from "../product-repository";

export type ProductExtractorConfig = {
  selectors?: {
    specTable?: string[]; // CSS selectors for spec tables
    description?: string[]; // CSS selectors for description blocks
    supportLinks?: string[]; // CSS selectors for support/manual links
  };
};

const DEFAULT_CONFIG: ProductExtractorConfig = {
  selectors: {
    specTable: [
      "table.specs",
      "table.specifications",
      ".spec-table",
      ".product-specs",
      "dl.specs", // Definition list
    ],
    description: [
      ".product-description",
      ".description",
      "#description",
      ".product-details",
    ],
    supportLinks: [
      "a[href*='manual']",
      "a[href*='spec']",
      "a[href*='download']",
      "a[href*='pdf']",
      ".support-links a",
    ],
  },
};

/**
 * Extract product data from product page
 */
export async function extractProduct(
  productUrl: string,
  config: ProductExtractorConfig = {},
  repository?: ProductRepository
): Promise<RawExtraction> {
  // Validate URL
  if (!validateUrl(productUrl)) {
    throw new Error(`Invalid product URL: ${productUrl}`);
  }
  
  // Check cache first
  let html: string;
  if (repository) {
    const cachedHtml = repository.getCachedHtml(productUrl);
    if (cachedHtml) {
      html = cachedHtml;
    } else {
      html = await fetchHtml(productUrl);
      await repository.cacheHtml(productUrl, html);
    }
  } else {
    html = await fetchHtml(productUrl);
  }
  
  // Extract from HTML
  return extractFromHtml(html, productUrl, config);
}

/**
 * Extract product data from HTML
 */
function extractFromHtml(
  html: string,
  productUrl: string,
  config: ProductExtractorConfig
): RawExtraction {
  const opts = { ...DEFAULT_CONFIG, ...config };
  const extraction: RawExtraction = {
    url: productUrl,
    html, // Store HTML for debugging
    extractedAt: new Date().toISOString(),
  };
  
  // Extract JSON-LD
  const jsonLdData = parseJsonLd(html);
  const productSchema = findProductSchema(jsonLdData);
  
  if (productSchema) {
    const jsonLdExtraction = extractFromJsonLd(productSchema);
    Object.assign(extraction, jsonLdExtraction);
  }
  
  // Extract meta tags
  extraction.metaTags = parseMetaTags(html);
  
  // Extract spec table
  extraction.specTable = extractSpecTable(html, opts);
  
  // Extract description blocks
  if (!extraction.descriptionBlocks || extraction.descriptionBlocks.length === 0) {
    extraction.descriptionBlocks = extractDescriptionBlocks(html, opts);
  }
  
  // Extract support links
  extraction.supportLinks = extractSupportLinks(html, opts);
  
  // Extract additional images (if not already extracted from JSON-LD)
  if (!extraction.images || extraction.images.length === 0) {
    extraction.images = extractImages(html, productUrl);
  }
  
  return extraction;
}

/**
 * Extract spec table from HTML
 */
function extractSpecTable(
  html: string,
  config: ProductExtractorConfig
): Array<{ key: string; value: string; rowHtml?: string }> {
  const specs: Array<{ key: string; value: string; rowHtml?: string }> = [];
  
  // Try each selector
  for (const selector of config.selectors?.specTable || []) {
    // Simple regex-based extraction (for server-side, no DOM parser)
    // Match table rows: <tr><td>Key</td><td>Value</td></tr>
    const tableRegex = new RegExp(
      `<table[^>]*>.*?</table>`,
      "gis"
    );
    
    const tableMatch = html.match(tableRegex);
    if (tableMatch) {
      const tableHtml = tableMatch[0];
      
      // Extract rows
      const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gis;
      let rowMatch;
      
      while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
        const rowHtml = rowMatch[1];
        
        // Extract cells
        const cellRegex = /<t[dh][^>]*>(.*?)<\/t[dh]>/gi;
        const cells: string[] = [];
        let cellMatch;
        
        while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
          const cellText = cellMatch[1]
            .replace(/<[^>]*>/g, "")
            .replace(/\s+/g, " ")
            .trim();
          if (cellText) {
            cells.push(cellText);
          }
        }
        
        // If we have at least 2 cells, treat as key-value
        if (cells.length >= 2) {
          specs.push({
            key: cells[0],
            value: cells.slice(1).join(" "),
            rowHtml,
          });
        }
      }
    }
    
    // Also try definition lists: <dl><dt>Key</dt><dd>Value</dd></dl>
    const dlRegex = new RegExp(
      `<dl[^>]*>.*?</dl>`,
      "gis"
    );
    
    const dlMatch = html.match(dlRegex);
    if (dlMatch) {
      const dlHtml = dlMatch[0];
      
      // Extract dt/dd pairs
      const dtRegex = /<dt[^>]*>(.*?)<\/dt>\s*<dd[^>]*>(.*?)<\/dd>/gis;
      let dtMatch;
      
      while ((dtMatch = dtRegex.exec(dlHtml)) !== null) {
        const key = dtMatch[1].replace(/<[^>]*>/g, "").trim();
        const value = dtMatch[2].replace(/<[^>]*>/g, "").trim();
        
        if (key && value) {
          specs.push({
            key,
            value,
          });
        }
      }
    }
  }
  
  return specs;
}

/**
 * Extract description blocks from HTML
 */
function extractDescriptionBlocks(
  html: string,
  config: ProductExtractorConfig
): Array<{ heading?: string; text: string }> {
  const blocks: Array<{ heading?: string; text: string }> = [];
  
  // Try each selector
  for (const selector of config.selectors?.description || []) {
    // Simple regex-based extraction
    // Match div/section with class matching selector
    const classMatch = selector.match(/\.([\w-]+)/);
    if (classMatch) {
      const className = classMatch[1];
      const regex = new RegExp(
        `<[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>(.*?)<\/[^>]+>`,
        "gis"
      );
      
      let match;
      while ((match = regex.exec(html)) !== null) {
        const content = match[1]
          .replace(/<script[^>]*>.*?<\/script>/gis, "")
          .replace(/<style[^>]*>.*?<\/style>/gis, "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        
        if (content && content.length > 20) {
          // Try to extract heading
          const headingMatch = content.match(/^([^.!?]+[.!?])/);
          const heading = headingMatch ? headingMatch[1].trim() : undefined;
          const text = heading ? content.substring(heading.length).trim() : content;
          
          blocks.push({
            heading,
            text,
          });
        }
      }
    }
  }
  
  return blocks;
}

/**
 * Extract support links from HTML
 */
function extractSupportLinks(
  html: string,
  config: ProductExtractorConfig
): Array<{ label: string; url: string }> {
  const links: Array<{ label: string; url: string }> = [];
  
  // Match anchor tags with href containing keywords
  const anchorRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match;
  
  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2].replace(/<[^>]*>/g, "").trim();
    
    // Check if href matches support link patterns
    const isSupportLink =
      /manual|spec|download|pdf|support|help|guide/i.test(href) ||
      /manual|spec|download|pdf|support|help|guide/i.test(text);
    
    if (isSupportLink && href.startsWith("http")) {
      links.push({
        label: text || href,
        url: href,
      });
    }
  }
  
  return [...new Map(links.map((l) => [l.url, l])).values()]; // Deduplicate by URL
}

/**
 * Extract images from HTML
 */
function extractImages(
  html: string,
  baseUrl: string
): Array<{ url: string; alt?: string }> {
  const images: Array<{ url: string; alt?: string }> = [];
  
  // Match img tags
  const imgRegex = /<img[^>]*>/gi;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    const imgTag = match[0];
    
    // Extract src
    const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
    if (!srcMatch) {
      continue;
    }
    
    let src = srcMatch[1];
    
    // Skip data URLs and very small images (likely icons)
    if (src.startsWith("data:") || src.includes("icon") || src.includes("logo")) {
      continue;
    }
    
    // Normalize URL
    try {
      src = new URL(src, baseUrl).href;
    } catch {
      continue;
    }
    
    // Extract alt
    const altMatch = imgTag.match(/alt=["']([^"']+)["']/i);
    const alt = altMatch ? altMatch[1] : undefined;
    
    images.push({
      url: src,
      alt,
    });
  }
  
  return images;
}
