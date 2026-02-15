/**
 * Template-Driven Layout Layer
 * Overrides profile.sections and profile.visualPreset for JSON screens.
 * Does NOT touch palette, behavior, state, or screen JSON.
 */

import templateRolesData from "./template-roles.json";

const TEMPLATE_CRITICAL_ROLES: readonly string[] = (
  templateRolesData as { criticalRoles: string[] }
).criticalRoles;
const TEMPLATE_OPTIONAL_ROLES: readonly string[] = (
  templateRolesData as { optionalRoles: string[] }
).optionalRoles;

export type LayoutDef = {
  type: "row" | "column" | "grid" | "stack";
  /** Section vertical spacing is engine-only; gap/padding here are stripped for sections and do not reach DOM. */
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

export type ExperienceType = "website" | "journal" | "app" | "learning" | "dashboard";

export type LayoutVariant = {
  layoutId: string;
  containerWidth?: ContainerWidth;
  /** Section vertical spacing is engine-only; params.gap and params.layout.gap are stripped for sections. */
  params?: Record<string, unknown>;
};

export type TemplateProfile = {
  id: string;
  label: string;
  /** Experience type: filters templates by use case (website, journal, app, learning, dashboard) */
  experience?: ExperienceType;
  visualPreset: string;
  /** Section role → layout (type + params). Template overrides organ defaults at render time. */
  sections: Record<string, LayoutDef>;
  /** Layout variants: per-role layout overrides with params (Option D approach) */
  layoutVariants?: Record<string, LayoutVariant>;
  /** Default layout id for sections when no override and no explicit node.layout. Layout-only; not keyed by role. */
  defaultSectionLayoutId?: string;
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
  /** Optional capability overrides (Level C). Domain → level; only listed keys override global. */
  capabilities?: Partial<Record<string, string>>;
};

import templatesData from "./template-profiles.json";

const TEMPLATES: TemplateProfile[] = templatesData as TemplateProfile[];

export function getTemplateProfile(id: string): TemplateProfile | null {
  return TEMPLATES.find((t) => t.id === id) ?? null;
}

/**
 * Get list of templates, optionally filtered by experience type.
 * @param experience - Filter by experience type (website, journal, app, learning, dashboard)
 * @returns Array of template id and label objects
 */
export function getTemplateList(experience?: ExperienceType): { id: string; label: string }[] {
  let templates = TEMPLATES;
  
  // Filter by experience if specified
  if (experience) {
    templates = templates.filter((t) => 
      t.experience === experience || 
      // If template has no experience tag, include it for backward compatibility
      !t.experience
    );
  }
  
  return templates.map((t) => ({ id: t.id, label: t.label }));
}

/**
 * Get all templates for a specific experience type only (no fallback).
 * @param experience - Experience type to filter by
 * @returns Array of template id and label objects
 */
export function getTemplateListStrict(experience: ExperienceType): { id: string; label: string }[] {
  return TEMPLATES
    .filter((t) => t.experience === experience)
    .map((t) => ({ id: t.id, label: t.label }));
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

  // Check for critical roles (from template-roles.json)
  for (const role of TEMPLATE_CRITICAL_ROLES) {
    if (templateRoles.includes(role) && !screenRoleSet.has(role)) {
      missing.push(role);
    }
  }

  // Warn about optional roles (from template-roles.json)
  for (const role of TEMPLATE_OPTIONAL_ROLES) {
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
