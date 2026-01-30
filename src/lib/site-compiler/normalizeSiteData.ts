/**
 * Site Data Normalizer - Phase 2
 * 
 * Converts messy ripper output into a structured, predictable NormalizedSite format.
 * This is a data cleaning layer - pure transformation, no UI logic.
 * 
 * Input: Raw JSON files from src/content/sites/raw/[domain]/
 * Output: NormalizedSite (structured, predictable format)
 */

import fs from "fs";
import path from "path";
import { extractAttributesFromProducts } from "@/compiler/extractAttributes";
import { detectBaseModels } from "@/compiler/detectBaseModels";
import { groupProductsByModel } from "@/compiler/groupProductsByModel";
import { detectVariantDimensionsForGroups } from "@/compiler/detectVariantDimensions";
import { mapImagesToVariantsForGroups } from "@/compiler/mapImagesToVariants";
import { buildNormalizedModels, NormalizedModel } from "@/compiler/buildNormalizedModels";

// ============================================================================
// NORMALIZED TYPES (Intermediate format - simpler than CompiledSiteModel)
// ============================================================================

export type NormalizedSite = {
  domain: string;
  pages: NormalizedPage[];
  products: NormalizedProduct[];
  models?: NormalizedModel[]; // Grouped models with variants (new structure)
  navigation: NavItem[];
  media: MediaAsset[];
  derivedPages?: Array<{ id: string; title: string; slug: string; sectionIds: string[] }>; // ✅ Derived pages from normalization layer
};

export type NormalizedPage = {
  slug: string;
  title: string;
  sections: Section[];
};

export type Section = {
  type: "text" | "html" | "image" | "list" | "heading" | "quote" | "productGrid" | "hero";
  content: string | string[] | any; // Allow flexible content types
  metadata?: Record<string, any>;
  heading?: string; // Optional heading for hero/heading sections
  pageId?: string; // Optional pageId for section assignment
};

export type NormalizedProduct = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  price?: {
    amount: number;
    currency: string;
    source?: {
      label: string;
      url: string;
      snippet?: string;
    };
  };
  images: string[]; // Array of image URLs
  url?: string;
  attributes?: Record<string, any>;
  specifications?: Record<string, string>;
  variants?: Record<string, string>; // Detected variant values (e.g., { finish: "Cherry Sunburst" })
  variantImages?: Record<string, string[]>; // Images mapped to specific variants
};

export type NavItem = {
  label: string;
  path: string;
  children?: NavItem[];
  external?: boolean;
};

export type MediaAsset = {
  url: string;
  alt?: string;
  sourceUrl?: string;
  width?: number;
  height?: number;
  type?: "image" | "video" | "document";
};

// ============================================================================
// RAW DATA TYPES (from ripper output)
// ============================================================================

type RawSiteSnapshot = {
  domain?: string;
  url?: string;
  title?: string;
  pages?: any[];
  navigation?: any[];
  images?: any[];
  links?: any[];
  metadata?: any;
  rawData?: {
    extraction?: {
      html?: string;
      metaTags?: Record<string, string>;
      images?: any[];
      supportLinks?: any[];
      descriptionBlocks?: any[];
    };
    v2?: {
      pages?: any[];
      [key: string]: any;
    };
  };
  [key: string]: any;
};

type RawProductGraph = {
  products?: any[];
  categories?: any[];
  brands?: any[];
  [key: string]: any;
};

// ============================================================================
// MAIN NORMALIZATION FUNCTION
// ============================================================================

/**
 * Normalize raw site data into a structured NormalizedSite format
 */
