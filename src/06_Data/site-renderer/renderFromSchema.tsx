/**
 * Schema-Based Renderer
 * 
 * Renders layout blocks from SiteSchema JSON.
 * Pure rendering - reads schema only, no hardcoded content.
 * SINGLE SOURCE OF LAYOUT TRUTH - all layout styles applied here.
 */

import React from "react";
import HeroSection from "@/components/site/HeroSection";
import TextSection from "@/components/site/TextSection";
import ImageSection from "@/components/site/ImageSection";
import ListSection from "@/components/site/ListSection";
import ProductGridSection, { ProductCard } from "@/components/site/ProductGridSection";
import CategoryGridSection from "@/components/site/CategoryGridSection";
import NavBar from "@/components/site/NavBar";
import Footer from "@/components/site/Footer";
import ComparisonSection from "@/components/site/ComparisonSection";
import CalculatorSection from "@/components/site/CalculatorSection";
import BadgeSection from "@/components/site/BadgeSection";
import RecommendationSection from "@/components/site/RecommendationSection";
import { SiteLayout, FeatureItem, TrustItem } from "@/lib/site-schema/siteLayout.types";
import { NormalizedSite, NormalizedProduct } from "@/lib/site-compiler/normalizeSiteData";
import { resolveProfileLayout } from "@/lib/layout/profile-resolver";
import { resolveMoleculeLayout } from "@/layout";
import { resolveScreenLayout } from "@/lib/layout/screen-layout-resolver";
import { RuntimeHelpers, Action, SitePage, LayoutBlock } from "@/types/siteSchema";

interface RenderLayoutBlockProps {
  block: SiteLayout;
  siteData: NormalizedSite;
  experience?: "website" | "app" | "learning";
  helpers?: RuntimeHelpers;
  blockId?: string;
}

/**
 * Get section type identifier (role) for layout resolution
 */
function getSectionTypeFromBlock(block: SiteLayout): string | undefined {
  // Use explicit role if present (enables layout dropdown control)
  if ("role" in block && block.role) {
    return block.role;
  }
  
  // Fallback to inference from block type (backward compatibility)
  switch (block.type) {
    case "hero": return "hero";
    case "productGrid": return "features";
    case "featureGrid": return "features";
    case "categoryGrid": return "features";
    case "text": return "content";
    case "image": return "content";
    case "list": return "content";
    case "ctaStrip": return "content";
    case "trustBar": return "content";
    case "footer": return "footer";
    default: return undefined;
  }
}

/**
 * Get layout styles for a section
 * 
 * SINGLE SOURCE OF LAYOUT TRUTH - all grid, width, padding, margin styles come from here.
 * Components should NOT define these styles.
 */
