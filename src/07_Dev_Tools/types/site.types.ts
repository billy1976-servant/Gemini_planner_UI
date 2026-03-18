/**
 * Site Structure Types
 * Phase 1 - Core Site Structure
 */

export type PageMetadata = {
  id: string;
  path: string;
  title: string;
  description?: string;
  ogImage?: string;
  template?: string;
  screen: string;
};

export type SiteNavigation = {
  logo?: {
    image: string;
    alt: string;
    href: string;
  };
  links: NavigationLink[];
  cta?: {
    label: string;
    href: string;
    variant?: string;
  };
};

export type NavigationLink = {
  id: string;
  label: string;
  href: string;
  dropdown?: NavigationLink[];
};

export type SiteFooter = {
  columns?: FooterColumn[];
  newsletter?: {
    title: string;
    placeholder: string;
    buttonLabel: string;
  };
  copyright?: string;
};

export type FooterColumn = {
  title: string;
  links?: Array<{ label: string; href: string }>;
  social?: Array<{ platform: string; href: string }>;
};

export type SiteConfig = {
  id: string;
  type: "site";
  pages: PageMetadata[];
  navigation?: SiteNavigation;
  footer?: SiteFooter;
  defaultTemplate?: string;
};
