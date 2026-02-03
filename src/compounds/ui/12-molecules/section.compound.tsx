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

/** True when child is a Card (or similar) with content.media — used for split layout media slot. Supports wrapped children (e.g. MaybeDebugWrapper) via child.props.node?.content?.media. */
function isMediaChild(child: React.ReactNode): child is React.ReactElement {
  if (!React.isValidElement(child)) return false;
  const p: any = child.props;
  return p.content?.media != null || p.node?.content?.media != null;
}

/** Partition children into content group and single media child for split layout (params.split). */
function partitionChildrenForSplit(children: React.ReactNode): {
  contentChildren: React.ReactNode[];
  mediaChild: React.ReactElement | null;
} {
  const arr = React.Children.toArray(children);
  const contentChildren: React.ReactNode[] = [];
  let mediaChild: React.ReactElement | null = null;
  for (const child of arr) {
    if (mediaChild === null && isMediaChild(child)) {
      mediaChild = child as React.ReactElement;
    } else {
      contentChildren.push(child);
    }
  }
  return { contentChildren, mediaChild };
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
      split: params?.split,
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
    // Hero section: console tracking for preset → layout (hasSplit / isRow = split layout active).
    if (typeof id === "string" && id.toLowerCase().includes("hero")) {
      const hasSplit = params?.split != null && params?.split?.type === "split";
      const isRow = params?.moleculeLayout?.type === "row";
      console.log("[SectionCompound] HERO section params (preset → layout)", {
        id,
        hasSplit,
        isRow,
        split: params?.split,
        moleculeLayoutType: params?.moleculeLayout?.type,
      });
    }
  }

  const {
    containerWidth,
    split: splitConfig,
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

  /** When split config is present, partition children into media slot + content and order by mediaSlot. */
  const useSplitPartition = splitConfig?.type === "split" && isSplitLayout;
  const mediaSlot = splitConfig?.mediaSlot ?? "right";
  const { contentChildren, mediaChild } = useSplitPartition
    ? partitionChildrenForSplit(children)
    : { contentChildren: [] as React.ReactNode[], mediaChild: null as React.ReactElement | null };

  if (useSplitPartition && typeof window !== "undefined") {
    const arr = React.Children.toArray(children);
    const childTypes = arr.map((child) => ({
      type: React.isValidElement(child)
        ? (child.type as any)?.displayName ?? (child.type as any)?.name ?? String(child.type)
        : "unknown",
      hasContentMedia: isMediaChild(child),
    }));
    console.log("[SectionCompound SPLIT DEBUG]", {
      id,
      childTypes,
      mediaChildFound: mediaChild != null,
      textCount: contentChildren.length,
    });
  }

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

  const isHeroSplit = useSplitPartition && mediaChild != null;
  const contentColumn = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-4)",
        alignItems: "flex-start",
        ...(isHeroSplit ? { maxWidth: "min(100%, 42rem)", minWidth: 0 } : {}),
      }}
    >
      {slotContent}
      {contentChildren}
    </div>
  );
  /** Inject heroMediaFill so hero split media renders full-bleed (no card surface, 100% width/height, object-fit: cover). */
  const injectHeroMediaFill = (node: React.ReactNode): React.ReactNode => {
    if (!React.isValidElement(node)) return node;
    const p = (node.props as any)?.params;
    if (p != null)
      return React.cloneElement(node, { params: { ...p, heroMediaFill: true } } as any);
    const children = (node.props as any)?.children;
    if (children != null) {
      const injected = React.Children.map(children, injectHeroMediaFill);
      if (injected.some((c, i) => c !== React.Children.toArray(children)[i]))
        return React.cloneElement(node, { children: injected } as any);
    }
    return node;
  };
  const heroMediaChild =
    isHeroSplit && mediaChild != null && React.isValidElement(mediaChild)
      ? React.cloneElement(mediaChild as React.ReactElement<{ children?: React.ReactNode }>, {
          children: React.Children.map(
            (mediaChild as React.ReactElement<{ children?: React.ReactNode }>).props.children,
            injectHeroMediaFill
          ),
        })
      : mediaChild;
  const mediaColumn =
    mediaChild != null ? (
      <div
        style={
          isHeroSplit
            ? {
                display: "flex",
                minHeight: 0,
                overflow: "hidden",
                alignItems: "stretch",
              }
            : undefined
        }
      >
        {heroMediaChild}
      </div>
    ) : null;

  const mlParamsForInner = moleculeLayout?.params as Record<string, unknown> | undefined;
  const innerContent = (
    <div
      style={{
        display: isSplitLayout ? "grid" : "block",
        gridTemplateColumns: isSplitLayout ? "1fr 1fr" : undefined,
        gap: (isSplitLayout && mlParamsForInner?.gap) != null ? (mlParamsForInner.gap as string) : "var(--spacing-6)",
        alignItems: "center",
        ...(isSplitLayout && mlParamsForInner?.padding != null ? { padding: mlParamsForInner.padding as string } : {}),
      }}
    >
      {isSplitLayout ? (
        useSplitPartition && mediaChild != null ? (
          (() => {
            const textColumn =
              effectiveContainerWidth === "full" ? (
                <div style={{ maxWidth: "720px", width: "100%", margin: "0 auto" }}>
                  {contentColumn}
                </div>
              ) : (
                contentColumn
              );
            return mediaSlot === "left" ? (
              <>
                {mediaColumn}
                {textColumn}
              </>
            ) : (
              <>
                {textColumn}
                {mediaColumn}
              </>
            );
          })()
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

  /* Layout wrapper: optional minHeight/display/align from moleculeLayout.params (e.g. full-bleed presets). */
  const mlParams = moleculeLayout?.params as Record<string, unknown> | undefined;
  const layoutWrapperStyle: React.CSSProperties | undefined =
    mlParams?.minHeight != null || mlParams?.display != null
      ? {
          ...(mlParams?.minHeight != null ? { minHeight: mlParams.minHeight as string } : {}),
          ...(mlParams?.display != null ? { display: mlParams.display as React.CSSProperties["display"] } : {}),
          ...(mlParams?.alignItems != null ? { alignItems: mlParams.alignItems as React.CSSProperties["alignItems"] } : {}),
          ...(mlParams?.justifyContent != null ? { justifyContent: mlParams.justifyContent as React.CSSProperties["justifyContent"] } : {}),
        }
      : undefined;

  const wrappedInner = layoutWrapperStyle ? (
    <div style={layoutWrapperStyle}>{innerContent}</div>
  ) : (
    innerContent
  );

  const surfaceContent = (
    <SurfaceAtom params={surfaceWithVariant}>
      {wrappedInner}
    </SurfaceAtom>
  );

  /* ======================================================
     Container width — reads ONLY params.containerWidth (no role fallback).
     Supports enum, CSS var() (e.g. "var(--container-narrow)"), or length (e.g. "100vw", "600px").
     When containerWidth === "full", use full-bleed breakout so section escapes page/shell max-width and padding.
     ====================================================== */
  const knownWidth =
    effectiveContainerWidth === "contained" ? "var(--container-content)" :
    effectiveContainerWidth === "narrow" ? "var(--container-narrow)" :
    effectiveContainerWidth === "wide" ? "var(--container-wide)" :
    effectiveContainerWidth === "split" ? "var(--container-wide)" :
    effectiveContainerWidth === "edge-to-edge" ? null : null;
  const isFullBleed = effectiveContainerWidth === "full";
  const isCssVar = typeof effectiveContainerWidth === "string" && /^var\s*\([^)]+\)$/.test(effectiveContainerWidth.trim());
  const isLength = typeof effectiveContainerWidth === "string" && /^\d+(\.\d+)?(px|rem|vw|%)$/.test(effectiveContainerWidth.trim());
  const containerVar =
    knownWidth ??
    (isCssVar || isLength ? (effectiveContainerWidth as string).trim() : "var(--container-content)");
  const outerSectionStyle: React.CSSProperties = isFullBleed
    ? {
        width: "100vw",
        maxWidth: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }
    : effectiveContainerWidth !== "edge-to-edge"
      ? { width: "100%", maxWidth: containerVar!, marginLeft: "auto", marginRight: "auto" }
      : {};

  if (effectiveContainerWidth === "edge-to-edge") {
    return (
      <div data-section-id={id} data-container-width="edge-to-edge" style={Object.keys(outerSectionStyle).length > 0 ? outerSectionStyle : undefined}>
        {surfaceContent}
      </div>
    );
  }
  return (
    <div data-section-id={id} data-container-width={effectiveContainerWidth} style={outerSectionStyle}>
      {surfaceContent}
    </div>
  );
}