export function normalizeSiteData(domain: string): NormalizedSite {
  // New structure: src/content/sites/{domain}/raw/
  const rawDir = path.join(process.cwd(), "src", "content", "sites", domain, "raw");
  
  // Load raw data files
  const snapshot = loadRawSnapshot(rawDir);
  const products = loadRawProducts(rawDir);
  
  // Check for V2 structure
  if (snapshot?.rawData?.v2?.pages) {
    return normalizeFromV2Structure(domain, snapshot.rawData.v2, products);
  }
  
  // Legacy structure
  const normalizedPages = normalizePages(snapshot, products);
  const normalizedProducts = normalizeProducts(products);
  const navigation = normalizeNavigation(snapshot);
  const media = normalizeMedia(snapshot, products);
  
  // Extract models from products (attached during normalization)
  const models = (normalizedProducts as any).__models || [];
  
  // ✅ STEP 1: Derive pages FIRST from navigation (nav-driven)
  const { derivePagesFromNav } = require("@/lib/site-normalizer/derivePagesFromNav");
  
  // Create empty sections array for initial derivation
  const derivedPages = derivePagesFromNav(navigation, []);
  
  // ✅ STEP 2: Create sections with proper IDs and pageId assignment
  const allSections: Array<Section & { id: string; pageId?: string }> = [];
  
  // Find homepage from normalized pages
  const homepage = normalizedPages.find(p => p.slug === "/");
  
  // ✅ STEP 2a: Create Hero section for Home page
  if (homepage) {
    const homePage = derivedPages.find(p => p.id === "home");
    if (homePage) {
      // Find first heading or create hero from homepage title
      const firstHeading = homepage.sections.find(s => s.type === "heading");
      const heroHeading = firstHeading?.content || homepage.title || "Welcome";
      
      const heroSectionId = "block-home-hero";
      allSections.push({
        id: heroSectionId,
        type: "hero",
        content: heroHeading,
        pageId: "home",
        heading: typeof heroHeading === "string" ? heroHeading : undefined,
      });
      homePage.sectionIds.push(heroSectionId);
      
      // Add other homepage sections (excluding product grids)
      homepage.sections.forEach((section, index) => {
        if (section.type === "productGrid") return; // Skip product grids on home
        
        const sectionId = `block-home-${index + 1}`; // +1 because hero is index 0
        allSections.push({
          id: sectionId,
          type: section.type,
          content: section.content,
          pageId: "home",
          heading: section.type === "heading" && typeof section.content === "string" 
            ? section.content 
            : undefined,
        });
        homePage.sectionIds.push(sectionId);
      });
    }
  }
  
  // ✅ STEP 2b: Create ONE productGrid section and assign ONLY to Products page
  if (normalizedProducts.length > 0) {
    const productsPage = derivedPages.find(p => p.id === "products");
    if (productsPage) {
      const productGridSectionId = "block-products-grid";
      allSections.push({
        id: productGridSectionId,
        type: "productGrid",
        content: normalizedProducts.map(p => p.id), // Store product IDs
        pageId: "products",
      });
      productsPage.sectionIds.push(productGridSectionId);
    }
  }
  
  // ✅ STEP 2c: Assign other pages' sections from normalized pages
  normalizedPages.forEach(page => {
    if (page.slug === "/") return; // Homepage already handled
    
    const pageSlugSafe = page.slug.replace(/^\//, "").replace(/\//g, "-");
    const derivedPage = derivedPages.find(p => {
      const pSlugSafe = p.slug === "/" ? "home" : p.slug.replace(/^\//, "").replace(/\//g, "-");
      return pSlugSafe === pageSlugSafe || p.slug === page.slug;
    });
    
    if (derivedPage) {
      page.sections.forEach((section, index) => {
        // Skip product grids - they only go to Products page
        if (section.type === "productGrid") return;
        
        const sectionId = `block-${pageSlugSafe}-${index}`;
        allSections.push({
          id: sectionId,
          type: section.type,
          content: section.content,
          pageId: derivedPage.id,
          heading: section.type === "heading" && typeof section.content === "string" 
            ? section.content 
            : undefined,
        });
        derivedPage.sectionIds.push(sectionId);
      });
    }
  });
  
  // Filter out payment icon images
  const PAYMENT_ICON_TOKENS = [
    "amex", "american express", "visa", "mastercard", "discover",
    "shop pay", "apple pay", "google pay", "gpay", "paypal", "klarna", "affirm"
  ];
  
  const filteredSections = allSections.filter(section => {
    // Only filter image sections that are payment icons
    if (section.type === "image" && section.content) {
      const contentStr = typeof section.content === "string" 
        ? section.content.toLowerCase() 
        : JSON.stringify(section.content).toLowerCase();
      return !PAYMENT_ICON_TOKENS.some(token => contentStr.includes(token));
    }
    return true; // Keep all non-image sections
  });
  
  // Remove section IDs that were filtered out from page sectionIds
  derivedPages.forEach(page => {
    page.sectionIds = page.sectionIds.filter(id => 
      filteredSections.some(s => s.id === id)
    );
  });
  
  return {
    domain,
    pages: normalizedPages,
    products: normalizedProducts,
    models: models.length > 0 ? models : undefined,
    navigation,
    media,
    derivedPages, // ✅ Pages with proper sectionIds
  };
}

/**
 * Normalize from V2 structure (pages[] with sections[])
 */
function normalizeFromV2Structure(
  domain: string,
  v2Data: any,
  products: RawProductGraph | null
): NormalizedSite {
  const pages: NormalizedPage[] = [];
  const navigation: NavItem[] = [];
  const media: MediaAsset[] = [];
  
  // Convert V2 pages to normalized pages
  if (v2Data.pages && Array.isArray(v2Data.pages)) {
    v2Data.pages.forEach((page: any) => {
      // Detect if this is a collection page (not a PDP)
      const isCollectionPage = !page.isPDP && 
        page.id && 
        page.id !== "/" && 
        (page.id.includes("/") || page.url?.includes("/collections/") || page.url?.match(/\/[a-z-]+$/));
      
      const sections: Section[] = [];
      
      if (isCollectionPage) {
        // For collection pages, prioritize hero content
        sections.push(...extractHeroSections(page));
      }
      
      // Convert remaining V2 sections to normalized sections
      if (page.sections && Array.isArray(page.sections)) {
        page.sections.forEach((section: any) => {
          // Skip sections already included in hero
          if (isCollectionPage && section.type === "heading" && section.heading) {
            // Check if this heading was already added as hero
            const heroHeading = sections.find(s => s.type === "heading");
            if (heroHeading && heroHeading.content === section.heading) {
              return; // Skip, already added
            }
          }
          
          if (section.type === "heading" && section.heading) {
            sections.push({
              type: "heading",
              content: section.heading,
            });
          } else if (section.type === "text" && section.text) {
            // Skip text if it was already added as hero lead paragraph
            if (isCollectionPage) {
              const heroText = sections.find(s => s.type === "text");
              if (heroText && heroText.content === section.text) {
                return; // Skip, already added
              }
            }
            sections.push({
              type: "text",
              content: section.text,
            });
          } else if (section.type === "image" && section.images) {
            // Skip images if hero image was already added
            if (isCollectionPage) {
              const heroImage = sections.find(s => s.type === "image");
              if (heroImage) {
                // Check if any of these images match the hero image
                const heroImageUrl = heroImage.content;
                const hasHeroImage = section.images.some((img: any) => img.url === heroImageUrl);
                if (hasHeroImage) {
                  // Add remaining images (skip the hero image)
                  section.images.forEach((img: any) => {
                    if (img.url !== heroImageUrl) {
                      sections.push({
                        type: "image",
                        content: img.url,
                        metadata: { alt: img.alt, sourceUrl: img.sourceUrl },
                      });
                    }
                  });
                  return;
                }
              }
            }
            
            section.images.forEach((img: any) => {
              sections.push({
                type: "image",
                content: img.url,
                metadata: { alt: img.alt, sourceUrl: img.sourceUrl },
              });
            });
          } else if (section.type === "list") {
            sections.push({
              type: "list",
              content: section.items?.join("\n") || "",
            });
          }
        });
      }
      
      pages.push({
        slug: page.id || "/",
        title: page.title || "Page",
        sections,
      });
      
      // Extract navigation from pages with navLabel
      if (page.navLabel) {
        navigation.push({
          label: page.navLabel,
          path: page.id || page.url,
        });
      }
    });
  }
  
  // Extract navigation from first page if no nav found
  if (navigation.length === 0 && v2Data.pages && v2Data.pages.length > 0) {
    v2Data.pages.forEach((page: any) => {
      if (page.id !== "/" && page.title) {
        navigation.push({
          label: page.title,
          path: page.id,
        });
      }
    });
  }
  
  // Extract media from sections
  if (v2Data.pages) {
    v2Data.pages.forEach((page: any) => {
      if (page.sections) {
        page.sections.forEach((section: any) => {
          if (section.images && Array.isArray(section.images)) {
            section.images.forEach((img: any) => {
              media.push({
                url: img.url,
                alt: img.alt,
                sourceUrl: img.sourceUrl || page.url,
              });
            });
          }
        });
      }
    });
  }
  
  // Extract products from V2 pages (PDPs) if product.graph.json is empty
  let normalizedProducts = normalizeProducts(products);
  
  // If no products in graph, extract from V2 PDP pages OR pages with /products/ in URL
  if (normalizedProducts.length === 0 && v2Data.pages) {
    // Find PDP pages OR pages with /products/ in URL (Shopify pattern)
    const pdpPages = v2Data.pages.filter((p: any) => 
      p.isPDP || (p.url && p.url.includes("/products/"))
    );
    console.log(`[NORMALIZE] No products in graph, extracting from ${pdpPages.length} V2 pages (PDPs or /products/ URLs)`);
    
    normalizedProducts = pdpPages.map((page: any) => {
      // Extract images from page sections
      const imageUrls: string[] = [];
      if (page.sections && Array.isArray(page.sections)) {
        page.sections.forEach((section: any) => {
          if (section.type === "image" && section.images) {
            section.images.forEach((img: any) => {
              if (img.url) {
                imageUrls.push(img.url);
              }
            });
          }
        });
      }
      
      // Also try to extract from HTML if available
      if (page.html && imageUrls.length === 0) {
        const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
        let imgMatch;
        while ((imgMatch = imgRegex.exec(page.html)) !== null && imageUrls.length < 10) {
          try {
            const fullUrl = new URL(imgMatch[1], page.url).href;
            if (!fullUrl.includes("icon") && !fullUrl.includes("logo") && !imageUrls.includes(fullUrl)) {
              imageUrls.push(fullUrl);
            }
          } catch {
            // Skip invalid URLs
          }
        }
      }
      
      // Extract description from text sections
      const descriptionParts: string[] = [];
      if (page.sections && Array.isArray(page.sections)) {
        page.sections.forEach((section: any) => {
          if (section.type === "text" && section.text) {
            descriptionParts.push(section.text);
          }
        });
      }
      
      // Extract price from HTML if available
      let price: { amount: number; currency: string } | undefined;
      const htmlToSearch = page.html || page.title || page.url || "";
      
      // Try $123 pattern
      const dollarMatch = htmlToSearch.match(/\$(\d+(?:\.\d{2})?)/);
      if (dollarMatch) {
        price = {
          amount: parseFloat(dollarMatch[1]),
          currency: "USD",
        };
      }
      
      // Extract product name from H1 if HTML available
      let productName = page.title || "Product";
      if (page.html) {
        const h1Match = page.html.match(/<h1[^>]*>(.*?)<\/h1>/i);
        if (h1Match) {
          productName = h1Match[1].replace(/<[^>]*>/g, "").trim() || productName;
        }
      }
      
      // Extract category from URL
      let category = "uncategorized";
      if (page.url?.includes("/products/")) {
        const urlParts = page.url.split("/products/");
        if (urlParts.length > 1) {
          const productSlug = urlParts[1].split("/")[0];
          // Use slug as category hint
          category = productSlug.split("-")[0] || "uncategorized";
        }
      }
      
      return {
        id: page.productId || page.id.replace(/^\//, "").replace(/\//g, "-") || `prod_${Math.random().toString(36).substr(2, 9)}`,
        name: productName,
        description: descriptionParts.join(" ").substring(0, 500) || undefined,
        category,
        brand: v2Data.domain?.split(".")[0] || domain.split(".")[0],
        price: price ? {
          amount: price.amount,
          currency: price.currency,
          source: {
            label: "Extracted from page",
            url: page.url,
            snippet: `Price found on ${page.url}`,
            kind: "price" as const,
          },
        } : undefined,
        images: imageUrls.slice(0, 10), // Limit to 10 images
        url: page.url,
        attributes: {},
        specifications: {},
      };
    });
    
    console.log(`[NORMALIZE] Extracted ${normalizedProducts.length} products from V2 PDP pages`);
  }
  
  // Apply universal product intelligence compiler pipeline to V2 products
  let models: NormalizedModel[] = [];
  if (normalizedProducts.length > 0) {
    // Step 1: Extract attributes
    const productsWithAttributes = extractAttributesFromProducts(normalizedProducts);
    
    // Step 2: Detect base models
    const baseModels = detectBaseModels(productsWithAttributes);
    
    // Step 3: Group products by model
    const productGroups = groupProductsByModel(productsWithAttributes, baseModels);
    
    // Step 4: Detect variant dimensions
    const dimensionsMap = detectVariantDimensionsForGroups(productGroups);
    
    // Step 5: Map images to variants
    const imageMapsMap = mapImagesToVariantsForGroups(productGroups, dimensionsMap);
    
    // Step 6: Build normalized models
    models = buildNormalizedModels(productGroups, dimensionsMap, imageMapsMap);
    
    // Attach variant info to products for backward compatibility
    normalizedProducts.forEach((product, index) => {
      const matchingModel = models.find(model =>
        model.variants.some(v => v.id === product.id)
      );
      
      if (matchingModel) {
        const variant = matchingModel.variants.find(v => v.id === product.id);
        if (variant) {
          (product as any).variants = variant.specs || {};
          (product as any).variantImages = variant.images ? { default: variant.images } : {};
        }
      }
    });
  }
  
  // ✅ STEP 1: Derive pages FIRST from navigation (nav-driven) for V2 structure
  const { derivePagesFromNav } = require("@/lib/site-normalizer/derivePagesFromNav");
  const derivedPages = derivePagesFromNav(navigation, []);
  
  // ✅ STEP 2: Create sections with proper IDs and pageId assignment
  const allSections: Array<Section & { id: string; pageId?: string }> = [];
  
  // Find homepage from normalized pages
  const homepage = pages.find(p => p.slug === "/");
  
  // ✅ STEP 2a: Create Hero section for Home page
  if (homepage) {
    const homePage = derivedPages.find(p => p.id === "home");
    if (homePage) {
      const firstHeading = homepage.sections.find(s => s.type === "heading");
      const heroHeading = firstHeading?.content || homepage.title || "Welcome";
      
      const heroSectionId = "block-home-hero";
      allSections.push({
        id: heroSectionId,
        type: "hero",
        content: heroHeading,
        pageId: "home",
        heading: typeof heroHeading === "string" ? heroHeading : undefined,
      });
      homePage.sectionIds.push(heroSectionId);
      
      // Add other homepage sections (excluding product grids)
      homepage.sections.forEach((section, index) => {
        if (section.type === "productGrid") return; // Skip product grids on home
        
        const sectionId = `block-home-${index + 1}`; // +1 because hero is index 0
        allSections.push({
          id: sectionId,
          type: section.type,
          content: section.content,
          pageId: "home",
          heading: section.type === "heading" && typeof section.content === "string" 
            ? section.content 
            : undefined,
        });
        homePage.sectionIds.push(sectionId);
      });
    }
  }
  
  // ✅ STEP 2b: Create ONE productGrid section and assign ONLY to Products page
  if (normalizedProducts.length > 0) {
    const productsPage = derivedPages.find(p => p.id === "products");
    if (productsPage) {
      const productGridSectionId = "block-products-grid";
      allSections.push({
        id: productGridSectionId,
        type: "productGrid",
        content: normalizedProducts.map(p => p.id), // Store product IDs
        pageId: "products",
      });
      productsPage.sectionIds.push(productGridSectionId);
    }
  }
  
  // ✅ STEP 2c: Assign other pages' sections from normalized pages
  pages.forEach(page => {
    if (page.slug === "/") return; // Homepage already handled
    
    const pageSlugSafe = page.slug.replace(/^\//, "").replace(/\//g, "-");
    const derivedPage = derivedPages.find(p => {
      const pSlugSafe = p.slug === "/" ? "home" : p.slug.replace(/^\//, "").replace(/\//g, "-");
      return pSlugSafe === pageSlugSafe || p.slug === page.slug;
    });
    
    if (derivedPage) {
      page.sections.forEach((section, index) => {
        // Skip product grids - they only go to Products page
        if (section.type === "productGrid") return;
        
        const sectionId = `block-${pageSlugSafe}-${index}`;
        allSections.push({
          id: sectionId,
          type: section.type,
          content: section.content,
          pageId: derivedPage.id,
          heading: section.type === "heading" && typeof section.content === "string" 
            ? section.content 
            : undefined,
        });
        derivedPage.sectionIds.push(sectionId);
      });
    }
  });
  
  // Filter out payment icon images
  const PAYMENT_ICON_TOKENS = [
    "amex", "american express", "visa", "mastercard", "discover",
    "shop pay", "apple pay", "google pay", "gpay", "paypal", "klarna", "affirm"
  ];
  
  const filteredSections = allSections.filter(section => {
    if (section.type === "image" && section.content) {
      const contentStr = typeof section.content === "string" 
        ? section.content.toLowerCase() 
        : JSON.stringify(section.content).toLowerCase();
      return !PAYMENT_ICON_TOKENS.some(token => contentStr.includes(token));
    }
    return true;
  });
  
  // Remove section IDs that were filtered out from page sectionIds
  derivedPages.forEach(page => {
    page.sectionIds = page.sectionIds.filter(id => 
      filteredSections.some(s => s.id === id)
    );
  });
  
  return {
    domain: v2Data.domain || domain,
    pages,
    products: normalizedProducts,
    models: models.length > 0 ? models : undefined,
    navigation,
    media,
    derivedPages,
  };
}

// ============================================================================
// RAW DATA LOADERS
// ============================================================================

function loadRawSnapshot(rawDir: string): RawSiteSnapshot | null {
  try {
    const filePath = path.join(rawDir, "site.snapshot.json");
    if (!fs.existsSync(filePath)) {
      console.warn(`[Normalizer] Site snapshot not found: ${filePath}`);
      return null;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as RawSiteSnapshot;
  } catch (error) {
    console.error(`[Normalizer] Error loading snapshot:`, error);
    return null;
  }
}

function loadRawProducts(rawDir: string): RawProductGraph | null {
  try {
    const filePath = path.join(rawDir, "product.graph.json");
    if (!fs.existsSync(filePath)) {
      console.warn(`[Normalizer] Product graph not found: ${filePath}`);
      return null;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as RawProductGraph;
  } catch (error) {
    console.error(`[Normalizer] Error loading products:`, error);
    return null;
  }
}

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Normalize pages from snapshot data
 */
function normalizePages(
  snapshot: RawSiteSnapshot | null,
  products: RawProductGraph | null
): NormalizedPage[] {
  const pages: NormalizedPage[] = [];
  
  // Extract homepage
  const homepage: NormalizedPage = {
    slug: "/",
    title: snapshot?.title || snapshot?.rawData?.extraction?.metaTags?.title || "Home",
    sections: extractPageSections(snapshot),
  };
  pages.push(homepage);
  
  // Extract other pages if available
  if (snapshot?.pages && Array.isArray(snapshot.pages)) {
    snapshot.pages.forEach((page: any) => {
      pages.push({
        slug: page.slug || page.path || page.url || `/${page.id || Math.random()}`,
        title: page.title || page.name || "Untitled Page",
        sections: extractSectionsFromPage(page),
      });
    });
  }
  
  // If we have products, create a products listing page
  if (products?.products && products.products.length > 0) {
    pages.push({
      slug: "/products",
      title: "Products",
      sections: [
        {
          type: "text",
          content: `Browse our collection of ${products.products.length} products.`,
        },
      ],
    });
  }
  
  return pages;
}

/**
 * Extract sections from snapshot (for homepage)
 */
function extractPageSections(snapshot: RawSiteSnapshot | null): Section[] {
  const sections: Section[] = [];
  
  if (!snapshot) {
    return sections;
  }
  
  const extraction = snapshot.rawData?.extraction;
  
  // Extract description from meta tags or description blocks
  if (extraction?.metaTags?.description) {
    sections.push({
      type: "text",
      content: extraction.metaTags.description,
      metadata: { source: "meta-description" },
    });
  }
  
  // Extract description blocks
  if (extraction?.descriptionBlocks && Array.isArray(extraction.descriptionBlocks)) {
    extraction.descriptionBlocks.forEach((block: any) => {
      if (block.heading) {
        sections.push({
          type: "heading",
          content: block.heading,
        });
      }
      if (block.text) {
        sections.push({
          type: "text",
          content: block.text,
        });
      }
    });
  }
  
  // Extract HTML content (simplified - just store as HTML section)
  if (extraction?.html) {
    // Extract text content from HTML (basic extraction)
    const textContent = extractTextFromHTML(extraction.html);
    if (textContent) {
      sections.push({
        type: "html",
        content: textContent.substring(0, 1000), // Limit size
        metadata: { source: "html-extraction" },
      });
    }
  }
  
  return sections;
}

/**
 * Extract sections from a specific page object
 */
function extractSectionsFromPage(page: any): Section[] {
  const sections: Section[] = [];
  
  if (page.content) {
    sections.push({
      type: "text",
      content: typeof page.content === "string" ? page.content : JSON.stringify(page.content),
    });
  }
  
  if (page.description) {
    sections.push({
      type: "text",
      content: page.description,
    });
  }
  
  return sections;
}

/**
 * Normalize products from product graph
 */
function normalizeProducts(products: RawProductGraph | null): NormalizedProduct[] {
  if (!products?.products || !Array.isArray(products.products)) {
    return [];
  }
  
  // First, normalize basic product structure
  const normalizedProducts = products.products.map((product: any) => {
    // Extract image URLs
    const imageUrls: string[] = [];
    if (Array.isArray(product.images)) {
      product.images.forEach((img: any) => {
        const url = typeof img === "string" 
          ? img 
          : (img.url || img.src || "");
        if (url) {
          // Fix URL encoding
          imageUrls.push(url.replace(/&amp;/g, "&"));
        }
      });
    }
    
    // Extract description
    let description: string | undefined;
    if (product.description) {
      description = product.description;
    } else if (product.descriptionBlocks && Array.isArray(product.descriptionBlocks)) {
      description = product.descriptionBlocks
        .map((block: any) => block.text || block.heading || "")
        .filter(Boolean)
        .join(" ");
    }
    
    return {
      id: product.id || `prod_${Math.random().toString(36).substr(2, 9)}`,
      name: product.name || product.title || "Product",
      description,
      category: product.category || product.type,
      brand: product.brand,
      price: product.price
        ? {
            amount: product.price.amount || 0,
            currency: product.price.currency || "USD",
            source: product.price.source,
          }
        : undefined,
      images: imageUrls,
      url: product.url || product.href,
      attributes: product.attributes || {},
      specifications: product.specifications || {},
    };
  });
  
  // Apply universal product intelligence compiler pipeline
  // Step 1: Extract attributes from raw products
  const productsWithAttributes = extractAttributesFromProducts(products.products);
  
  // Step 2: Detect base models
  const baseModels = detectBaseModels(productsWithAttributes);
  
  // Step 3: Group products by model
  const productGroups = groupProductsByModel(productsWithAttributes, baseModels);
  
  // Step 4: Detect variant dimensions
  const dimensionsMap = detectVariantDimensionsForGroups(productGroups);
  
  // Step 5: Map images to variants
  const imageMapsMap = mapImagesToVariantsForGroups(productGroups, dimensionsMap);
  
  // Step 6: Build normalized models
  const normalizedModels = buildNormalizedModels(productGroups, dimensionsMap, imageMapsMap);
  
  // For backward compatibility, also return flat products with variant info
  // But attach models to the site structure
  const productsWithVariants = normalizedProducts.map((product, index) => {
    // Find corresponding variant in models
    const matchingModel = normalizedModels.find(model =>
      model.variants.some(v => v.id === product.id)
    );
    
    if (matchingModel) {
      const variant = matchingModel.variants.find(v => v.id === product.id);
      return {
        ...product,
        variants: variant?.specs || {},
        variantImages: variant?.images ? { default: variant.images } : {}
      };
    }
    
    return product;
  });
  
  // Store models for access (will be attached to site in main function)
  (productsWithVariants as any).__models = normalizedModels;
  
  return productsWithVariants;
}

/**
 * Normalize navigation from snapshot
 */
function normalizeNavigation(snapshot: RawSiteSnapshot | null): NavItem[] {
  if (!snapshot) {
    return [];
  }
  
  // V2 structure: Extract from pages (highest priority)
  if (snapshot.rawData?.v2?.pages) {
    const nav: NavItem[] = [];
    snapshot.rawData.v2.pages.forEach((page: any) => {
      if (page.navLabel) {
        nav.push({ label: page.navLabel, path: page.id });
      } else if (page.id !== "/" && page.title && !page.title.toLowerCase().includes("amazon")) {
        // Use page title as nav label, but skip Amazon links
        nav.push({ label: page.title, path: page.id });
      }
    });
    if (nav.length > 0) return nav;
  }
  
  // Try structured navigation
  if (Array.isArray(snapshot.navigation)) {
    return snapshot.navigation
      .filter((item: any) => {
        const label = (item.label || item.text || item.name || "").toLowerCase();
        return label && !label.includes("amazon") && !label.includes("affiliate");
      })
      .map((item: any) => ({
        label: item.label || item.text || item.name || "Link",
        path: item.path || item.url || item.href || "#",
        external: item.external || (item.url && item.url.startsWith("http")),
        children: item.children
          ? item.children.map((child: any) => ({
              label: child.label || child.text || child.name || "Link",
              path: child.path || child.url || child.href || "#",
              external: child.external || (child.url && child.url.startsWith("http")),
            }))
          : undefined,
      }));
  }
  
  // Fallback to links (filter out Amazon)
  if (Array.isArray(snapshot.links)) {
    const uniqueLinks = new Map<string, NavItem>();
    snapshot.links.forEach((link: any) => {
      const url = link.url || link.href || link.path || "#";
      const label = (link.text || link.label || link.name || url).toLowerCase();
      // Skip Amazon and affiliate links
      if (label.includes("amazon") || url.includes("amazon") || url.includes("affiliate")) {
        return;
      }
      if (!uniqueLinks.has(url)) {
        uniqueLinks.set(url, {
          label: link.text || link.label || link.name || url,
          path: url,
          external: url.startsWith("http"),
        });
      }
    });
    return Array.from(uniqueLinks.values());
  }
  
  // DON'T use supportLinks - they're affiliate links, not navigation
  // This was causing "Amazon" to appear in navigation
  
  return [];
}

/**
 * Normalize media assets from snapshot and products
 */
function normalizeMedia(
  snapshot: RawSiteSnapshot | null,
  products: RawProductGraph | null
): MediaAsset[] {
  const media: MediaAsset[] = [];
  
  // Extract images from snapshot
  if (snapshot?.images && Array.isArray(snapshot.images)) {
    snapshot.images.forEach((img: any) => {
      const url = typeof img === "string" 
        ? img 
        : (img.url || img.src || "");
      if (url) {
        media.push({
          url: url.replace(/&amp;/g, "&"),
          alt: typeof img === "string" ? "" : (img.alt || ""),
          sourceUrl: snapshot.url,
          width: typeof img === "string" ? undefined : img.width,
          height: typeof img === "string" ? undefined : img.height,
          type: "image",
        });
      }
    });
  }
  
  // Extract images from extraction
  const extraction = snapshot?.rawData?.extraction;
  if (extraction?.images && Array.isArray(extraction.images)) {
    extraction.images.forEach((img: any) => {
      const url = typeof img === "string" 
        ? img 
        : (img.url || img.src || "");
      if (url) {
        media.push({
          url: url.replace(/&amp;/g, "&"),
          alt: typeof img === "string" ? "" : (img.alt || ""),
          sourceUrl: snapshot?.url,
          width: typeof img === "string" ? undefined : img.width,
          height: typeof img === "string" ? undefined : img.height,
          type: "image",
        });
      }
    });
  }
  
  // Extract images from products
  if (products?.products && Array.isArray(products.products)) {
    products.products.forEach((product: any) => {
      if (Array.isArray(product.images)) {
        product.images.forEach((img: any) => {
          const url = typeof img === "string" 
            ? img 
            : (img.url || img.src || "");
          if (url) {
            media.push({
              url: url.replace(/&amp;/g, "&"),
              alt: typeof img === "string" ? (product.name || "") : (img.alt || product.name || ""),
              sourceUrl: product.url,
              width: typeof img === "string" ? undefined : img.width,
              height: typeof img === "string" ? undefined : img.height,
              type: "image",
            });
          }
        });
      }
    });
  }
  
  // Deduplicate by URL
  const uniqueMedia = new Map<string, MediaAsset>();
  media.forEach((asset) => {
    if (!uniqueMedia.has(asset.url)) {
      uniqueMedia.set(asset.url, asset);
    }
  });
  
  return Array.from(uniqueMedia.values());
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract hero sections from collection page
 * Returns: [heading, text, image] in that order if found
 */
function extractHeroSections(page: any): Section[] {
  const heroSections: Section[] = [];
  
  if (!page.sections || !Array.isArray(page.sections)) {
    return heroSections;
  }
  
  // 1. Find first H1 heading (or first heading if no H1)
  let heroHeading: string | null = null;
  const headings = page.sections.filter((s: any) => s.type === "heading" && s.heading);
  if (headings.length > 0) {
    // Prefer H1, but if HTML is available, check for actual H1
    if (page.html) {
      const h1Match = page.html.match(/<h1[^>]*>(.*?)<\/h1>/i);
      if (h1Match) {
        heroHeading = h1Match[1].replace(/<[^>]*>/g, "").trim();
      }
    }
    // Fallback to first heading
    if (!heroHeading && headings[0].heading) {
      heroHeading = headings[0].heading;
    }
  }
  
  if (heroHeading) {
    heroSections.push({
      type: "heading",
      content: heroHeading,
    });
  }
  
  // 2. Find first meaningful paragraph (lead text)
  // Look for paragraphs that are >50 chars and <500 chars, appear early in sections
  const textSections = page.sections.filter((s: any) => s.type === "text" && s.text);
  for (const textSection of textSections) {
    const text = textSection.text.trim();
    // Meaningful paragraph: between 50-500 chars, not just a single word
    if (text.length >= 50 && text.length <= 500 && text.split(/\s+/).length > 5) {
      heroSections.push({
        type: "text",
        content: text,
      });
      break; // Only take the first meaningful paragraph
    }
  }
  
  // 3. Find largest/hero image (>600px wide if available, or largest available)
  const imageSections = page.sections.filter((s: any) => s.type === "image" && s.images && Array.isArray(s.images));
  let heroImage: { url: string; alt?: string; width?: number } | null = null;
  let largestWidth = 0;
  
  // First pass: collect all images with their widths
  const imagesWithWidth: Array<{ url: string; alt?: string; width: number }> = [];
  for (const imageSection of imageSections) {
    for (const img of imageSection.images) {
      let width = 0;
      
      // Check explicit width property
      if (img.width && typeof img.width === "number") {
        width = img.width;
      } else if (img.url) {
        // Check URL for size hints (e.g., width=1920, w=1200)
        const widthMatch = img.url.match(/(?:width|w)=(\d+)/i);
        if (widthMatch) {
          width = parseInt(widthMatch[1]);
        }
      }
      
      imagesWithWidth.push({
        url: img.url,
        alt: img.alt,
        width: width,
      });
    }
  }
  
  // Find the largest image (>600px preferred, otherwise largest available)
  for (const img of imagesWithWidth) {
    if (img.width > 600 && img.width > largestWidth) {
      heroImage = img;
      largestWidth = img.width;
    }
  }
  
  // If no image >600px, use the largest available
  if (!heroImage && imagesWithWidth.length > 0) {
    const sortedByWidth = [...imagesWithWidth].sort((a, b) => b.width - a.width);
    heroImage = sortedByWidth[0];
  }
  
  // Fallback: first image if no width info available
  if (!heroImage && imagesWithWidth.length > 0) {
    heroImage = imagesWithWidth[0];
  }
  
  if (heroImage) {
    heroSections.push({
      type: "image",
      content: heroImage.url,
      metadata: { 
        alt: heroImage.alt, 
        sourceUrl: page.url,
        width: heroImage.width,
      },
    });
  }
  
  return heroSections;
}

/**
 * Extract text content from HTML (basic implementation)
 */
function extractTextFromHTML(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, " ");
  
  // Clean up whitespace
  text = text.replace(/\s+/g, " ").trim();
  
  return text;
}
