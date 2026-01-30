/**
 * Engine Overlay System
 * 
 * Pure transformation layer that injects engine-driven blocks into SiteSchema.
 * This runs between compileSiteToSchema and renderFromSchema.
 * 
 * NO UI. NO JSX. ONLY JSON TRANSFORMATION.
 * 
 * Input: SiteSchema (from compileSiteToSchema)
 * Output: SiteSchema with engine overlay blocks injected
 */

import { SiteSchema, SitePageSchema, SiteLayout } from "@/lib/site-schema/siteLayout.types";
import { NormalizedSite } from "@/lib/site-compiler/normalizeSiteData";

/**
 * Engine overlay configuration
 */
export interface EngineOverlayConfig {
  enabled?: {
    comparison?: boolean;
    calculator?: boolean;
    badges?: boolean;
    recommendations?: boolean;
  };
  placement?: {
    comparison?: "afterProductGrid" | "afterText" | "beforeFooter";
    calculator?: "afterHero" | "afterText" | "beforeFooter";
    badges?: "afterHero" | "inline";
    recommendations?: "afterProductGrid" | "beforeFooter";
  };
}

/**
 * Apply engine overlays to SiteSchema
 */
export function applyEngineOverlays(
  schema: SiteSchema,
  siteData: NormalizedSite,
  config: EngineOverlayConfig = {}
): SiteSchema {
  const {
    enabled = {
      comparison: true,
      calculator: true,
      badges: true,
      recommendations: true,
    },
    placement = {
      comparison: "afterProductGrid",
      calculator: "afterHero",
      badges: "afterHero",
      recommendations: "afterProductGrid",
    },
  } = config;

  // Process each page
  const processedPages: SitePageSchema[] = schema.pages.map((page) => {
    const newLayout: SiteLayout[] = [...page.layout];
    
    // Apply engine overlays based on configuration
    if (enabled.comparison) {
      injectComparisonBlocks(newLayout, siteData, placement.comparison || "afterProductGrid");
    }
    
    if (enabled.calculator) {
      injectCalculatorBlocks(newLayout, siteData, placement.calculator || "afterHero");
    }
    
    if (enabled.badges) {
      injectBadgeBlocks(newLayout, siteData, placement.badges || "afterHero");
    }
    
    if (enabled.recommendations) {
      injectRecommendationBlocks(newLayout, siteData, placement.recommendations || "afterProductGrid");
    }
    
    return {
      ...page,
      layout: newLayout,
    };
  });

  return {
    ...schema,
    pages: processedPages,
  };
}

/**
 * Inject comparison blocks into layout
 */
function injectComparisonBlocks(
  layout: SiteLayout[],
  siteData: NormalizedSite,
  placement: "afterProductGrid" | "afterText" | "beforeFooter"
): void {
  // Only inject if we have products to compare
  if (!siteData.products || siteData.products.length < 2) {
    return;
  }

  const comparisonBlock: SiteLayout = {
    type: "comparison",
    engineId: "value-comparison",
    data: {
      products: siteData.products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price?.amount,
        category: p.category,
        attributes: p.attributes,
      })),
    },
  };

  insertBlockAtPlacement(layout, comparisonBlock, placement);
}

/**
 * Inject calculator blocks into layout
 */
function injectCalculatorBlocks(
  layout: SiteLayout[],
  siteData: NormalizedSite,
  placement: "afterHero" | "afterText" | "beforeFooter"
): void {
  // Determine which calculator to use based on site data
  const calculatorId = determineCalculatorId(siteData);
  if (!calculatorId) {
    return;
  }

  const calculatorBlock: SiteLayout = {
    type: "calculator",
    engineId: calculatorId,
    data: {
      context: {
        domain: siteData.domain,
        productCount: siteData.products.length,
        hasProducts: siteData.products.length > 0,
      },
    },
  };

  insertBlockAtPlacement(layout, calculatorBlock, placement);
}

/**
 * Inject badge blocks into layout
 */