function getSectionLayoutStyles(
  block: SiteLayout,
  experience: "website" | "app" | "learning"
): React.CSSProperties {
  // Priority 1: Use explicit block.layout if present (schema-defined layout)
  const blockLayout = (block as any).layout;
  
  if (blockLayout && (blockLayout.type || blockLayout.flow)) {
    const flow = blockLayout.type || blockLayout.flow || "column";
    const preset = blockLayout.preset || null;
    const params = blockLayout.params || {};
    const resolved = resolveMoleculeLayout(flow, preset, params);
    
    // Handle grid layouts - use resolved layout values
    // Check both flow type and resolved properties to ensure grid is detected
    const isGrid = flow === "grid" || resolved.display === "grid" || resolved.gridTemplateColumns;
    
    if (isGrid) {
      return {
        display: "grid",
        gridTemplateColumns: resolved.gridTemplateColumns || "repeat(auto-fit, minmax(280px, 1fr))",
        gap: resolved.gap || params.gap || "clamp(16px, 2vw, 28px)",
        width: "100%",
        ...(resolved.alignItems ? { alignItems: resolved.alignItems } : {}),
        ...(resolved.justifyContent ? { justifyContent: resolved.justifyContent } : {}),
        ...(resolved.padding ? { padding: resolved.padding } : {}),
        ...(resolved.margin ? { margin: resolved.margin } : {}),
      };
    }
    
    // Convert to React CSSProperties for non-grid layouts
    return {
      display: resolved.display || "flex",
      flexDirection: resolved.direction || "column",
      gap: resolved.gap || params.gap || "var(--spacing-6)",
      alignItems: resolved.align || resolved.alignItems || "stretch",
      justifyContent: resolved.justify || resolved.justifyContent || "flex-start",
      width: "100%",
      ...(resolved.padding ? { padding: resolved.padding } : {}),
      ...(resolved.margin ? { margin: resolved.margin } : {}),
    };
  }
  
  // Priority 2: Resolve layout from experience profile based on role
  const sectionType = getSectionTypeFromBlock(block);
  const profileLayout = sectionType
    ? resolveProfileLayout(experience, sectionType)
    : null;
  
  // Use profile layout if available, otherwise fallback to defaults
  const flow = profileLayout?.type || "column";
  const preset = profileLayout?.preset || null;
  const params = profileLayout?.params || {};
  
  // Resolve to CSS properties using molecule layout resolver
  const resolved = resolveMoleculeLayout(flow, preset, params);
  
  // Handle grid layouts - use resolved layout values
  // Check both flow type and resolved properties to ensure grid is detected
  const isGrid = flow === "grid" || resolved.display === "grid" || resolved.gridTemplateColumns;
  
  if (isGrid) {
    return {
      display: "grid",
      gridTemplateColumns: resolved.gridTemplateColumns || "repeat(auto-fit, minmax(280px, 1fr))",
      gap: resolved.gap || params.gap || "clamp(16px, 2vw, 28px)",
      width: "100%",
      ...(resolved.alignItems ? { alignItems: resolved.alignItems } : {}),
      ...(resolved.justifyContent ? { justifyContent: resolved.justifyContent } : {}),
      ...(resolved.padding ? { padding: resolved.padding } : {}),
      ...(resolved.margin ? { margin: resolved.margin } : {}),
    };
  }
  
  // Convert to React CSSProperties for non-grid layouts
  return {
    display: resolved.display || "flex",
    flexDirection: resolved.direction || "column",
    gap: resolved.gap || params.gap || "var(--spacing-6)",
    alignItems: resolved.align || resolved.alignItems || "stretch",
    justifyContent: resolved.justify || resolved.justifyContent || "flex-start",
    width: "100%",
    ...(resolved.padding ? { padding: resolved.padding } : {}),
    ...(resolved.margin ? { margin: resolved.margin } : {}),
  };
}

/**
 * Generic action handler for navigation and interactions
 * 
 * Supports:
 * - NAVIGATE_PAGE: Navigate to a page by pageId or path
 * - OPEN_URL: Open an external URL
 */
export function handleAction(
  action: Action,
  helpers: RuntimeHelpers
): void {
  if (action.type === "NAVIGATE_PAGE") {
    if (action.pageId) {
      helpers.setActivePageId(action.pageId);
    } else if (action.path && helpers.pages) {
      // Find page by path
      const page = helpers.pages.find(p => p.path === action.path);
      if (page) {
        helpers.setActivePageId(page.id);
      }
    }
  } else if (action.type === "OPEN_URL" && action.url) {
    window.open(action.url, "_blank", "noopener,noreferrer");
  }
}

/**
 * Render a single layout block from schema
 * 
 * WRAPS EVERY SECTION ONCE with layout styles from getSectionLayoutStyles().
 * Components inside should NOT add their own wrappers or layout styles.
 */
