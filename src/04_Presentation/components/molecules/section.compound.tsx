"use client";
import React from "react";
/* ======================================================
   1) ROLE / CONTRACT (NON-INTERACTIVE)
   ====================================================== */
/**
 * SectionCompound
 *
 * Purpose:
 * - Structural + visual grouping container
 * - NOT interactive (no Trigger, no behavior, no onTap)
 * - Organizes content blocks within the tree
 *
 * This is intentionally different from Button or Card.
 */
/* ======================================================
   2) ATOM IMPORTS (UI ONLY)
   ====================================================== */
import { resolveLayout, LayoutMoleculeRenderer, type LayoutDefinition } from "@/layout";
import { getOrganLayoutOrganIds, resolveInternalLayoutId } from "@/layout-organ";
import { loadOrganVariant } from "@/components/organs";

// STRICT JSON MODE: If true, NO fallback values allowed. Renderer must obey JSON 100%.
const STRICT_JSON_MODE = true;

function warnDefault(fallbackName: string, value: any, source: string) {
  if (STRICT_JSON_MODE) {
    console.warn(`[STRICT_JSON_MODE] DEFAULT DETECTED: renderer used fallback value "${fallbackName}" = ${JSON.stringify(value)} (source: ${source})`);
  }
}

/* ======================================================
   3) PROPS CONTRACT
   ====================================================== */
export type SectionCompoundProps = {
  id?: string;
  /** Section role from JSON (e.g. hero, features). Used for hero-only layout branch. */
  role?: string;
  /** Section layout: layout id or { template, slot }. When resolved, Section uses LayoutMoleculeRenderer. */
  layout?: string | { template: string; slot: string };
  /** Effective layout preset ID applied by engine (e.g. hero-full-bleed-image). Used for full-bleed detection. */
  _effectiveLayoutPreset?: string | null;
  /** Template id for context-based layout resolution (template role mapping). */
  templateId?: string;
  params?: {
    surface?: any;
    title?: any;
    /** Definition/preset layout (gap, padding) — merged with moleculeLayout.params for inner layout */
    layout?: { gap?: any; padding?: any; [k: string]: any };
    /** Template-driven: contained, edge-to-edge, narrow, wide, full, split (50/50) */
    containerWidth?: "contained" | "edge-to-edge" | "narrow" | "wide" | "full" | "split";
    /** Split layout: partition children into media slot + content; column order from mediaSlot. Driven by layout presets. */
    split?: { type: "split"; mediaSlot?: "left" | "right" };
    /** Template-driven: section background variant (hero-accent, alt, dark) */
    backgroundVariant?: "default" | "hero-accent" | "alt" | "dark";
    moleculeLayout?: {
      type: string;
      preset?: string;
      params?: Record<string, any>;
    };
    /** Set by organ expansion; used by organ layout resolver for internal arrangement only. */
    internalLayoutId?: string;
  };
  content?: {
    title?: string;
  };
  children?: React.ReactNode;
};


/* ======================================================
   3a) SLOT DECLARATION (ENGINE-VISIBLE)
   ====================================================== */
(SectionCompound as any).slots = {
  title: "title",
};


/* ======================================================
   4) MOLECULE IMPLEMENTATION
   ====================================================== */
export default function SectionCompound({
  id,
  role,
  layout,
  params = {},
  content = {},
  children,
  templateId,
}: SectionCompoundProps) {
  if (typeof window !== "undefined") {
    const sectionKey = id ?? role ?? "";
    // LAYOUT INVESTIGATION: Enhanced logging for layout prop source
    if (process.env.NODE_ENV === "development") {
      console.log("[LAYOUT INVESTIGATION] SectionCompound received layout prop", {
        sectionKey,
        sectionId: id ?? "(none)",
        sectionRole: role ?? "(none)",
        layoutPropReceived: layout ?? "(undefined)",
        layoutType: typeof layout,
        isString: typeof layout === "string",
        isEmpty: typeof layout === "string" && layout.trim() === "",
      });
    }
    console.log("[LAYOUT TRACE] Section received layout prop", {
      sectionKey,
      layoutPropReceived: layout,
    });
    (window as any).__LAYOUT_TRACE__ = (window as any).__LAYOUT_TRACE__ || [];
    (window as any).__LAYOUT_TRACE__.push({
      stage: "section-prop",
      sectionKey,
      layoutPropReceived: layout,
      ts: Date.now(),
    });
  }
  
  // LAYOUT CONTRACT CHECK: Verify layout resolution inputs
  console.log("LAYOUT CONTRACT CHECK", {
    section: id,
    role,
    layoutProp: layout,
    templateId
  });
  
  // Section layout: section placement (container, split, background).
  // Pass context for template role-based resolution when layout is undefined
  const layoutDef = resolveLayout(layout, {
    templateId: templateId,
    sectionRole: role
  });
  
  // LAYOUT INVESTIGATION: Log resolution result
  if (process.env.NODE_ENV === "development") {
    const sectionKey = id ?? role ?? "";
    console.log("[LAYOUT INVESTIGATION] SectionCompound layout resolution", {
      sectionKey,
      layoutInput: layout ?? "(undefined)",
      layoutDefResolved: layoutDef ? "YES" : "NO (null)",
      willRenderLayoutMolecule: !!layoutDef,
      fallbackToDiv: !layoutDef,
    });
  }
  // Organ internal layout: when this section is an organ, inner arrangement from organ layout resolver + variant JSON; does not use section layout for inner moleculeLayout.
  const organIds = getOrganLayoutOrganIds();
  const isOrgan = role != null && organIds.includes(role);
  const effectiveDef =
    layoutDef != null && isOrgan
      ? (() => {
          const internalLayoutId = resolveInternalLayoutId(role, params.internalLayoutId);
          // TEMP SAFE MODE: Log fallback hits but do NOT assign default internal layout
          if (!internalLayoutId) {
            console.warn("[FALLBACK HIT]", {
              sectionKey: id ?? role ?? "",
              requestedLayout: params.internalLayoutId ?? "(none)",
              templateDefault: "(none)",
              override: "(none)",
              source: "internalLayoutId default",
            });
          }
          // Do NOT assign fallback - pass undefined to expose missing JSON
          const variantRoot = loadOrganVariant(role, internalLayoutId ?? undefined);
          const variantParams =
            variantRoot != null && typeof variantRoot === "object" && "params" in variantRoot
              ? (variantRoot as { params?: { moleculeLayout?: unknown } }).params
              : undefined;
          const organMoleculeLayout = variantParams?.moleculeLayout;
          return {
            ...layoutDef,
            moleculeLayout: organMoleculeLayout ?? layoutDef.moleculeLayout,
          };
        })()
      : layoutDef;
  if (effectiveDef) {
    const layoutPresetId = typeof layout === "string" && layout.trim() ? layout.trim() : null;
    const sectionKey = id ?? role ?? "";
    console.log("SECTION → LAYOUT PIPE", {
      sectionKey,
      layoutPropReceived: layout,
      childCount: React.Children.count(children),
    });
    return (
      <LayoutMoleculeRenderer
        layout={effectiveDef as LayoutDefinition}
        layoutPresetId={layoutPresetId}
        id={id}
        role={role}
        params={params}
        content={content}
      >
        {children}
      </LayoutMoleculeRenderer>
    );
  }
  return (
    <div data-section-id={id}>
      {children}
    </div>
  );
}

