/**
 * Site Layout Schema Types
 * 
 * JSON schema that describes page layout blocks.
 * Pure data structure - no UI, no JSX, no rendering logic.
 */

/**
 * Individual layout block types
 * 
 * Each block can optionally include a `role` property that maps to layout profile sections.
 * This enables the layout dropdown (Website/App/Learning) to control layout dynamically.
 * 
 * Role mappings:
 * - "hero" → hero section layout
 * - "content" → content section layout (text, image, list)
 * - "features" → features section layout (productGrid, featureGrid)
 * - "footer" → footer section layout
 */
export type SiteLayout =
  | { type: "hero"; heading: string; subheading?: string; image?: string; role?: "hero" }
  | { type: "text"; body: string; role?: "content" }
  | { type: "image"; src: string; caption?: string; role?: "content" }
  | { type: "list"; items: string[]; role?: "content" }
  | { type: "productGrid"; source: "products"; filter?: string; products?: Array<{ id: string; name: string; brand?: string; images: string[]; url?: string }>; role?: "features" }
  | { type: "featuredProductGrid"; title?: string; products?: Array<{ id: string; name: string; brand?: string; images: string[]; url?: string }>; role?: "features" }
  | { type: "nav"; role?: never }
  | { type: "footer"; role?: "footer" }
  // Marketing blocks
  | { type: "ctaStrip"; headline: string; subhead?: string; primaryLink?: { label: string; href: string }; secondaryLink?: { label: string; href: string }; role?: "content" }
  | { type: "featureGrid"; title?: string; items: FeatureItem[]; role?: "features" }
  | { type: "split"; left: { type: string; ref: string }; right: { type: string; ref: string }; emphasis?: "left" | "right"; role?: "content" }
  | { type: "categoryGrid"; title?: string; categories: CategoryItem[]; role?: "features" }
  | { type: "trustBar"; items: TrustItem[]; role?: "content" }
  // Engine overlay blocks
  | { type: "comparison"; engineId: string; data: any; role?: "content" }
  | { type: "calculator"; engineId: string; data: any; role?: "content" }
  | { type: "badge"; label: string; variant?: "success" | "warning" | "info" | "error"; data?: any; role?: "content" }
  | { type: "recommendation"; title: string; items: RecommendationItem[]; data?: any; role?: "content" };

/**
 * Feature item structure
 */
export interface FeatureItem {
  title: string;
  body?: string;
  icon?: string;
  image?: string;
}

/**
 * Category item structure
 */
export interface CategoryItem {
  label: string;
  image?: string;
  href: string;
}

/**
 * Trust item structure
 */
export interface TrustItem {
  label: string;
  sublabel?: string;
}

/**
 * Recommendation item structure
 */
export interface RecommendationItem {
  id: string;
  title: string;
  description?: string;
  image?: string;
  action?: {
    label: string;
    href: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Page schema definition
 */
export interface SitePageSchema {
  id: string;
  title: string;
  layout: SiteLayout[];
}

/**
 * Schema metadata for debugging
 */
export interface SchemaMeta {
  generatedAt: string;
  domain: string;
  rulesVersion: string;
  stats: {
    pages: number;
    products: number;
    images: number;
    categories: number;
  };
}

/**
 * Complete site schema
 */
export interface SiteSchema {
  domain: string;
  pages: SitePageSchema[];
  meta?: SchemaMeta;
}
