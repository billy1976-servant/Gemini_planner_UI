/**
 * Canonical Site Schema Types
 * 
 * Single source of truth for page-aware schema structure.
 * Used throughout the codebase for type safety and consistency.
 */

/**
 * Theme tokens (optional)
 */
export interface ThemeTokens {
  colors?: Record<string, string>;
  spacing?: Record<string, string>;
  typography?: Record<string, any>;
  [key: string]: any;
}

/**
 * Layout Block
 * 
 * Represents a single UI section/component in the schema.
 * Each block has an id for scroll targeting and action handling.
 */
export interface LayoutBlock {
  id: string;
  type: string;
  content?: any;
  layout?: {
    type?: string;
    params?: Record<string, any>;
    [key: string]: any;
  };
  actions?: Action[];
  // Allow additional properties for backward compatibility with SiteLayout
  [key: string]: any;
}

/**
 * Action types for navigation and interactions
 */
export type Action =
  | { type: "NAVIGATE_PAGE"; pageId?: string; path?: string }
  | { type: "OPEN_URL"; url: string }
  | { type: string; [key: string]: any }; // Allow other action types

/**
 * Site Page
 * 
 * Represents a single page in the site with its sections.
 */
export interface SitePage {
  id: string;
  path: string;
  title?: string;
  sections: LayoutBlock[];
}

/**
 * Site Schema
 * 
 * Top-level schema structure containing all pages and site metadata.
 */
export interface SiteSchema {
  siteId?: string;
  domain: string;
  pages: SitePage[];
  theme?: ThemeTokens;
  // Allow additional properties for backward compatibility
  meta?: any;
  [key: string]: any;
}

/**
 * Runtime Helpers
 * 
 * Provides runtime functions for page navigation and state management.
 * Passed to components via renderFromSchema.
 */
export interface RuntimeHelpers {
  activePageId: string | null;
  setActivePageId: (id: string) => void;
  pages?: SitePage[]; // Pages array for path-based navigation
}