export function renderLayoutBlock({ block, siteData, experience = "website", helpers, blockId }: RenderLayoutBlockProps): React.ReactElement | null {
  // Render block content (components should NOT have wrappers or layout styles)
  const rendered = renderBlockContent(block, siteData, experience, helpers);
  if (!rendered) return null;
  
  // Nav and footer handle their own layout
  if (block.type === "nav" || block.type === "footer") {
    // Still add ID for consistency
    return blockId ? React.cloneElement(rendered, { id: blockId } as React.HTMLAttributes<HTMLElement>) : rendered;
  }
  
  // Get layout styles for this section - SINGLE SOURCE OF LAYOUT TRUTH
  const sectionStyles = getSectionLayoutStyles(block, experience);
  
  // Ensure wrapper has proper box-sizing and positioning
  const wrapperStyles: React.CSSProperties = {
    boxSizing: "border-box",
    ...sectionStyles,
  };
  
  // Wrap section ONCE with layout styles and add ID for scroll targeting
  return (
    <div id={blockId} style={wrapperStyles}>
      {rendered}
    </div>
  );
}

/**
 * Render block content without layout wrapper
 * 
 * Components should return ONLY content, no wrappers or layout styles.
 */
function renderBlockContent(block: SiteLayout, siteData: NormalizedSite, experience: "website" | "app" | "learning" = "website", helpers?: RuntimeHelpers): React.ReactElement | null {
  switch (block.type) {
    case "hero":
      return (
        <HeroSection
          headline={block.heading}
          subheadline={block.subheading}
          imageUrl={block.image}
          backgroundImage={block.image}
        />
      );

    case "text":
      return (
        <TextSection
          content={block.body}
        />
      );

    case "image":
      return (
        <ImageSection
          imageUrl={block.src}
          alt={block.caption}
          caption={block.caption}
        />
      );

    case "list":
      return (
        <ListSection
          items={block.items}
        />
      );

    case "productGrid": {
      // Use the full normalizedSite.products array with no slicing, filtering, or featured limits.
      const sourceProducts = siteData.products || [];
      const productsToRender: ProductCard[] = sourceProducts.map((product: NormalizedProduct) => ({
        id: product.id,
        title: product.name,
        price: product.price?.amount,
        description: product.description,
        images: product.images,
        url: product.url,
        variants: product.variants,
        variantImages: product.variantImages,
        tags: [
          ...(product.category ? [product.category] : []),
          ...(product.brand ? [product.brand] : []),
          ...(product.attributes
            ? (Object.values(product.attributes).filter(
                (v): v is string => typeof v === "string"
              ) as string[])
            : []),
        ],
      }));

      if (productsToRender.length === 0) {
        return null;
      }

      return (
        <ProductGridSection
          products={productsToRender}
          experience={experience}
        />
      );
    }

    case "nav":
      return (
        <NavBar
          items={siteData.navigation.map(nav => ({
            label: nav.label,
            href: nav.path,
            external: nav.external,
          }))}
          siteTitle={siteData.domain}
        />
      );

    case "categoryGrid":
      return (
        <CategoryGridSection
          title={block.title}
          categories={block.categories}
          siteData={siteData}
          helpers={helpers}
        />
      );

    case "footer":
      return (
        <Footer
          siteId={siteData.domain}
        />
      );

    case "featureGrid":
      return (
        <>
          {block.title && (
            <h2 style={{
              fontSize: "var(--font-size-3xl)",
              fontWeight: "var(--font-weight-semibold)",
              marginBottom: "var(--spacing-8)",
              color: "var(--color-text-primary)",
            }}>
              {block.title}
            </h2>
          )}
          {block.items.map((item: FeatureItem, index: number) => (
            <div key={index} style={{
              padding: "var(--spacing-6)",
              backgroundColor: "var(--color-bg-secondary)",
              borderRadius: "var(--radius-md)",
            }}>
              <h3 style={{
                fontSize: "var(--font-size-xl)",
                fontWeight: "var(--font-weight-semibold)",
                marginBottom: "var(--spacing-2)",
                color: "var(--color-text-primary)",
              }}>
                {item.title}
              </h3>
              {item.body && (
                <p style={{
                  fontSize: "var(--font-size-base)",
                  color: "var(--color-text-secondary)",
                  marginTop: "var(--spacing-2)",
                }}>
                  {item.body}
                </p>
              )}
            </div>
          ))}
        </>
      );

    case "ctaStrip":
      // Helper function to handle link clicks (internal page navigation vs external)
      const handleLinkClick = (href: string, e: React.MouseEvent) => {
        // If href looks like an internal page ID (starts with / and no protocol)
        // and helpers are available, use setActivePageId instead of navigation
        if (helpers && href.startsWith("/") && !href.includes("://")) {
          e.preventDefault();
          helpers.setActivePageId(href);
        }
        // Otherwise, let default anchor behavior handle it (external links)
      };

      return (
        <div style={{
          padding: "var(--spacing-8)",
          backgroundColor: "var(--color-primary)",
          borderRadius: "var(--radius-lg)",
          textAlign: "center",
        }}>
          <h2 style={{
            fontSize: "var(--font-size-3xl)",
            fontWeight: "var(--font-weight-bold)",
            marginBottom: "var(--spacing-4)",
            color: "#ffffff",
          }}>
            {block.headline}
          </h2>
          {block.subhead && (
            <p style={{
              fontSize: "var(--font-size-lg)",
              marginBottom: "var(--spacing-6)",
              color: "#ffffff",
            }}>
              {block.subhead}
            </p>
          )}
          <div style={{
            display: "flex",
            gap: "var(--spacing-4)",
            justifyContent: "center",
            flexWrap: "wrap",
          }}>
            {block.primaryLink && (
              <a
                href={block.primaryLink.href}
                onClick={(e) => handleLinkClick(block.primaryLink!.href, e)}
                style={{
                  padding: "var(--spacing-4) var(--spacing-8)",
                  backgroundColor: "#ffffff",
                  color: "var(--color-primary)",
                  textDecoration: "none",
                  borderRadius: "var(--radius-md)",
                  fontWeight: "var(--font-weight-semibold)",
                  cursor: "pointer",
                }}
              >
                {block.primaryLink.label}
              </a>
            )}
            {block.secondaryLink && (
              <a
                href={block.secondaryLink.href}
                onClick={(e) => handleLinkClick(block.secondaryLink!.href, e)}
                style={{
                  padding: "var(--spacing-4) var(--spacing-8)",
                  backgroundColor: "transparent",
                  color: "#ffffff",
                  textDecoration: "none",
                  borderRadius: "var(--radius-md)",
                  border: "2px solid #ffffff",
                  fontWeight: "var(--font-weight-semibold)",
                  cursor: "pointer",
                }}
              >
                {block.secondaryLink.label}
              </a>
            )}
          </div>
        </div>
      );

    case "trustBar":
      return (
        <div style={{
          display: "flex",
          gap: "var(--spacing-6)",
          justifyContent: "center",
          flexWrap: "wrap",
          padding: "var(--spacing-4)",
        }}>
          {block.items.map((item: TrustItem, index: number) => (
            <div key={index} style={{
              textAlign: "center",
            }}>
              <div style={{
                fontSize: "var(--font-size-lg)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--color-text-primary)",
              }}>
                {item.label}
              </div>
              {item.sublabel && (
                <div style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-secondary)",
                  marginTop: "var(--spacing-1)",
                }}>
                  {item.sublabel}
                </div>
              )}
            </div>
          ))}
        </div>
      );

    case "split":
      // Split sections are complex - for now, render as simple content
      return (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "var(--spacing-6)",
        }}>
          <div style={{ padding: "var(--spacing-4)" }}>
            {/* Left content would be resolved from ref */}
          </div>
          <div style={{ padding: "var(--spacing-4)" }}>
            {/* Right content would be resolved from ref */}
          </div>
        </div>
      );

    case "comparison":
      return (
        <ComparisonSection
          engineId={block.engineId}
          data={block.data}
        />
      );

    case "calculator":
      return (
        <CalculatorSection
          engineId={block.engineId}
          data={block.data}
        />
      );

    case "badge":
      return (
        <BadgeSection
          label={block.label}
          variant={block.variant}
          data={block.data}
        />
      );

    case "recommendation":
      return (
        <RecommendationSection
          title={block.title}
          items={block.items}
          data={block.data}
        />
      );

    case "featuredProductGrid":
      return null;

    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = block;
      return null;
  }
}

