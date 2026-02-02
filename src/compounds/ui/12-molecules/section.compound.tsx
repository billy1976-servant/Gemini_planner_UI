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
import SurfaceAtom from "@/components/9-atoms/primitives/surface";
import TextAtom from "@/components/9-atoms/primitives/text";
import SequenceAtom from "@/components/9-atoms/primitives/sequence";
import CollectionAtom from "@/components/9-atoms/primitives/collection";
import { resolveParams } from "@/engine/core/palette-resolver";
import { resolveMoleculeLayout } from "@/layout/molecule-layout-resolver";


function resolveWithDefaultLayout(
  flow?: string,
  preset?: string | null,
  params?: Record<string, any>,
  defaultFlow: "row" | "column" | "grid" = "column"
) {
  return resolveMoleculeLayout(
    flow ?? defaultFlow,
    preset ?? null,
    params
  );
}

/** True when child is a Card (or similar) with content.media — used for hero-split "image right" column. */
function isMediaChild(child: React.ReactNode): child is React.ReactElement {
  return (
    React.isValidElement(child) &&
    typeof (child.props as { content?: { media?: unknown } })?.content?.media !== "undefined" &&
    (child.props as { content?: { media?: unknown } }).content?.media != null
  );
}

/** Partition children into text group and single media child for hero-split layout. */
function partitionChildrenForHeroSplit(children: React.ReactNode): {
  textChildren: React.ReactNode[];
  mediaChild: React.ReactElement | null;
} {
  const arr = React.Children.toArray(children);
  const textChildren: React.ReactNode[] = [];
  let mediaChild: React.ReactElement | null = null;
  for (const child of arr) {
    if (mediaChild === null && isMediaChild(child)) {
      mediaChild = child as React.ReactElement;
    } else {
      textChildren.push(child);
    }
  }
  return { textChildren, mediaChild };
}


/* ======================================================
   3) PROPS CONTRACT
   ====================================================== */
