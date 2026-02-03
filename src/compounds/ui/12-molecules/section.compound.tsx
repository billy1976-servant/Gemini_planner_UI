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
import { resolveLayout } from "@/layout-2";
import { LayoutMoleculeRenderer } from "@/layout-2";

/* ======================================================
   3) PROPS CONTRACT
   ====================================================== */
export type SectionCompoundProps = {
  id?: string;
  /** Section role from JSON (e.g. hero, features). Used for hero-only layout branch. */
  role?: string;
  /** layout-2: layout id or { template, slot }. When resolved, Section uses LayoutMoleculeRenderer (parallel path). */
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
  // layout-2 only: resolve layout id (or fallback) and render via LayoutMoleculeRenderer.
  const layoutDef = resolveLayout(layout);
  const fallbackDef = resolveLayout("content-narrow");
  const effectiveDef = layoutDef ?? fallbackDef;
  if (effectiveDef) {
    return (
      <LayoutMoleculeRenderer layout={effectiveDef} id={id} role={role} params={params} content={content}>
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

