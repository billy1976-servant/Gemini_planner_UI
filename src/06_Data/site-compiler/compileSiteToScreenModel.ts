/**
 * Site Model Compiler - Phase 3
 * 
 * Transforms NormalizedSite into engine-ready screen model format.
 * This is a pure data transformation layer - no UI, no React, no JSX.
 * 
 * Input: NormalizedSite (from normalizeSiteData)
 * Output: Engine-ready Screen JSON + Content JSON
 * 
 * This output feeds:
 * - Comparison engine
 * - Calculator engine
 * - Learning engine
 * - Decision engine
 */

import { normalizeSiteData, NormalizedSite, NormalizedPage, Section, NormalizedProduct, NavItem, MediaAsset } from "./normalizeSiteData";

// ============================================================================
// ENGINE-READY OUTPUT TYPES
// ============================================================================

export type ScreenModel = {
  siteId: string;
  pages: PageModel[];
  products: ProductModel[];
  navigation: NavigationItem[];
  media: MediaModel[];
};

export type PageModel = {
  id: string; // slug
  title: string;
  sections: SectionModel[];
};

export type SectionModel = {
  id: string;
  type: "text" | "image" | "list" | "productGrid" | "heading";
  content: any; // raw structured content
  media?: string[];
};

export type ProductModel = {
  id: string;
  title: string;
  price?: number;
  description?: string;
  images?: string[];
  tags?: string[];
};

export type NavigationItem = {
  label: string;
  href: string;
};

export type MediaModel = {
  id: string;
  url: string;
  alt?: string;
};

// ============================================================================
// MAIN COMPILATION FUNCTION
// ============================================================================

/**
 * Compile normalized site data into engine-ready screen model
 */
export async function compileSiteToScreenModel(domain: string): Promise<ScreenModel> {
  // Load normalized site
  const site = normalizeSiteData(domain);
  
  // Build engine-ready output structure
  return {
    siteId: site.domain,
    pages: compilePages(site.pages, site.products),
    products: compileProducts(site.products),
    navigation: compileNavigation(site.navigation),
    media: compileMedia(site.media, site.pages, site.products),
  };
}

// ============================================================================
// COMPILATION FUNCTIONS
// ============================================================================

/**
 * Compile pages from normalized pages
 */
function compilePages(
  normalizedPages: NormalizedPage[],
  products: NormalizedProduct[]
): PageModel[] {
  return normalizedPages.map((page, pageIndex) => ({
    id: page.slug,
    title: page.title,
    sections: compileSections(page.sections, products, `${page.slug}-${pageIndex}`),
  }));
}

/**
 * Compile sections with type mapping
 */
function compileSections(
  sections: Section[],
  products: NormalizedProduct[],
  pagePrefix: string
): SectionModel[] {
  return sections.map((section, sectionIndex) => {
    const sectionId = `${pagePrefix}-section-${sectionIndex}`;
    
    // Determine output type based on mapping rules
    let outputType: SectionModel["type"];
    let content: any = section.content;
    let media: string[] | undefined;
    
    // Check if section references product IDs (for productGrid)
    const productIds = extractProductIds(section.content, products);
    if (productIds.length > 0) {
      outputType = "productGrid";
      content = {
        productIds,
        originalContent: section.content,
      };
    } else {
      // Map section types according to rules
      switch (section.type) {
        case "heading":
          outputType = "heading";
          break;
        case "text":
        case "html": // html → text
          outputType = "text";
          break;
        case "image":
          outputType = "image";
          // Extract image URL from content if it's a URL
          if (isUrl(section.content)) {
            media = [section.content];
          }
          break;
        case "list":
          outputType = "list";
          // Parse list content if it's structured
          if (typeof section.content === "string") {
            content = section.content.split("\n").filter(Boolean);
          }
          break;
        case "quote":
          // Quotes become text
          outputType = "text";
          content = `"${section.content}"`;
          break;
        default:
          outputType = "text";
      }
    }
    
    // Extract media from metadata if present
    if (section.metadata?.images && Array.isArray(section.metadata.images)) {
      media = [...(media || []), ...section.metadata.images];
    }
    
    return {
      id: sectionId,
      type: outputType,
      content,
      ...(media && media.length > 0 ? { media } : {}),
    };
  });
}

/**
 * Compile products from normalized products
 */
function compileProducts(normalizedProducts: NormalizedProduct[]): ProductModel[] {
  return normalizedProducts.map((product) => {
    const tags: string[] = [];
    
    // Build tags from category, brand, and attributes
    if (product.category) {
      tags.push(product.category);
    }
    if (product.brand) {
      tags.push(product.brand);
    }
    if (product.attributes) {
      Object.keys(product.attributes).forEach((key) => {
        const value = product.attributes![key];
        if (typeof value === "string") {
          tags.push(value);
        }
      });
    }
    
    return {
      id: product.id,
      title: product.name,
      price: product.price?.amount,
      description: product.description,
      images: product.images.length > 0 ? product.images : undefined,
      tags: tags.length > 0 ? tags : undefined,
    };
  });
}

/**
 * Compile navigation - flatten to simple { label, href }
 */
function compileNavigation(navItems: NavItem[]): NavigationItem[] {
  const flattened: NavigationItem[] = [];
  
  function flattenNav(item: NavItem) {
    flattened.push({
      label: item.label,
      href: item.path,
    });
    
    // Recursively flatten children
    if (item.children) {
      item.children.forEach(flattenNav);
    }
  }
  
  navItems.forEach(flattenNav);
  
  return flattened;
}

/**
 * Compile media - collect all unique images from pages + products
 */
function compileMedia(
  mediaAssets: MediaAsset[],
  pages: NormalizedPage[],
  products: NormalizedProduct[]
): MediaModel[] {
  const mediaMap = new Map<string, MediaModel>();
  
  // Add media from mediaAssets
  mediaAssets.forEach((asset, index) => {
    const id = `media-${index}-${asset.url.split("/").pop()?.split("?")[0] || index}`;
    if (!mediaMap.has(asset.url)) {
      mediaMap.set(asset.url, {
        id,
        url: asset.url,
        alt: asset.alt,
      });
    }
  });
  
  // Add images from products
  products.forEach((product) => {
    product.images.forEach((imageUrl, imgIndex) => {
      if (!mediaMap.has(imageUrl)) {
        const id = `product-${product.id}-img-${imgIndex}`;
        mediaMap.set(imageUrl, {
          id,
          url: imageUrl,
          alt: product.name,
        });
      }
    });
  });
  
  // Extract images from page sections
  pages.forEach((page) => {
    page.sections.forEach((section) => {
      if (section.type === "image" && isUrl(section.content)) {
        if (!mediaMap.has(section.content)) {
          const id = `page-${page.slug}-img-${section.content.split("/").pop()?.split("?")[0] || "img"}`;
          mediaMap.set(section.content, {
            id,
            url: section.content,
            alt: section.metadata?.alt || page.title,
          });
        }
      }
    });
  });
  
  return Array.from(mediaMap.values());
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract product IDs from content string
 */
function extractProductIds(content: string, products: NormalizedProduct[]): string[] {
  const productIds: string[] = [];
  
  // Check if content contains product IDs or product names
  products.forEach((product) => {
    // Check for product ID in content
    if (content.includes(product.id)) {
      productIds.push(product.id);
    }
    // Check for product name in content (case-insensitive)
    else if (content.toLowerCase().includes(product.name.toLowerCase())) {
      productIds.push(product.id);
    }
  });
  
  return productIds;
}

/**
 * Check if a string is a valid URL
 */
function isUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
