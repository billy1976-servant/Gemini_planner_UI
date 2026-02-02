/**
 * Template-Driven Layout Layer
 * Overrides profile.sections and profile.visualPreset for JSON screens.
 * Does NOT touch palette, behavior, state, or screen JSON.
 */

export type LayoutDef = {
  type: "row" | "column" | "grid" | "stack";
  params?: {
    gap?: string;
    columns?: number;
    align?: string;
    justify?: string;
    padding?: string;
    wrap?: string;
    width?: string;
    maxWidth?: string;
  };
};

/** Section width behavior: contained (content), edge-to-edge (full bleed), narrow (reading), wide (hero), full, split (50/50) */
export type ContainerWidth = "contained" | "edge-to-edge" | "narrow" | "wide" | "full" | "split";

/** Spacing scale id: drives vertical rhythm and density per template */
export type SpacingScaleId = "default" | "luxury" | "saas" | "magazine" | "course";

/** Card style preset: soft shadow, borderless, elevated, dividers, luxury */
export type CardPresetId = "default" | "soft" | "borderless" | "elevated" | "luxury" | "dividers";

/** Hero layout mode: centered block, split, full-screen, overlay, strip */
export type HeroMode = "centered" | "split" | "full-screen" | "overlay" | "strip";

/** Section background pattern: none, alternating, hero accent, dark bands */
export type SectionBackgroundPattern = "none" | "alternate" | "hero-accent" | "dark-bands";

export type TemplateProfile = {
  id: string;
  label: string;
  visualPreset: "default" | "compact" | "spacious" | "editorial" | "prominent";
  /** Section role → layout (type + params). Template overrides organ defaults at render time. */
  sections: Record<string, LayoutDef>;
  /** Default section width; overridden per role by widthByRole when set. */
  containerWidth?: ContainerWidth;
  /** Per-section-role width overrides (e.g. hero edge-to-edge, content contained). */
  widthByRole?: Partial<Record<string, ContainerWidth>>;
  /** Spacing scale: luxury / saas / magazine / course — drives gap and padding rhythm. */
  spacingScale?: SpacingScaleId;
  /** Card style: soft / borderless / elevated / luxury / dividers. */
  cardPreset?: CardPresetId;
  /** Hero section mode: centered / split / full-screen / overlay / strip. */
  heroMode?: HeroMode;
  /** Section background pattern: alternate / hero-accent / dark-bands. */
  sectionBackgroundPattern?: SectionBackgroundPattern;
};