/**
 * Convert LayoutBlock to SiteLayout format for rendering
 * 
 * LayoutBlock has content nested, SiteLayout has properties flat
 */
function convertLayoutBlockToSiteLayout(block: LayoutBlock | SiteLayout): SiteLayout {
  // If already SiteLayout format, return as-is
  if (!('content' in block) || !block.content) {
    return block as SiteLayout;
  }
  
  // Convert LayoutBlock to SiteLayout by extracting content properties
  const layoutBlock = block as LayoutBlock;
  const baseBlock: any = {
    type: layoutBlock.type,
    ...layoutBlock, // Preserve all properties
  };
  
  // Extract content properties based on type
  if (layoutBlock.content) {
    if (layoutBlock.type === "hero") {
      baseBlock.heading = layoutBlock.content.heading;
      baseBlock.subheading = layoutBlock.content.subheading;
      baseBlock.image = layoutBlock.content.image;
    } else if (layoutBlock.type === "text") {
      baseBlock.body = layoutBlock.content.body;
    } else if (layoutBlock.type === "image") {
      baseBlock.src = layoutBlock.content.src;
      baseBlock.caption = layoutBlock.content.caption;
    } else if (layoutBlock.type === "list") {
      baseBlock.items = layoutBlock.content.items;
    } else if (layoutBlock.type === "categoryGrid") {
      baseBlock.title = layoutBlock.content.title;
      baseBlock.categories = layoutBlock.content.categories;
    } else if (layoutBlock.type === "featureGrid") {
      baseBlock.title = layoutBlock.content.title;
      baseBlock.items = layoutBlock.content.items;
    } else if (layoutBlock.type === "productGrid") {
      baseBlock.source = layoutBlock.content.source || "products";
      baseBlock.filter = layoutBlock.content.filter;
    } else if (layoutBlock.type === "ctaStrip") {
      baseBlock.headline = layoutBlock.content.headline;
      baseBlock.subhead = layoutBlock.content.subhead;
      baseBlock.primaryLink = layoutBlock.content.primaryLink;
      baseBlock.secondaryLink = layoutBlock.content.secondaryLink;
    } else if (layoutBlock.type === "trustBar") {
      baseBlock.items = layoutBlock.content.items;
    }
  }
  
  // Preserve role if present
  if ('role' in layoutBlock && layoutBlock.role) {
    baseBlock.role = layoutBlock.role;
  }
  
  return baseBlock as SiteLayout;
}