function injectBadgeBlocks(
  layout: SiteLayout[],
  siteData: NormalizedSite,
  placement: "afterHero" | "inline"
): void {
  // Generate badges based on site data
  const badges: SiteLayout[] = [];

  // Add product count badge if we have products
  if (siteData.products && siteData.products.length > 0) {
    badges.push({
      type: "badge",
      label: `${siteData.products.length} Products Available`,
      variant: "info",
      data: {
        count: siteData.products.length,
      },
    });
  }

  // Add quality badge if we have value propositions or research
  if (siteData.media && siteData.media.length > 5) {
    badges.push({
      type: "badge",
      label: "Premium Quality",
      variant: "success",
    });
  }

  // Insert badges at specified placement
  if (placement === "afterHero") {
    // Find first hero block and insert after it
    const heroIndex = layout.findIndex(block => block.type === "hero");
    if (heroIndex !== -1) {
      layout.splice(heroIndex + 1, 0, ...badges);
    } else {
      // If no hero, insert at beginning
      layout.unshift(...badges);
    }
  } else {
    // Inline: insert after first content block
    const contentIndex = layout.findIndex(
      block => block.type === "text" || block.type === "image"
    );
    if (contentIndex !== -1) {
      layout.splice(contentIndex + 1, 0, ...badges);
    }
  }
}

/**
 * Inject recommendation blocks into layout
 */
function injectRecommendationBlocks(
  layout: SiteLayout[],
  siteData: NormalizedSite,
  placement: "afterProductGrid" | "beforeFooter"
): void {
  // Generate recommendations based on site data
  if (!siteData.products || siteData.products.length === 0) {
    return;
  }

  // Get top products (first 3-5)
  const topProducts = siteData.products.slice(0, 5);

  const recommendationBlock: SiteLayout = {
    type: "recommendation",
    title: "Recommended for You",
    items: topProducts.map(product => ({
      id: product.id,
      title: product.name,
      description: product.description,
      image: product.images && product.images.length > 0 ? product.images[0] : undefined,
      action: product.url ? {
        label: "Learn More",
        href: product.url,
      } : undefined,
      metadata: {
        category: product.category,
        brand: product.brand,
        price: product.price?.amount,
      },
    })),
    data: {
      source: "engine",
      algorithm: "top-products",
    },
  };

  insertBlockAtPlacement(layout, recommendationBlock, placement);
}

/**
 * Insert a block at the specified placement position
 */
function insertBlockAtPlacement(
  layout: SiteLayout[],
  block: SiteLayout,
  placement: "afterProductGrid" | "afterText" | "beforeFooter" | "afterHero"
): void {
  switch (placement) {
    case "afterProductGrid":
      const productGridIndex = layout.findIndex(b => b.type === "productGrid");
      if (productGridIndex !== -1) {
        layout.splice(productGridIndex + 1, 0, block);
      } else {
        // If no product grid, insert before footer
        const footerIndex = layout.findIndex(b => b.type === "footer");
        if (footerIndex !== -1) {
          layout.splice(footerIndex, 0, block);
        } else {
          layout.push(block);
        }
      }
      break;

    case "afterText":
      // Find last text block
      let textIndex = -1;
      for (let i = layout.length - 1; i >= 0; i--) {
        if (layout[i].type === "text") {
          textIndex = i;
          break;
        }
      }
      if (textIndex !== -1) {
        layout.splice(textIndex + 1, 0, block);
      } else {
        // If no text, insert before footer
        const footerIndex = layout.findIndex(b => b.type === "footer");
        if (footerIndex !== -1) {
          layout.splice(footerIndex, 0, block);
        } else {
          layout.push(block);
        }
      }
      break;

    case "beforeFooter":
      const footerIndex = layout.findIndex(b => b.type === "footer");
      if (footerIndex !== -1) {
        layout.splice(footerIndex, 0, block);
      } else {
        layout.push(block);
      }
      break;

    case "afterHero":
      const heroIndex = layout.findIndex(b => b.type === "hero");
      if (heroIndex !== -1) {
        layout.splice(heroIndex + 1, 0, block);
      } else {
        // If no hero, insert at beginning (after nav if present)
        const navIndex = layout.findIndex(b => b.type === "nav");
        if (navIndex !== -1) {
          layout.splice(navIndex + 1, 0, block);
        } else {
          layout.unshift(block);
        }
      }
      break;
  }
}

/**
 * Determine which calculator engine to use based on site data
 */
function determineCalculatorId(siteData: NormalizedSite): string | null {
  // Simple heuristic: use product calculator if we have products
  if (siteData.products && siteData.products.length > 0) {
    return "product-calculator";
  }

  // Could add more logic here based on site domain, category, etc.
  return null;
}