const TEMPLATES: TemplateProfile[] = [
  // Centered hero, contained sections, soft cards (default preset)
  {
    id: "modern-hero-centered",
    label: "Modern Hero Centered",
    visualPreset: "default",
    containerWidth: "contained",
    widthByRole: { hero: "wide", content: "contained" },
    spacingScale: "default",
    cardPreset: "soft",
    heroMode: "centered",
    sections: {
      nav: { type: "row", params: { gap: "1rem", justify: "space-between", align: "center", wrap: "wrap" } },
      header: { type: "row", params: { gap: "1.25rem", justify: "space-between", align: "center", wrap: "wrap" } },
      hero: { type: "column", params: { align: "center", gap: "2.5rem", padding: "3rem 0" } },
      content: { type: "column", params: { gap: "2rem" } },
      features: { type: "grid", params: { columns: 3, gap: "2rem" } },
      gallery: { type: "grid", params: { columns: 4, gap: "1.5rem" } },
      testimonials: { type: "grid", params: { columns: 3, gap: "2rem" } },
      pricing: { type: "grid", params: { columns: 3, gap: "2rem" } },
      faq: { type: "column", params: { gap: "1.5rem" } },
      cta: { type: "column", params: { align: "center", gap: "2rem" } },
      products: { type: "grid", params: { columns: 3, gap: "2rem" } },
      footer: { type: "grid", params: { columns: 4, gap: "2rem" } },
    },
  },
  {
    id: "startup-split-hero",
    label: "Startup Split Hero",
    visualPreset: "prominent",
    containerWidth: "contained",
    spacingScale: "saas",
    cardPreset: "elevated",
    heroMode: "split",
    sectionBackgroundPattern: "alternate",
    sections: {
      header: { type: "row", params: { gap: "1.25rem", justify: "space-between", align: "center" } },
      hero: { type: "row", params: { justify: "space-between", gap: "3rem", align: "center" } },
      content: { type: "column", params: { gap: "2rem" } },
      features: { type: "grid", params: { columns: 2, gap: "2.5rem" } },
      gallery: { type: "grid", params: { columns: 3, gap: "2rem" } },
      testimonials: { type: "grid", params: { columns: 2, gap: "2rem" } },
      pricing: { type: "grid", params: { columns: 2, gap: "2rem" } },
      faq: { type: "column", params: { gap: "1.5rem" } },
      cta: { type: "column", params: { align: "center", gap: "2rem" } },
      products: { type: "grid", params: { columns: 2, gap: "2rem" } },
      footer: { type: "grid", params: { columns: 3, gap: "2rem" } },
    },
  },
  // Single column, large typography, spacious layout (editorial preset)
  {
    id: "editorial-story",
    label: "Editorial Story",
    visualPreset: "editorial",
    containerWidth: "narrow",
    spacingScale: "magazine",
    cardPreset: "borderless",
    heroMode: "centered",
    sections: {
      header: { type: "column", params: { gap: "0.5rem", align: "center" } },
      hero: { type: "column", params: { align: "center", gap: "3rem" } },
      content: { type: "column", params: { gap: "2.5rem" } },
      features: { type: "column", params: { gap: "2.5rem" } },
      gallery: { type: "grid", params: { columns: 2, gap: "2rem" } },
      testimonials: { type: "column", params: { gap: "2.5rem" } },
      pricing: { type: "column", params: { gap: "2rem" } },
      faq: { type: "column", params: { gap: "2rem" } },
      cta: { type: "column", params: { align: "center", gap: "2rem" } },
      products: { type: "column", params: { gap: "2rem" } },
      footer: { type: "column", params: { align: "center", gap: "2rem" } },
    },
  },
  // Split hero, narrow content column, stacked sections
  {
    id: "course-landing",
    label: "Course Landing",
    visualPreset: "editorial",
    containerWidth: "narrow",
    sections: {
      header: { type: "row", params: { gap: "1rem", justify: "space-between", align: "center" } },
      hero: { type: "row", params: { justify: "space-between", gap: "2.5rem", align: "center" } },
      content: { type: "stack", params: { gap: "2rem" } },
      features: { type: "column", params: { gap: "2rem" } },
      gallery: { type: "grid", params: { columns: 2, gap: "2rem" } },
      testimonials: { type: "column", params: { gap: "2rem" } },
      pricing: { type: "grid", params: { columns: 2, gap: "2rem" } },
      faq: { type: "column", params: { gap: "1.5rem" } },
      cta: { type: "column", params: { align: "center", gap: "2rem" } },
      products: { type: "grid", params: { columns: 2, gap: "1.5rem" } },
      footer: { type: "column", params: { align: "center", gap: "2rem" } },
    },
  },
  // Wide layout, multi-column grids, dense cards (compact preset)
  {
    id: "product-grid",
    label: "Product Grid",
    visualPreset: "compact",
    containerWidth: "contained",
    spacingScale: "saas",
    cardPreset: "elevated",
    heroMode: "strip",
    sections: {
      header: { type: "row", params: { gap: "0.75rem", justify: "space-between", align: "center" } },
      hero: { type: "column", params: { gap: "1rem", align: "center" } },
      content: { type: "grid", params: { columns: 4, gap: "1rem" } },
      features: { type: "grid", params: { columns: 4, gap: "1rem" } },
      gallery: { type: "grid", params: { columns: 4, gap: "0.75rem" } },
      testimonials: { type: "grid", params: { columns: 3, gap: "1rem" } },
      pricing: { type: "grid", params: { columns: 4, gap: "1rem" } },
      faq: { type: "column", params: { gap: "0.75rem" } },
      cta: { type: "column", params: { align: "center", gap: "1rem" } },
      products: { type: "grid", params: { columns: 4, gap: "1rem" } },
      footer: { type: "grid", params: { columns: 4, gap: "1rem" } },
    },
  },
  {
    id: "saas-dark",
    label: "SaaS Dark",
    visualPreset: "default",
    containerWidth: "contained",
    sections: {
      header: { type: "row", params: { gap: "1rem", justify: "space-between", align: "center" } },
      hero: { type: "column", params: { align: "center", gap: "2.5rem" } },
      content: { type: "column", params: { gap: "2rem" } },
      features: { type: "grid", params: { columns: 3, gap: "2rem" } },
      gallery: { type: "grid", params: { columns: 3, gap: "1.5rem" } },
      testimonials: { type: "grid", params: { columns: 3, gap: "2rem" } },
      pricing: { type: "grid", params: { columns: 3, gap: "2rem" } },
      faq: { type: "column", params: { gap: "1.5rem" } },
      cta: { type: "column", params: { align: "center", gap: "1.5rem" } },
      products: { type: "grid", params: { columns: 3, gap: "2rem" } },
      footer: { type: "grid", params: { columns: 4, gap: "2rem" } },
    },
  },
  {
    id: "agency-bold",
    label: "Agency Bold",
    visualPreset: "prominent",
    containerWidth: "contained",
    widthByRole: { hero: "edge-to-edge" },
    spacingScale: "default",
    cardPreset: "elevated",
    heroMode: "overlay",
    sectionBackgroundPattern: "dark-bands",
    sections: {
      header: { type: "row", params: { gap: "1.5rem", justify: "space-between", align: "center" } },
      hero: { type: "row", params: { justify: "space-between", gap: "3rem", align: "center" } },
      content: { type: "column", params: { gap: "2rem" } },
      features: { type: "grid", params: { columns: 2, gap: "2.5rem" } },
      gallery: { type: "grid", params: { columns: 3, gap: "2rem" } },
      testimonials: { type: "grid", params: { columns: 2, gap: "2.5rem" } },
      pricing: { type: "grid", params: { columns: 2, gap: "2rem" } },
      faq: { type: "column", params: { gap: "2rem" } },
      cta: { type: "column", params: { align: "center", gap: "2rem" } },
      products: { type: "grid", params: { columns: 2, gap: "2rem" } },
      footer: { type: "grid", params: { columns: 3, gap: "2rem" } },
    },
  },
  {
    id: "minimalist",
    label: "Minimalist",
    visualPreset: "compact",
    containerWidth: "narrow",
    sections: {
      header: { type: "row", params: { gap: "0.5rem", justify: "space-between", align: "center" } },
      hero: { type: "column", params: { align: "center", gap: "1.5rem" } },
      content: { type: "column", params: { gap: "1rem" } },
      features: { type: "column", params: { gap: "1rem" } },
      gallery: { type: "grid", params: { columns: 3, gap: "0.75rem" } },
      testimonials: { type: "column", params: { gap: "1rem" } },
      pricing: { type: "column", params: { gap: "1rem" } },
      faq: { type: "column", params: { gap: "1rem" } },
      cta: { type: "column", params: { align: "center", gap: "1rem" } },
      products: { type: "column", params: { gap: "1rem" } },
      footer: { type: "column", params: { align: "center", gap: "1rem" } },
    },
  },
  {
    id: "playful-cards",
    label: "Playful Cards",
    visualPreset: "prominent",
    containerWidth: "contained",
    sections: {
      header: { type: "row", params: { gap: "1rem", justify: "space-between", align: "center" } },
      hero: { type: "column", params: { align: "center", gap: "2rem" } },
      content: { type: "grid", params: { columns: 2, gap: "1.5rem" } },
      features: { type: "grid", params: { columns: 3, gap: "1.5rem" } },
      gallery: { type: "grid", params: { columns: 4, gap: "1rem" } },
      testimonials: { type: "grid", params: { columns: 3, gap: "1.5rem" } },
      pricing: { type: "grid", params: { columns: 3, gap: "1.5rem" } },
      faq: { type: "column", params: { gap: "1.5rem" } },
      cta: { type: "column", params: { align: "center", gap: "1.5rem" } },
      products: { type: "grid", params: { columns: 3, gap: "1.5rem" } },
      footer: { type: "grid", params: { columns: 4, gap: "1.5rem" } },
    },
  },
  {
    id: "luxury-spacious",
    label: "Luxury Spacious",
    visualPreset: "spacious",
    containerWidth: "contained",
    sections: {
      header: { type: "row", params: { gap: "2rem", justify: "space-between", align: "center" } },
      hero: { type: "column", params: { align: "center", gap: "3rem" } },
      content: { type: "column", params: { gap: "3rem" } },
      features: { type: "grid", params: { columns: 3, gap: "3rem" } },
      gallery: { type: "grid", params: { columns: 3, gap: "2rem" } },
      testimonials: { type: "grid", params: { columns: 3, gap: "3rem" } },
      pricing: { type: "grid", params: { columns: 3, gap: "3rem" } },
      faq: { type: "column", params: { gap: "2.5rem" } },
      cta: { type: "column", params: { align: "center", gap: "2.5rem" } },
      products: { type: "grid", params: { columns: 3, gap: "3rem" } },
      footer: { type: "grid", params: { columns: 4, gap: "3rem" } },
    },
  },
  // Additional templates to reach 15+
  {
    id: "portfolio-showcase",
    label: "Portfolio Showcase",
    visualPreset: "editorial",
    containerWidth: "contained",
    sections: {
      header: { type: "row", params: { gap: "1rem", justify: "space-between", align: "center" } },
      hero: { type: "column", params: { align: "center", gap: "2.5rem" } },
      content: { type: "column", params: { gap: "2rem" } },
      features: { type: "grid", params: { columns: 2, gap: "2rem" } },
      gallery: { type: "grid", params: { columns: 2, gap: "2rem" } },
      testimonials: { type: "column", params: { gap: "2rem" } },
      pricing: { type: "grid", params: { columns: 2, gap: "2rem" } },
      faq: { type: "column", params: { gap: "1.5rem" } },
      cta: { type: "column", params: { align: "center", gap: "2rem" } },
      products: { type: "grid", params: { columns: 2, gap: "2rem" } },
      footer: { type: "grid", params: { columns: 3, gap: "2rem" } },
    },
  },
  // Full-width hero, 2-column content blocks, compact spacing (edge-to-edge)
  {
    id: "restaurant-menu",
    label: "Restaurant Menu",
    visualPreset: "compact",
    containerWidth: "edge-to-edge",
    spacingScale: "saas",
    cardPreset: "dividers",
    heroMode: "centered",
    sections: {
      header: { type: "row", params: { gap: "1rem", justify: "space-between", align: "center" } },
      hero: { type: "column", params: { align: "center", gap: "1.5rem", padding: "2rem 0" } },
      content: { type: "grid", params: { columns: 2, gap: "1rem" } },
      features: { type: "grid", params: { columns: 2, gap: "1rem" } },
      gallery: { type: "grid", params: { columns: 2, gap: "0.75rem" } },
      testimonials: { type: "grid", params: { columns: 2, gap: "1rem" } },
      pricing: { type: "column", params: { gap: "1rem" } },
      faq: { type: "column", params: { gap: "0.75rem" } },
      cta: { type: "column", params: { align: "center", gap: "1rem" } },
      products: { type: "grid", params: { columns: 2, gap: "1rem" } },
      footer: { type: "grid", params: { columns: 2, gap: "1rem" } },
    },
  },
  {
    id: "blog-magazine",
    label: "Blog Magazine",
    visualPreset: "editorial",
    containerWidth: "contained",
    sections: {
      header: { type: "row", params: { gap: "1rem", justify: "space-between", align: "center" } },
      hero: { type: "column", params: { align: "left", gap: "2rem" } },
      content: { type: "grid", params: { columns: 2, gap: "2rem" } },
      features: { type: "grid", params: { columns: 3, gap: "2rem" } },
      gallery: { type: "grid", params: { columns: 3, gap: "1.5rem" } },
      testimonials: { type: "column", params: { gap: "2rem" } },
      pricing: { type: "grid", params: { columns: 3, gap: "2rem" } },
      faq: { type: "column", params: { gap: "1.5rem" } },
      cta: { type: "column", params: { align: "center", gap: "1.5rem" } },
      products: { type: "grid", params: { columns: 3, gap: "2rem" } },
      footer: { type: "grid", params: { columns: 4, gap: "2rem" } },
    },
  },
  {
    id: "fitness-gym",
    label: "Fitness Gym",
    visualPreset: "prominent",
    sections: {
      header: { type: "row", params: { gap: "1rem", justify: "space-between", align: "center" } },
      hero: { type: "column", params: { align: "center", gap: "2.5rem" } },
      content: { type: "column", params: { gap: "2rem" } },
      features: { type: "grid", params: { columns: 4, gap: "1.5rem" } },
      gallery: { type: "grid", params: { columns: 4, gap: "1rem" } },
      testimonials: { type: "grid", params: { columns: 3, gap: "2rem" } },
      pricing: { type: "grid", params: { columns: 3, gap: "2rem" } },
      faq: { type: "column", params: { gap: "1.5rem" } },
      cta: { type: "column", params: { align: "center", gap: "2rem" } },
      products: { type: "grid", params: { columns: 4, gap: "1.5rem" } },
      footer: { type: "grid", params: { columns: 4, gap: "2rem" } },
    },
  },
  {
    id: "consulting-professional",
    label: "Consulting Professional",
    visualPreset: "default",
    containerWidth: "contained",
    sections: {
      header: { type: "row", params: { gap: "1rem", justify: "space-between", align: "center" } },
      hero: { type: "row", params: { justify: "space-between", gap: "2.5rem", align: "center" } },
      content: { type: "column", params: { gap: "2rem" } },
      features: { type: "grid", params: { columns: 3, gap: "2rem" } },
      gallery: { type: "grid", params: { columns: 3, gap: "1.5rem" } },
      testimonials: { type: "grid", params: { columns: 2, gap: "2rem" } },
      pricing: { type: "grid", params: { columns: 3, gap: "2rem" } },
      faq: { type: "column", params: { gap: "1.5rem" } },
      cta: { type: "column", params: { align: "center", gap: "1.5rem" } },
      products: { type: "grid", params: { columns: 3, gap: "2rem" } },
      footer: { type: "grid", params: { columns: 4, gap: "2rem" } },
    },
  },
  {
    id: "info-page-simple",
    label: "Info Page Simple",
    visualPreset: "compact",
    sections: {
      header: { type: "row", params: { gap: "1rem", justify: "space-between", align: "center" } },
      hero: { type: "column", params: { align: "left", gap: "1.5rem" } },
      content: { type: "column", params: { gap: "1.5rem" } },
      features: { type: "grid", params: { columns: 2, gap: "1.5rem" } },
      gallery: { type: "grid", params: { columns: 3, gap: "1rem" } },
      testimonials: { type: "column", params: { gap: "1.5rem" } },
      pricing: { type: "grid", params: { columns: 2, gap: "1.5rem" } },
      faq: { type: "column", params: { gap: "1rem" } },
      cta: { type: "column", params: { align: "center", gap: "1rem" } },
      products: { type: "grid", params: { columns: 2, gap: "1.5rem" } },
      footer: { type: "grid", params: { columns: 3, gap: "1.5rem" } },
    },
  },
  // Additional templates (8-15)
  {
    id: "tech-startup",
    label: "Tech Startup",
    visualPreset: "prominent",
    containerWidth: "contained",
    sections: {
      header: { type: "row", params: { gap: "1rem", justify: "space-between", align: "center" } },
      hero: { type: "column", params: { align: "center", gap: "2.5rem" } },
      content: { type: "column", params: { gap: "2rem" } },
      features: { type: "grid", params: { columns: 4, gap: "1.5rem" } },
      gallery: { type: "grid", params: { columns: 3, gap: "1.5rem" } },
      testimonials: { type: "grid", params: { columns: 3, gap: "2rem" } },
      pricing: { type: "grid", params: { columns: 3, gap: "2rem" } },
      faq: { type: "column", params: { gap: "1.5rem" } },
      cta: { type: "column", params: { align: "center", gap: "2rem" } },
      products: { type: "grid", params: { columns: 3, gap: "1.5rem" } },
      footer: { type: "grid", params: { columns: 4, gap: "2rem" } },
    },
  },
  {
    id: "e-commerce-store",
    label: "E-Commerce Store",
    visualPreset: "compact",
    sections: {
      header: { type: "row", params: { gap: "1rem", justify: "space-between", align: "center" } },
      hero: { type: "column", params: { align: "center", gap: "2rem" } },
      content: { type: "grid", params: { columns: 4, gap: "1.5rem" } },
      features: { type: "grid", params: { columns: 4, gap: "1.5rem" } },
      gallery: { type: "grid", params: { columns: 5, gap: "1rem" } },
      testimonials: { type: "grid", params: { columns: 4, gap: "1.5rem" } },
      pricing: { type: "grid", params: { columns: 4, gap: "1.5rem" } },
      faq: { type: "column", params: { gap: "1rem" } },
      cta: { type: "column", params: { align: "center", gap: "1.5rem" } },
      products: { type: "grid", params: { columns: 4, gap: "1.5rem" } },
      footer: { type: "grid", params: { columns: 5, gap: "1.5rem" } },
    },
  },
  {
    id: "real-estate-luxury",
    label: "Real Estate Luxury",
    visualPreset: "spacious",
    containerWidth: "contained",
    sections: {
      header: { type: "row", params: { gap: "2rem", justify: "space-between", align: "center" } },
      hero: { type: "column", params: { align: "center", gap: "3.5rem" } },
      content: { type: "column", params: { gap: "3rem" } },
      features: { type: "grid", params: { columns: 2, gap: "3rem" } },
      gallery: { type: "grid", params: { columns: 2, gap: "2rem" } },
      testimonials: { type: "column", params: { gap: "3rem" } },
      pricing: { type: "grid", params: { columns: 2, gap: "3rem" } },
      faq: { type: "column", params: { gap: "2.5rem" } },
      cta: { type: "column", params: { align: "center", gap: "3rem" } },
      products: { type: "grid", params: { columns: 2, gap: "3rem" } },
      footer: { type: "grid", params: { columns: 3, gap: "3rem" } },
    },
  },
  {
    id: "nonprofit-community",
    label: "Nonprofit Community",
    visualPreset: "default",
    containerWidth: "contained",
    sections: {
      header: { type: "row", params: { gap: "1rem", justify: "space-between", align: "center" } },
      hero: { type: "column", params: { align: "center", gap: "2rem" } },
      content: { type: "column", params: { gap: "2rem" } },
      features: { type: "grid", params: { columns: 3, gap: "2rem" } },
      gallery: { type: "grid", params: { columns: 4, gap: "1.5rem" } },
      testimonials: { type: "grid", params: { columns: 2, gap: "2rem" } },
      pricing: { type: "grid", params: { columns: 3, gap: "2rem" } },
      faq: { type: "column", params: { gap: "1.5rem" } },
      cta: { type: "column", params: { align: "center", gap: "2rem" } },
      products: { type: "grid", params: { columns: 3, gap: "2rem" } },
      footer: { type: "grid", params: { columns: 4, gap: "2rem" } },
    },
  },
  {
    id: "medical-clinic",
    label: "Medical Clinic",
    visualPreset: "compact",
    sections: {
      header: { type: "row", params: { gap: "1rem", justify: "space-between", align: "center" } },
      hero: { type: "column", params: { align: "center", gap: "2rem" } },
      content: { type: "column", params: { gap: "1.5rem" } },
      features: { type: "grid", params: { columns: 3, gap: "1.5rem" } },
      gallery: { type: "grid", params: { columns: 3, gap: "1.5rem" } },
      testimonials: { type: "grid", params: { columns: 3, gap: "1.5rem" } },
      pricing: { type: "grid", params: { columns: 3, gap: "1.5rem" } },
      faq: { type: "column", params: { gap: "1.5rem" } },
      cta: { type: "column", params: { align: "center", gap: "1.5rem" } },
      products: { type: "grid", params: { columns: 3, gap: "1.5rem" } },
      footer: { type: "grid", params: { columns: 4, gap: "1.5rem" } },
    },
  },
  {
    id: "law-firm-corporate",
    label: "Law Firm Corporate",
    visualPreset: "default",
    containerWidth: "contained",
    sections: {
      header: { type: "row", params: { gap: "1.5rem", justify: "space-between", align: "center" } },
      hero: { type: "row", params: { justify: "space-between", gap: "2.5rem", align: "center" } },
      content: { type: "column", params: { gap: "2rem" } },
      features: { type: "grid", params: { columns: 3, gap: "2rem" } },
      gallery: { type: "grid", params: { columns: 3, gap: "1.5rem" } },
      testimonials: { type: "grid", params: { columns: 2, gap: "2rem" } },
      pricing: { type: "grid", params: { columns: 3, gap: "2rem" } },
      faq: { type: "column", params: { gap: "1.5rem" } },
      cta: { type: "column", params: { align: "center", gap: "1.5rem" } },
      products: { type: "grid", params: { columns: 3, gap: "2rem" } },
      footer: { type: "grid", params: { columns: 4, gap: "2rem" } },
    },
  },
  {
    id: "wedding-events",
    label: "Wedding & Events",
    visualPreset: "spacious",
    containerWidth: "contained",
    sections: {
      header: { type: "row", params: { gap: "1.5rem", justify: "space-between", align: "center" } },
      hero: { type: "column", params: { align: "center", gap: "3rem" } },
      content: { type: "column", params: { gap: "2.5rem" } },
      features: { type: "grid", params: { columns: 2, gap: "2.5rem" } },
      gallery: { type: "grid", params: { columns: 3, gap: "2rem" } },
      testimonials: { type: "column", params: { gap: "2.5rem" } },
      pricing: { type: "grid", params: { columns: 2, gap: "2.5rem" } },
      faq: { type: "column", params: { gap: "2rem" } },
      cta: { type: "column", params: { align: "center", gap: "2.5rem" } },
      products: { type: "grid", params: { columns: 2, gap: "2.5rem" } },
      footer: { type: "grid", params: { columns: 3, gap: "2.5rem" } },
    },
  },
];

