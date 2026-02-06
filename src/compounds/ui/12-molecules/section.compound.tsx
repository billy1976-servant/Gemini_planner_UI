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
import { loadOrganVariant } from "@/organs";

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
}: SectionCompoundProps) {
  if (typeof window !== "undefined") {
    const sectionKey = id ?? role ?? "";
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
  // Section layout: section placement (container, split, background).
  const layoutDef = resolveLayout(layout);
  // Organ internal layout: when this section is an organ, inner arrangement from organ layout resolver + variant JSON; does not use section layout for inner moleculeLayout.
  const organIds = getOrganLayoutOrganIds();
  const isOrgan = role != null && organIds.includes(role);
  const effectiveDef =
    layoutDef != null && isOrgan
      ? (() => {
          const internalLayoutId = resolveInternalLayoutId(role, params.internalLayoutId);
          const variantRoot = loadOrganVariant(role, internalLayoutId ?? "default");
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

