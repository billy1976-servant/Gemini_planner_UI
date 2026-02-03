/**
 * Section layout preset registry.
 * Maps preset IDs to composition-level params (containerWidth, moleculeLayout, split).
 * Uses existing tokens (var(--container-*), var(--spacing-*)); no new molecules.
 * Phase 1: Loads from section-presets.json when available; TS object as fallback.
 */

import { getOrganLabel } from "@/organs/organ-registry";
import sectionPresetsJson from "./section-presets.json";

export type SectionPresetDef = {
  containerWidth?: "contained" | "edge-to-edge" | "narrow" | "wide" | "full" | "split" | string;
  /** Split layout: partition children into media slot + content; column order from mediaSlot. */
  split?: { type: "split"; mediaSlot?: "left" | "right" };
  backgroundVariant?: "default" | "hero-accent" | "alt" | "dark";
  moleculeLayout?: {
    type: "column" | "row" | "grid" | "stacked";
    preset?: string | null;
    params?: Record<string, any>;
  };
};

/** Temporary extreme values for visual verification — layout differences obvious. */
const VISUAL_TEST_EXTREME = true;

const SECTION_LAYOUT_PRESETS: Record<string, SectionPresetDef> = {
  "hero-centered": {
    containerWidth: VISUAL_TEST_EXTREME ? "var(--container-narrow)" : "wide",
    moleculeLayout: {
      type: "column",
      preset: null,
      params: {
        gap: "var(--spacing-8)",
        align: "center",
        justify: "center",
        padding: "var(--spacing-12) var(--spacing-6)",
      },
    },
  },
  "hero-split-image-right": {
    containerWidth: "full",
    split: { type: "split", mediaSlot: "right" },
    moleculeLayout: {
      type: "row",
      preset: null,
      params: {
        gap: "var(--spacing-12)",
        align: "center",
        justify: "space-between",
        padding: "var(--spacing-20) var(--spacing-8)",
        minHeight: "min(60vh, 560px)",
      },
    },
  },
  "hero-split-image-left": {
    containerWidth: "full",
    split: { type: "split", mediaSlot: "left" },
    moleculeLayout: {
      type: "row",
      preset: null,
      params: {
        gap: "var(--spacing-12)",
        align: "center",
        justify: "space-between",
        padding: "var(--spacing-20) var(--spacing-8)",
        minHeight: "min(60vh, 560px)",
      },
    },
  },
  "hero-full-bleed-image": {
    containerWidth: VISUAL_TEST_EXTREME ? "100vw" : "full",
    backgroundVariant: "default",
    moleculeLayout: {
      type: "column",
      preset: null,
      params: {
        gap: "var(--spacing-6)",
        align: "center",
        justify: "center",
        padding: "var(--spacing-16) var(--spacing-6)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    },
  },
  "content-narrow": {
    containerWidth: VISUAL_TEST_EXTREME ? "600px" : "narrow",
    moleculeLayout: {
      type: "column",
      preset: null,
      params: {
        gap: "var(--spacing-6)",
        align: "stretch",
        padding: "var(--spacing-8) 0",
      },
    },
  },
  "image-left-text-right": {
    containerWidth: "contained",
    moleculeLayout: {
      type: "row",
      preset: null,
      params: {
        gap: "var(--spacing-8)",
        align: "center",
        justify: "flex-start",
        padding: "var(--spacing-8) 0",
      },
    },
  },
  "feature-grid-3": {
    containerWidth: "contained",
    moleculeLayout: {
      type: "grid",
      preset: null,
      params: {
        columns: 3,
        gridTemplateColumns: VISUAL_TEST_EXTREME ? "repeat(3, 1fr)" : undefined,
        gap: "var(--spacing-6)",
        padding: "var(--spacing-8) 0",
      },
    },
  },
  "testimonial-band": {
    containerWidth: "contained",
    moleculeLayout: {
      type: "row",
      preset: null,
      params: {
        gap: "var(--spacing-8)",
        align: "stretch",
        justify: "center",
        padding: "var(--spacing-10) var(--spacing-6)",
      },
    },
  },
  "cta-centered": {
    containerWidth: "contained",
    moleculeLayout: {
      type: "column",
      preset: null,
      params: {
        gap: "var(--spacing-6)",
        align: "center",
        justify: "center",
        padding: "var(--spacing-10) var(--spacing-6)",
      },
    },
  },
};

const HERO_PRESET_IDS = ["hero-centered", "hero-split-image-right", "hero-split-image-left", "hero-full-bleed-image"];
const CONTENT_PRESET_IDS = ["content-narrow", "image-left-text-right", "testimonial-band", "cta-centered"];
const GRID_PRESET_IDS = ["feature-grid-3"];

/**
 * Returns the preset definition for a given preset ID, or null.
 * JSON presets (section-presets.json) take precedence; TS fallback for missing or legacy.
 */
export function getSectionLayoutPreset(presetId: string): SectionPresetDef | null {
  if (!presetId || typeof presetId !== "string") return null;
  const id = presetId.trim().toLowerCase();
  const fromJson = (sectionPresetsJson as Record<string, SectionPresetDef>)[id];
  if (fromJson && typeof fromJson === "object") return fromJson;
  return SECTION_LAYOUT_PRESETS[id] ?? null;
}

/**
 * All preset IDs (for dropdowns).
 */
export function getAllSectionPresetIds(): string[] {
  return Object.keys(SECTION_LAYOUT_PRESETS);
}

/** Roles that typically use grid layouts. */
const GRID_ROLES = new Set(["features", "features-grid", "gallery", "testimonials", "pricing"]);

/**
 * Deterministic: which presets apply to this section based on JSON tree only.
 * - role === "hero" → hero presets only
 * - section has media (content.media, media, or child Card with media) → include split/image presets
 * - section role in GRID_ROLES or children include multiple Cards / Grid → include grid presets
 * - else → content/cta/testimonial presets
 */
export function getEligiblePresetIds(sectionNode: any): string[] {
  if (!sectionNode || typeof sectionNode !== "object") return [...CONTENT_PRESET_IDS];

  const role = (sectionNode.role ?? "").toString().toLowerCase().trim();

  if (role === "hero") {
    return [...HERO_PRESET_IDS];
  }

  const children = Array.isArray(sectionNode.children) ? sectionNode.children : [];
  const hasMedia =
    (sectionNode.content && (sectionNode.content.media != null || (sectionNode as any).media != null)) ||
    children.some((c: any) => {
      const t = (c?.type ?? "").toString().toLowerCase();
      return t === "card" && (c?.content?.media != null);
    });
  const cardCount = children.filter((c: any) => (c?.type ?? "").toString().toLowerCase() === "card").length;
  const hasGridOfCards =
    children.some((c: any) => (c?.type ?? "").toString().toLowerCase() === "grid") ||
    cardCount >= 2;
  const isGridRole = GRID_ROLES.has(role);

  const ids = new Set<string>(CONTENT_PRESET_IDS);

  if (hasMedia) {
    HERO_PRESET_IDS.forEach((id) => ids.add(id));
  }
  if (hasGridOfCards || isGridRole) {
    GRID_PRESET_IDS.forEach((id) => ids.add(id));
  }

  return Array.from(ids);
}

/**
 * Collect every section instance from top-level nodes (no dedupe).
 * Section key = node.id. One row per section so multiple galleries get multiple rows.
 */
export function collectSectionKeysAndNodes(nodes: any[]): { sectionKeys: string[]; sectionByKey: Record<string, any> } {
  const sectionKeys: string[] = [];
  const sectionByKey: Record<string, any> = {};
  if (!Array.isArray(nodes)) return { sectionKeys, sectionByKey };
  for (const node of nodes) {
    const type = (node?.type ?? "").toString().toLowerCase();
    if (type !== "section") continue;
    const key = (node.id ?? node.role) ?? "";
    if (!key) continue;
    sectionKeys.push(key);
    sectionByKey[key] = node;
  }
  return { sectionKeys, sectionByKey };
}

/**
 * Human-readable labels per section instance (e.g. "Gallery 1", "Gallery 2", "Hero").
 */
export function collectSectionLabels(
  sectionKeys: string[],
  sectionByKey: Record<string, any>
): Record<string, string> {
  const labels: Record<string, string> = {};
  const roleCount: Record<string, number> = {};
  const roleToOrganId: Record<string, string> = { features: "features-grid", content: "content-section" };
  for (const key of sectionKeys) {
    const node = sectionByKey[key];
    const role = (node?.role ?? "section").toString().trim() || "section";
    const count = (roleCount[role] ?? 0) + 1;
    roleCount[role] = count;
    const organId = roleToOrganId[role] ?? role;
    const baseLabel = getOrganLabel(organId);
    const label = count === 1 ? baseLabel : `${baseLabel} ${count}`;
    labels[key] = label;
  }
  return labels;
}

export { SECTION_LAYOUT_PRESETS };