export function getTemplateProfile(id: string): TemplateProfile | null {
  return TEMPLATES.find((t) => t.id === id) ?? null;
}

export function getTemplateList(): { id: string; label: string }[] {
  return TEMPLATES.map((t) => ({ id: t.id, label: t.label }));
}

/**
 * Phase 12: Template compatibility validation
 * Validates that a screen has sections matching template's expected roles
 */
export function validateTemplateCompatibility(
  templateId: string,
  screenRoles: string[]
): { compatible: boolean; missing: string[]; warnings: string[] } {
  const template = getTemplateProfile(templateId);
  
  if (!template) {
    return {
      compatible: false,
      missing: [],
      warnings: [`Template "${templateId}" not found`],
    };
  }

  const templateRoles = Object.keys(template.sections);
  const screenRoleSet = new Set(screenRoles);
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check for critical roles
  const criticalRoles = ["header", "footer"];
  for (const role of criticalRoles) {
    if (templateRoles.includes(role) && !screenRoleSet.has(role)) {
      missing.push(role);
    }
  }

  // Warn about optional roles
  const optionalRoles = ["hero", "features", "pricing", "testimonials", "gallery", "faq", "cta"];
  for (const role of optionalRoles) {
    if (templateRoles.includes(role) && !screenRoleSet.has(role)) {
      warnings.push(`Template expects "${role}" but screen does not have it`);
    }
  }

  return {
    compatible: missing.length === 0,
    missing,
    warnings,
  };
}