/**
 * Render multiple layout blocks
 * 
 * Accepts both LayoutBlock[] (new format) and SiteLayout[] (old format)
 */
export function renderLayoutBlocks(
  blocks: (SiteLayout | LayoutBlock)[],
  siteData: NormalizedSite,
  experience: "website" | "app" | "learning" = "website",
  helpers?: RuntimeHelpers
): React.ReactElement[] {
  // Debug: count sections and productGrid blocks
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const productGridCount = blocks.filter(b => {
      const layout = convertLayoutBlockToSiteLayout(b);
      return layout.type === 'productGrid';
    }).length;
    console.log('[renderLayoutBlocks]', {
      totalBlocks: blocks.length,
      productGridBlocks: productGridCount,
      totalProducts: siteData.products?.length || 0,
    });
  }
  
  return blocks
    .map((block, index) => {
      // Convert LayoutBlock to SiteLayout if needed
      const siteLayout = convertLayoutBlockToSiteLayout(block);
      
      // Get block ID for scroll targeting (from block.id or generate from index)
      const blockId = 'id' in block && block.id ? `block-${block.id}` : `block-${index}`;
      const rendered = renderLayoutBlock({ block: siteLayout, siteData, experience, helpers, blockId });
      return rendered ? React.cloneElement(rendered, { key: blockId }) : null;
    })
    .filter((element): element is React.ReactElement => element !== null);
}