export type SectionCompoundProps = {
  id?: string;
  params?: {
    surface?: any;
    title?: any;
    /** Definition/preset layout (gap, padding) — merged with moleculeLayout.params for inner layout */
    layout?: { gap?: any; padding?: any; [k: string]: any };
    /** Template-driven: contained, edge-to-edge, narrow, wide, full, split (50/50) */
    containerWidth?: "contained" | "edge-to-edge" | "narrow" | "wide" | "full" | "split";
    /** Template-driven: hero section mode (full-screen, overlay, strip) */
    heroMode?: "centered" | "split" | "full-screen" | "overlay" | "strip";
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
  params = {},
  content = {},
  children,
}: SectionCompoundProps) {
  // Trace: log final params received when layoutPreset changes (for layout-preset audit).
  if (typeof window !== "undefined") {
    const key = `section-params:${id ?? "anon"}`;
    (globalThis as any).__SECTION_PARAMS_LAST__ = (globalThis as any).__SECTION_PARAMS_LAST__ ?? {};
    const last = (globalThis as any).__SECTION_PARAMS_LAST__[key];
    const snapshot = {
      containerWidth: params?.containerWidth,
      heroMode: params?.heroMode,
      moleculeLayout: params?.moleculeLayout,
      layout: params?.layout,
      backgroundVariant: params?.backgroundVariant,
      alignment: (params?.moleculeLayout?.params as any)?.align,
      spacing: (params?.moleculeLayout?.params as any)?.gap ?? (params?.layout as any)?.gap,
    };
    if (!last || JSON.stringify(last) !== JSON.stringify(snapshot)) {
      console.log("[SectionCompound] final params", { id, params: snapshot, fullParams: params });
      (globalThis as any).__SECTION_PARAMS_LAST__[key] = snapshot;
    }
  }

  const {
    containerWidth,
    heroMode,
    moleculeLayout,
  } = params || {};
  const effectiveContainerWidth = containerWidth ?? "contained";

  const isSplitLayout =
    containerWidth === "split" ||
    moleculeLayout?.type === "row";

  const isGridLayout =
    moleculeLayout?.type === "grid";
  const gridColumns = (moleculeLayout?.params as { columns?: number } | undefined)?.columns ?? 3;
  const gridGap = (moleculeLayout?.params as { gap?: string } | undefined)?.gap ?? "var(--spacing-4)";

  const isFullBleedHero =
    heroMode === "full-screen";

  /* ======================================================
     INTERNAL SLOT CONTENT (PURE)
     ====================================================== */
  const slotContent = (
    <>
      {content.title && (
        <TextAtom params={resolveParams(params.title)}>
          {content.title}
        </TextAtom>
      )}
    </>
  );


  /* ======================================================
     APPLY MOLECULE LAYOUT — reads ONLY params.moleculeLayout.
     When moleculeLayout exists we never re-derive layout from role.
     ====================================================== */
  const layoutParams = {
    ...(params.layout ?? {}),
    ...(moleculeLayout?.params ?? {}),
  };
  const layout = resolveWithDefaultLayout(
    moleculeLayout?.type,
    moleculeLayout?.preset ?? null,
    layoutParams,
    "column" // ← default for Section
  );


  let laidOutSlots: React.ReactNode = slotContent;


  if (layout.flow === "grid") {
    laidOutSlots = (
      <CollectionAtom params={layout}>
        {slotContent}
      </CollectionAtom>
    );
  } else if (layout.direction) {
    laidOutSlots = (
      <SequenceAtom params={layout}>
        {slotContent}
      </SequenceAtom>
    );
  }


  /* ======================================================
     Surface params: merge backgroundVariant for template-driven section backgrounds
     ====================================================== */
  const surfaceParams = resolveParams(params.surface);
  const variant = params?.backgroundVariant;
  const surfaceWithVariant =
    variant === "hero-accent"
      ? { ...surfaceParams, background: "var(--color-surface-hero-accent)" }
      : variant === "alt"
      ? { ...surfaceParams, background: "var(--color-surface-alt)" }
      : variant === "dark"
      ? { ...surfaceParams, background: "var(--color-surface-dark)", color: "var(--color-on-surface-dark)" }
      : surfaceParams;

  /* Hero-split: partition children into text (left) and single Card with media (right). */
  const isHeroSplit = heroMode === "split" && isSplitLayout;
  const { textChildren, mediaChild } = isHeroSplit
    ? partitionChildrenForHeroSplit(children)
    : { textChildren: [] as React.ReactNode[], mediaChild: null as React.ReactElement | null };

  const innerContent = (
    <div
      style={{
        display: isSplitLayout ? "grid" : "block",
        gridTemplateColumns: isSplitLayout ? "1fr 1fr" : undefined,
        gap: "var(--spacing-6)",
        alignItems: "center",
      }}
    >
      {isSplitLayout ? (
        isHeroSplit && mediaChild != null ? (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--spacing-4)",
                alignItems: "flex-start",
              }}
            >
              {slotContent}
              {textChildren}
            </div>
            <div>{mediaChild}</div>
          </>
        ) : (
          <>
            <div>{slotContent}</div>
            <div
              style={{
                display: isGridLayout ? "grid" : "block",
                gridTemplateColumns: isGridLayout ? `repeat(${gridColumns}, 1fr)` : undefined,
                gap: isGridLayout ? gridGap : undefined,
              }}
            >
              {children}
            </div>
          </>
        )
      ) : (
        <>
          {slotContent}
          <div
            style={{
              display: isGridLayout ? "grid" : "block",
              gridTemplateColumns: isGridLayout ? `repeat(${gridColumns}, 1fr)` : undefined,
              gap: isGridLayout ? gridGap : undefined,
            }}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );

  const surfaceContent = (
    <SurfaceAtom params={surfaceWithVariant}>
      {innerContent}
    </SurfaceAtom>
  );

  /* ======================================================
     Hero mode wrapper (full-screen, overlay, strip)
     ====================================================== */
  const heroWrapperStyle: React.CSSProperties =
    heroMode === "full-screen"
      ? { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }
      : heroMode === "strip"
      ? { paddingTop: "var(--spacing-4)", paddingBottom: "var(--spacing-4)" }
      : heroMode === "overlay"
      ? { position: "relative", minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }
      : undefined;

  const maybeHeroWrapped = heroWrapperStyle ? (
    <div style={heroWrapperStyle}>{surfaceContent}</div>
  ) : (
    surfaceContent
  );

  /* ======================================================
     Container width — reads ONLY params.containerWidth (no role fallback).
     Supports enum, CSS var() (e.g. "var(--container-narrow)"), or length (e.g. "100vw", "600px").
     ====================================================== */
  const knownWidth =
    effectiveContainerWidth === "contained" ? "var(--container-content)" :
    effectiveContainerWidth === "narrow" ? "var(--container-narrow)" :
    effectiveContainerWidth === "wide" ? "var(--container-wide)" :
    effectiveContainerWidth === "full" ? "var(--container-full)" :
    effectiveContainerWidth === "split" ? "var(--container-wide)" :
    effectiveContainerWidth === "edge-to-edge" ? null : null;
  const isCssVar = typeof effectiveContainerWidth === "string" && /^var\s*\([^)]+\)$/.test(effectiveContainerWidth.trim());
  const isLength = typeof effectiveContainerWidth === "string" && /^\d+(\.\d+)?(px|rem|vw|%)$/.test(effectiveContainerWidth.trim());
  const containerVar =
    knownWidth ??
    (isCssVar || isLength ? (effectiveContainerWidth as string).trim() : "var(--container-content)");
  const outerSectionStyle: React.CSSProperties = {
    ...(effectiveContainerWidth !== "edge-to-edge"
      ? { width: "100%", maxWidth: containerVar, marginLeft: "auto", marginRight: "auto" }
      : {}),
    ...(isFullBleedHero ? { backgroundSize: "cover", backgroundPosition: "center" } : {}),
  };

  if (effectiveContainerWidth === "edge-to-edge") {
    return (
      <div data-section-id={id} style={Object.keys(outerSectionStyle).length > 0 ? outerSectionStyle : undefined}>
        {maybeHeroWrapped}
      </div>
    );
  }
  return (
    <div data-section-id={id} style={outerSectionStyle}>
      {maybeHeroWrapped}
    </div>
  );
}

