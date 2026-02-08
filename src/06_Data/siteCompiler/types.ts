/**
 * Unified Site Compilation Types
 * 
 * Defines the structure for compiled site data that drives
 * the website reconstruction engine.
 */

export interface CompiledSiteModel {
  domain: string;
  pages: PageModel[];
  navigation: NavItem[];
  products: ProductModel[];
  valueProps: ValueProp[];
  brand: BrandModel;
  metadata: SiteMetadata;
}

export interface PageModel {
  id: string;
  path: string;
  title: string;
  sections: PageSection[];
  metadata?: PageMetadata;
}

export type PageSection =
  | HeroSection
  | ValueSection
  | ProductGridSection
  | ContentSection
  | CTASection
  | FeatureSection
  | TrustSection;

export interface HeroSection {
  type: "hero";
  headline: string;
  subheadline?: string;
  image?: ImageData;
  cta?: CTAButton;
  backgroundImage?: string;
}

export interface ValueSection {
  type: "value";
  title?: string;
  valueProps: ValueProp[];
  layout?: "grid" | "list" | "carousel";
}

export interface ProductGridSection {
  type: "product-grid";
  title?: string;
  products: ProductModel[];
  columns?: number;
  showFilters?: boolean;
}

export interface ContentSection {
  type: "content";
  title?: string;
  content: ContentBlock[];
  layout?: "single" | "two-column" | "three-column";
}

export interface CTASection {
  type: "cta";
  headline: string;
  description?: string;
  primaryCTA: CTAButton;
  secondaryCTA?: CTAButton;
  background?: string;
}

export interface FeatureSection {
  type: "feature";
  title?: string;
  features: Feature[];
  layout?: "grid" | "list";
}

export interface TrustSection {
  type: "trust";
  title?: string;
  trustIndicators: TrustIndicator[];
}

export interface NavItem {
  label: string;
  path: string;
  children?: NavItem[];
  external?: boolean;
}

export interface ProductModel {
  id: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  price?: PriceData;
  images: ImageData[];
  url?: string;
  features?: string[];
  specifications?: Record<string, string>;
  valueProps?: string[]; // References to value proposition IDs
}

export interface ValueProp {
  id: string;
  dimensionId: string;
  rank: number;
  statement: string;
  type: "benefit" | "lossAvoidance" | "peaceOfMind";
  proof?: {
    math?: string;
    logic?: string;
    assumptions?: string[];
    facts?: string[];
  };
  magnitude?: {
    value: number;
    unit: string;
    confidence: "low" | "medium" | "high";
  };
  source?: {
    assumptionId: string;
    factId: string;
    citation: {
      url: string;
      label: string;
      snippet?: string;
    };
  };
  supportingFacts?: {
    siteFacts: string[];
    assumptions: string[];
    researchFacts: string[];
  };
}

export interface BrandModel {
  name: string;
  domain: string;
  logo?: ImageData;
  tagline?: string;
  description?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
}

export interface ImageData {
  url: string;
  alt: string;
  sourceUrl?: string;
  width?: number;
  height?: number;
}

export interface PriceData {
  amount: number;
  currency: string;
  source?: {
    label: string;
    url: string;
    snippet?: string;
    kind?: string;
  };
}

export interface CTAButton {
  label: string;
  url: string;
  variant?: "primary" | "secondary" | "outline";
  external?: boolean;
}

export interface ContentBlock {
  type: "text" | "image" | "quote" | "list" | "heading";
  content: string;
  metadata?: Record<string, any>;
}

export interface Feature {
  title: string;
  description: string;
  icon?: string;
  image?: ImageData;
}

export interface TrustIndicator {
  type: "testimonial" | "statistic" | "badge" | "certification";
  content: string;
  source?: string;
  image?: ImageData;
}

export interface PageMetadata {
  description?: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
}

export interface SiteMetadata {
  compiledAt: string;
  sourceFiles: string[];
  version?: string;
}
