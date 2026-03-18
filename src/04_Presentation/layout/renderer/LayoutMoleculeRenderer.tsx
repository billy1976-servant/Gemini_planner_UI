"use client";

/**
 * SYSTEM LAW — Vertical spacing pipeline:
 *   Layout Engine → Sequence/Collection gap + padding → DOM.
 * Nothing else is allowed. If spacingMode=none, EVERY vertical value must be 0.
 */

import React from "react";
import { useSearchParams } from "next/navigation";
import { SurfaceAtom, TextAtom, SequenceAtom, CollectionAtom } from "@/components/atoms";
import { OriginTraceProvider } from "@/03_Runtime/diagnostics/OriginTraceContext";
import { usePreviewTile } from "@/04_Presentation/contexts/PreviewTileContext";
import { resolveParams } from "@/engine/core/palette-resolver";
import { resolveMoleculeLayout, getSectionLayoutIds } from "@/layout";
import type { LayoutDefinition } from "@/layout/resolver";

const LAYOUT_RECOVERY_MODE = true;

/** Spacing mode → base token for engine-driven section spacing. */
const SPACING_MODE_TOKEN: Record<string, string> = {
  tight: "var(--spacing-6)",
  normal: "var(--spacing-10)",
  airy: "var(--spacing-16)",
  none: "0",
};

export type SectionSpacingContext = {
  index: number;
  totalSections: number;
  hasMultipleSections: boolean;
  stackingDirection?: "column" | "row";
  layoutDensityMode?: "tight" | "normal" | "airy" | "none";
};

/**
 * Engine-owned section spacing: context-aware padding and gap.
 * Only vertical padding is computed; horizontal remains from container contentInsetX.
 *
 * Layout engine is the ONLY vertical spacing authority.
 * All external spacing must be ignored.
 */
export function resolveSectionSpacing(context: SectionSpacingContext): {
  paddingTop: string;
  paddingBottom: string;
  gap: string;
} {
  const { index, totalSections, layoutDensityMode = "normal" } = context;

  // Hard override: spacingMode=none must produce completely collapsed stack (0 padding, 0 gap everywhere).
  if (layoutDensityMode === "none") {
    return { paddingTop: "0", paddingBottom: "0", gap: "0" };
  }

  const S = SPACING_MODE_TOKEN[layoutDensityMode] ?? SPACING_MODE_TOKEN.normal;
  if (S === "0") {
    return { paddingTop: "0", paddingBottom: "0", gap: "0" };
  }

  if (totalSections <= 0) {
    return { paddingTop: "0", paddingBottom: "0", gap: "0" };
  }

  if (totalSections === 1) {
    return { paddingTop: S, paddingBottom: S, gap: `calc(${S} * 0.5)` };
  }

  const half = `calc(${S} * 0.5)`;
  if (index === 0) {
    return { paddingTop: S, paddingBottom: half, gap: half };
  }
  if (index === totalSections - 1) {
    return { paddingTop: half, paddingBottom: S, gap: half };
  }
  return { paddingTop: half, paddingBottom: half, gap: half };
}

function recoveryFallbackForKey(name: string): any {
  if (name.includes("display")) return "flex";
  if (name.includes("flexDirection") || name.includes("direction")) return "column";
  if (name.includes("gap")) return "0";
  if (name.includes("width") || name.includes("Width")) return "100%";
  if (name.includes("minHeight")) return "0";
  if (name.includes("overflow")) return "hidden";
  if (name.includes("alignItems")) return "stretch";
  if (name.includes("minWidth")) return "0";
  if (name.includes("maxWidth") || name.includes("maxHeight")) return "100%";
  if (name.includes("objectFit")) return "contain";
  if (name.includes("gridTemplateColumns")) return "1fr 1fr";
  if (name.includes("mediaSlot")) return "right";
  return "0";
}

// Safe layout rendering: in LAYOUT_RECOVERY_MODE never block; use fallback and warn.
function requireLayoutValue(name: string, value: any, layoutId: string | null) {
  if (value === undefined || value === null) {
    if (LAYOUT_RECOVERY_MODE) {
      const fallback = recoveryFallbackForKey(name);
      console.warn("LAYOUT_RECOVERY_MODE_USING_FALLBACK", name);
      return fallback;
    }
    console.warn("[LAYOUT SAFE DEFAULT]", name);
    return undefined;
  }
  return value;
}

// Fallback renderer for when layout validation would fail
function renderWithDefaults(layout: any, children: React.ReactNode) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      {children}
    </div>
  );
}

// Safe defaults helper: in LAYOUT_RECOVERY_MODE never block; always return safeDefault when value missing
function getLayoutValueWithSafeDefault(
  name: string,
  value: any,
  layoutId: string | null,
  safeDefault: any
): any {
  if (value !== undefined && value !== null) {
    return value;
  }
  if (LAYOUT_RECOVERY_MODE) {
    console.warn("LAYOUT_RECOVERY_MODE_USING_FALLBACK", name);
    return safeDefault;
  }
  if (layoutId != null) {
    console.warn("[LAYOUT SAFE DEFAULT]", { layoutId, missing: name, defaultValue: safeDefault });
    return safeDefault;
  }
  return undefined;
}

function isMediaChild(child: React.ReactNode): child is React.ReactElement {
  if (!React.isValidElement(child)) return false;
  const p: any = child.props;
  return (
    p["data-media-url"] != null ||
    p.content?.media != null ||
    p.node?.content?.media != null
  );
}

function partitionChildren(children: React.ReactNode): {
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

function getRawMedia(mediaChild: React.ReactElement | null): unknown {
  if (!mediaChild || !React.isValidElement(mediaChild)) return undefined;
  const p = mediaChild.props as any;
  return p?.["data-media-url"] ?? p?.content?.media ?? p?.node?.content?.media;
}

/** Resolve media to a string URL: supports media as string or media as { url: string }. */
function resolveMediaSrc(media: unknown): string {
  if (typeof media === "string") return media;
  if (media != null && typeof media === "object" && "url" in media && typeof (media as { url?: string }).url === "string") {
    return (media as { url: string }).url;
  }
  return "";
}

function getMediaUrl(mediaChild: React.ReactElement | null): string {
  return resolveMediaSrc(getRawMedia(mediaChild));
}

export type LayoutMoleculeRendererProps = {
  layout: LayoutDefinition | null | undefined;
  /** Preset id applied (e.g. from dropdown); used for data-section-layout in DOM for e2e. */
  layoutPresetId?: string | null;
  id?: string;
  role?: string;
  /** Section index (0-based) among siblings for engine-driven spacing. */
  sectionIndex?: number;
  /** Total number of sections for engine-driven spacing. */
  totalSections?: number;
  /** Density: tight | normal | airy | none. Overridable by URL ?spacingMode=. */
  spacingMode?: "tight" | "normal" | "airy" | "none";
  params?: {
    surface?: any;
    title?: any;
    [k: string]: any;
  };
  content?: { title?: string };
  children?: React.ReactNode;
};

/**
 * Renders section structure from unified layout definition.
 * Applies containerWidth, surface, split/grid/column from layout only when defined; no invented defaults.
 */
export default function LayoutMoleculeRenderer({
  layout,
  layoutPresetId,
  id,
  sectionIndex = 0,
  totalSections = 1,
  spacingMode: spacingModeProp,
  params = {},
  content = {},
  children,
}: LayoutMoleculeRendererProps) {
  const { isPreviewTile } = usePreviewTile();
  const searchParams = useSearchParams();
  const layoutNoneFromUrl = searchParams?.get("layout") === "none";
  const spacingModeFromUrl = searchParams?.get("spacingMode") as "tight" | "normal" | "airy" | "none" | null;
  const spacingMode = spacingModeFromUrl ?? spacingModeProp ?? "normal";
  const effectiveLayoutId = layoutPresetId ?? (layout as any)?.id ?? null;
  const isNoLayoutMode = layoutNoneFromUrl || effectiveLayoutId === "none";
  const FORCED_BASE_LAYOUT: LayoutDefinition = {
    containerWidth: "full",
    moleculeLayout: { type: "column", params: { gap: "0" } },
    container: { width: "100%", boxSizing: "border-box", overflowX: "hidden", contentInsetX: "var(--spacing-4)" },
  } as LayoutDefinition;
  const effectiveLayout = layout == null && LAYOUT_RECOVERY_MODE ? FORCED_BASE_LAYOUT : layout;
  if (layout == null && !LAYOUT_RECOVERY_MODE) {
    return <>{children}</>;
  }
  layout = effectiveLayout as LayoutDefinition;

  const layoutType = (layout as any)?.moleculeLayout?.type ?? "column";
  const layoutId = layoutPresetId ?? (layout as any)?.id ?? null;
  const nodeId = id ?? "";
  const nodeType = "section";
  const validLayoutIds = getSectionLayoutIds();
  const layoutIdExistsInDefinitions = layoutId != null && validLayoutIds.includes(layoutId);
  console.log("[LAYOUT CONTRACT DIAGNOSTIC]", {
    nodeId,
    nodeType,
    resolvedLayoutId: layoutId,
    layoutIdExistsInDefinitions,
  });
  if (layoutId == null || !layoutIdExistsInDefinitions) {
    console.log("MISSING_LAYOUT_CONTRACT:", { nodeId, nodeType, layoutId });
  }

  // PHASE 6: Debug signal - confirm contract is complete
  const sectionKey = id ?? "";
  const hasContainerObject = layout?.container != null;
  console.log("[LAYOUT CONTRACT ACTIVE]", {
    sectionKey,
    layoutId,
    containerWidth: layout?.containerWidth,
    hasContainerObject
  });
  
  // Log layout source once per render
  console.log("[LAYOUT SOURCE]", {
    layoutId,
    layoutObject: layout
  });

  const {
    containerWidth: rawWidth,
    split: splitConfig,
    backgroundVariant: variant,
    moleculeLayout,
  } = layout;

  console.log("MOLECULE_INPUT", {
    layoutId: layoutPresetId ?? (layout as any)?.id ?? null,
    containerWidth: layout?.containerWidth ?? rawWidth,
    params,
  });

  const surfaceParams = resolveParams(params.surface);
  const surfaceWithVariant =
    variant === "hero-accent"
      ? { ...surfaceParams, background: "var(--color-surface-hero-accent)" }
      : variant === "alt"
        ? { ...surfaceParams, background: "var(--color-surface-alt)" }
        : variant === "dark"
          ? { ...surfaceParams, background: "var(--color-surface-dark)", color: "var(--color-on-surface-dark)" }
          : surfaceParams;

  const slotContent = content?.title ? (
    <TextAtom params={resolveParams(params.title)}>{content.title}</TextAtom>
  ) : null;

  const isSplit = splitConfig?.type === "split";
  // STRICT: Only use mediaSlot if explicitly provided in JSON
  const mediaSlot = splitConfig?.mediaSlot;
  if (isSplit && !mediaSlot) {
    requireLayoutValue("split.mediaSlot", mediaSlot, layoutId);
  }
  const { contentChildren, mediaChild } = isSplit
    ? partitionChildren(children)
    : { contentChildren: [] as React.ReactNode[], mediaChild: null as React.ReactElement | null };

  const layoutIdForTrace = layoutPresetId ?? (layout as any)?.id ?? null;
  const slotsForTrace = (layout as any)?.slots ?? {};
  console.log("SLOT MAP TRACE", {
    layoutId: layoutIdForTrace,
    slotKeys: Object.keys(slotsForTrace),
    childCount: React.Children.count(children),
  });
  console.log("STRUCTURE MODE", {
    layoutId: layoutIdForTrace,
    isSplit: !!(layout as any)?.split,
    direction: (layout as any)?.moleculeLayout?.type,
  });

  // STRICT: Only apply styles if explicitly provided in JSON
  const contentColumnStyle: React.CSSProperties = {};
  const contentColumnLayout = (layout as any)?.contentColumn ?? {};
  
  const contentColumnDisplay = requireLayoutValue("contentColumn.display", contentColumnLayout.display, layoutId);
  const contentColumnFlexDirection = requireLayoutValue("contentColumn.flexDirection", contentColumnLayout.flexDirection, layoutId);
  const contentColumnGap = requireLayoutValue("contentColumn.gap", contentColumnLayout.gap, layoutId);
  const contentColumnAlignItems = requireLayoutValue("contentColumn.alignItems", contentColumnLayout.alignItems, layoutId);
  const contentColumnMinWidth = requireLayoutValue("contentColumn.minWidth", contentColumnLayout.minWidth, layoutId);
  
  if (contentColumnDisplay !== undefined) contentColumnStyle.display = contentColumnDisplay;
  if (contentColumnFlexDirection !== undefined) contentColumnStyle.flexDirection = contentColumnFlexDirection;
  if (contentColumnGap !== undefined) contentColumnStyle.gap = contentColumnGap;
  if (contentColumnAlignItems !== undefined) contentColumnStyle.alignItems = contentColumnAlignItems;
  if (contentColumnMinWidth !== undefined) contentColumnStyle.minWidth = contentColumnMinWidth;
  if (LAYOUT_RECOVERY_MODE) {
    contentColumnStyle.display = contentColumnStyle.display ?? "flex";
    contentColumnStyle.flexDirection = contentColumnStyle.flexDirection ?? "column";
    contentColumnStyle.width = contentColumnStyle.width ?? "100%";
  }

  const contentColumn = (
    <div style={contentColumnStyle}>
      {slotContent}
      {contentChildren}
    </div>
  );

  const rawMedia = getRawMedia(mediaChild);
  const mediaSrc = resolveMediaSrc(rawMedia);
  console.log("MEDIA_SRC_RESOLVED", rawMedia, mediaSrc);
  const mediaColumnLayout = (layout as any)?.mediaColumn ?? {};
  const mediaColumnStyle: React.CSSProperties = {};
  
  const mediaColumnDisplay = requireLayoutValue("mediaColumn.display", mediaColumnLayout.display, layoutId);
  const mediaColumnMinHeight = requireLayoutValue("mediaColumn.minHeight", mediaColumnLayout.minHeight, layoutId);
  const mediaColumnOverflow = requireLayoutValue("mediaColumn.overflow", mediaColumnLayout.overflow, layoutId);
  const mediaColumnAlignItems = requireLayoutValue("mediaColumn.alignItems", mediaColumnLayout.alignItems, layoutId);
  const mediaColumnWidth = requireLayoutValue("mediaColumn.width", mediaColumnLayout.width, layoutId);
  const mediaColumnMaxWidth = requireLayoutValue("mediaColumn.maxWidth", mediaColumnLayout.maxWidth, layoutId);
  
  if (mediaColumnDisplay !== undefined) mediaColumnStyle.display = mediaColumnDisplay;
  if (mediaColumnMinHeight !== undefined) mediaColumnStyle.minHeight = mediaColumnMinHeight;
  if (mediaColumnOverflow !== undefined) mediaColumnStyle.overflow = mediaColumnOverflow;
  if (mediaColumnAlignItems !== undefined) mediaColumnStyle.alignItems = mediaColumnAlignItems;
  if (mediaColumnWidth !== undefined) mediaColumnStyle.width = mediaColumnWidth;
  if (mediaColumnMaxWidth !== undefined) mediaColumnStyle.maxWidth = mediaColumnMaxWidth;
  
  const mediaImageWrapperLayout = (layout as any)?.mediaImageWrapper ?? {};
  const mediaImageWrapperStyle: React.CSSProperties = {};
  
  const mediaImageWrapperWidth = getLayoutValueWithSafeDefault("mediaImageWrapper.width", mediaImageWrapperLayout.width, layoutId, "100%");
  const mediaImageWrapperMaxWidth = getLayoutValueWithSafeDefault("mediaImageWrapper.maxWidth", mediaImageWrapperLayout.maxWidth, layoutId, "100%");
  const mediaImageWrapperHeight = getLayoutValueWithSafeDefault("mediaImageWrapper.height", mediaImageWrapperLayout.height, layoutId, "auto");
  const mediaImageWrapperMinHeight = getLayoutValueWithSafeDefault("mediaImageWrapper.minHeight", mediaImageWrapperLayout.minHeight, layoutId, "0");
  const mediaImageWrapperMaxHeight = requireLayoutValue("mediaImageWrapper.maxHeight", mediaImageWrapperLayout.maxHeight, layoutId);
  const mediaImageWrapperOverflow = requireLayoutValue("mediaImageWrapper.overflow", mediaImageWrapperLayout.overflow, layoutId);
  
  if (mediaImageWrapperWidth !== undefined) mediaImageWrapperStyle.width = mediaImageWrapperWidth;
  if (mediaImageWrapperMaxWidth !== undefined) mediaImageWrapperStyle.maxWidth = mediaImageWrapperMaxWidth;
  if (mediaImageWrapperHeight !== undefined) mediaImageWrapperStyle.height = mediaImageWrapperHeight;
  if (mediaImageWrapperMinHeight !== undefined) mediaImageWrapperStyle.minHeight = mediaImageWrapperMinHeight;
  if (mediaImageWrapperMaxHeight !== undefined) mediaImageWrapperStyle.maxHeight = mediaImageWrapperMaxHeight;
  if (mediaImageWrapperOverflow !== undefined) mediaImageWrapperStyle.overflow = mediaImageWrapperOverflow;
  
  const mediaImageLayout = (layout as any)?.mediaImage ?? {};
  const mediaImageStyle: React.CSSProperties = {};
  
  const mediaImageWidth = requireLayoutValue("mediaImage.width", mediaImageLayout.width, layoutId);
  const mediaImageMaxWidth = requireLayoutValue("mediaImage.maxWidth", mediaImageLayout.maxWidth, layoutId);
  const mediaImageHeight = requireLayoutValue("mediaImage.height", mediaImageLayout.height, layoutId);
  const mediaImageObjectFit = requireLayoutValue("mediaImage.objectFit", mediaImageLayout.objectFit, layoutId);
  const mediaImageDisplay = requireLayoutValue("mediaImage.display", mediaImageLayout.display, layoutId);
  
  if (mediaImageWidth !== undefined) mediaImageStyle.width = mediaImageWidth;
  if (mediaImageMaxWidth !== undefined) mediaImageStyle.maxWidth = mediaImageMaxWidth;
  if (mediaImageHeight !== undefined) mediaImageStyle.height = mediaImageHeight;
  if (mediaImageObjectFit !== undefined) mediaImageStyle.objectFit = mediaImageObjectFit;
  if (mediaImageDisplay !== undefined) mediaImageStyle.display = mediaImageDisplay;

  if (isPreviewTile) {
    mediaImageStyle.width = "100%";
    mediaImageStyle.maxWidth = "100%";
    mediaImageStyle.height = "auto";
    mediaImageStyle.objectFit = "contain";
  }

  const mediaColumn =
    mediaChild != null ? (
      <div
        data-layout-2-media
        style={mediaColumnStyle}
      >
        {mediaSrc ? (
          <div style={mediaImageWrapperStyle}>
            <img
              src={mediaSrc}
              alt=""
              style={mediaImageStyle}
            />
          </div>
        ) : (
          mediaChild
        )}
      </div>
    ) : null;

  const mlParams = (moleculeLayout?.params ?? {}) as Record<string, unknown>;
  const hasMoleculeType = typeof moleculeLayout?.type === "string" && moleculeLayout.type.trim().length > 0;
  let resolved = hasMoleculeType
    ? resolveMoleculeLayout(
        moleculeLayout!.type as "column" | "row" | "grid" | "stacked",
        moleculeLayout?.preset ?? null,
        { ...(moleculeLayout?.params ?? {}) }
      )
    : null;
  if (LAYOUT_RECOVERY_MODE && (resolved == null || (resolved.display == null && resolved.direction == null))) {
    resolved = { display: "flex", direction: "column", width: "100%", gap: "0" };
  }

  // Engine-owned spacing: compute from context (section index, total, density) or force zero when ?layout=none / layout=none
  const engineSpacing = resolveSectionSpacing({
    index: sectionIndex,
    totalSections: Math.max(1, totalSections),
    hasMultipleSections: totalSections > 1,
    layoutDensityMode: isNoLayoutMode ? "none" : spacingMode,
  });
  // Section vertical spacing is engine-only; template/preset spacing is intentionally ignored. This overwrite always wins.
  const gap = isNoLayoutMode ? "0" : engineSpacing.gap;
  const padding = isNoLayoutMode ? "0" : `${engineSpacing.paddingTop} 0 ${engineSpacing.paddingBottom}`;
  if (resolved != null) {
    resolved = { ...resolved, gap, padding };
  }

  // DEBUG: Stripped all debug borders/backgrounds to see raw layout
  const splitContentWrapper = { border: "none", background: "transparent" as const, padding: 0, margin: 0 };
  const splitMediaWrapper = { border: "none", background: "transparent" as const, padding: 0, margin: 0 };
  const nonSplitWrapperBase: React.CSSProperties = { border: "none", background: "transparent", padding: 0, margin: 0 };
  if (LAYOUT_RECOVERY_MODE) {
    nonSplitWrapperBase.display = "flex";
    nonSplitWrapperBase.flexDirection = "column";
    nonSplitWrapperBase.width = "100%";
  }
  const nonSplitWrapper = nonSplitWrapperBase;

  // STRICT: Only apply split layout styles if explicitly provided in JSON
  const splitLayout = (layout as any)?.splitLayout ?? {};
  const splitLayoutStyle: React.CSSProperties = {};
  
  const splitDisplay = requireLayoutValue("splitLayout.display", splitLayout.display, layoutId);
  const splitGridTemplateColumns = requireLayoutValue("splitLayout.gridTemplateColumns", splitLayout.gridTemplateColumns, layoutId);
  const splitAlignItems = requireLayoutValue("splitLayout.alignItems", splitLayout.alignItems, layoutId);
  const splitMaxWidth = requireLayoutValue("splitLayout.maxWidth", splitLayout.maxWidth, layoutId);
  const splitMinWidth = requireLayoutValue("splitLayout.minWidth", splitLayout.minWidth, layoutId);
  
  if (splitDisplay !== undefined) splitLayoutStyle.display = splitDisplay;
  if (splitGridTemplateColumns !== undefined) splitLayoutStyle.gridTemplateColumns = splitGridTemplateColumns;
  if (splitAlignItems !== undefined) splitLayoutStyle.alignItems = splitAlignItems;
  if (splitMaxWidth !== undefined) splitLayoutStyle.maxWidth = splitMaxWidth;
  if (splitMinWidth !== undefined) splitLayoutStyle.minWidth = splitMinWidth;
  if (gap !== undefined) splitLayoutStyle.gap = gap;
  // Vertical padding on split container (horizontal stays on outer via contentInsetX)
  splitLayoutStyle.paddingTop = engineSpacing.paddingTop;
  splitLayoutStyle.paddingBottom = engineSpacing.paddingBottom;
  splitLayoutStyle.paddingLeft = 0;
  splitLayoutStyle.paddingRight = 0;
  // Apply moleculeLayout params that affect split container (e.g. minHeight)
  const splitMinHeight = (mlParams.minHeight as string | undefined);
  if (splitMinHeight !== undefined && splitMinHeight !== null) {
    splitLayoutStyle.minHeight = splitMinHeight;
  }
  
  const innerContent = isSplit ? (
    <div style={splitLayoutStyle}>
      {mediaSlot === "left" ? (
        <>
          <div style={splitMediaWrapper}>{mediaColumn}</div>
          <div style={splitContentWrapper}>{contentColumn}</div>
        </>
      ) : (
        <>
          <div style={splitContentWrapper}>{contentColumn}</div>
          <div style={splitMediaWrapper}>{mediaColumn}</div>
        </>
      )}
    </div>
  ) : resolved != null && resolved.display === "grid" ? (
    <div style={nonSplitWrapper}>
      <CollectionAtom params={resolved}>
        {slotContent}
        {children}
      </CollectionAtom>
    </div>
  ) : resolved != null && resolved.direction != null ? (
    <div style={nonSplitWrapper}>
      <SequenceAtom params={resolved}>
        {slotContent}
        {children}
      </SequenceAtom>
    </div>
  ) : resolved != null ? (
    <div style={nonSplitWrapper}>
      <div style={resolved}>
        {slotContent}
        {children}
      </div>
    </div>
  ) : (
    <div style={nonSplitWrapper}>
      {slotContent}
      {children}
    </div>
  );

  const layoutIdUsed = layoutPresetId ?? (layout as any)?.id ?? null;
  const slots = layout && typeof layout === "object" ? (layout as Record<string, unknown>) : undefined;
  const childCount = typeof children !== "undefined" ? React.Children.count(children) : 0;
  console.log("LAYOUT STRUCTURE TRACE", {
    layoutIdUsed,
    slotCount: Object.keys(slots ?? {}).length,
    childCount,
  });
  if (typeof window !== "undefined") {
    const sectionKey = id ?? "";
    console.log("[LAYOUT TRACE] Layout renderer using layout", {
      sectionKey,
      layoutIdUsed: layoutPresetId ?? null,
      containerWidth: layout?.containerWidth,
    });
    (window as any).__LAYOUT_TRACE__ = (window as any).__LAYOUT_TRACE__ || [];
    (window as any).__LAYOUT_TRACE__.push({
      stage: "layout-renderer",
      sectionKey,
      layoutIdUsed: layoutPresetId ?? null,
      containerWidthApplied: layout?.containerWidth,
      ts: Date.now(),
    });
  }

  // PHASE 3: Container contract handling
  // IF layout.container exists → use it directly
  // IF layout.container missing → DO NOT synthesize layout logic, only use safe defaults as neutral protection
  const containerLayout = layout?.container;
  const outerStyle: React.CSSProperties = {};
  
  // Handle containerWidth mapping (preserved for backward compatibility - semantic token layer)
  // This maps containerWidth semantic tokens to maxWidth CSS values
  const knownWidth =
    rawWidth === "contained"
      ? "var(--container-content)"
      : rawWidth === "narrow"
        ? "var(--container-narrow)"
        : rawWidth === "wide"
          ? "var(--container-wide)"
          : rawWidth === "split"
            ? "var(--container-wide)"
            : rawWidth === "full"
              ? "100%"
              : null;
  const isCssVar =
    typeof rawWidth === "string" && /^var\s*\([^)]+\)$/.test(rawWidth.trim());
  const isLength =
    typeof rawWidth === "string" &&
    /^\d+(\.\d+)?(px|rem|vw|%)$/.test(rawWidth.trim());
  const containerVar =
    rawWidth != null
      ? knownWidth ??
        (isCssVar || isLength ? (rawWidth as string).trim() : undefined)
      : undefined;
  
  // IF layout.container exists → use it directly (contract complete)
  if (containerLayout != null) {
    if (containerLayout.width !== undefined) outerStyle.width = containerLayout.width;
    if (containerLayout.marginLeft !== undefined) outerStyle.marginLeft = containerLayout.marginLeft;
    if (containerLayout.marginRight !== undefined) outerStyle.marginRight = containerLayout.marginRight;
    if (containerLayout.boxSizing !== undefined) outerStyle.boxSizing = containerLayout.boxSizing as React.CSSProperties['boxSizing'];
    if (containerLayout.overflowX !== undefined) outerStyle.overflowX = containerLayout.overflowX as React.CSSProperties['overflowX'];
    // Use containerWidth semantic token for maxWidth (preserved semantic layer)
    if (containerVar !== undefined) outerStyle.maxWidth = containerVar;
    // Phase D: single horizontal padding owner — apply layout contentInsetX at top container only
    const contentInsetX = (containerLayout as Record<string, unknown>).contentInsetX as string | undefined;
    if (contentInsetX !== undefined && contentInsetX !== null) {
      outerStyle.paddingLeft = contentInsetX;
      outerStyle.paddingRight = contentInsetX;
    }
  } else {
    // IF layout.container missing → only use safe defaults as neutral protection (not layout shaping)
    // This should rarely happen after Phase 1, but provides neutral protection for edge cases
    const containerWidth = getLayoutValueWithSafeDefault("container.width", undefined, layoutId, "100%");
    const containerMaxWidth = getLayoutValueWithSafeDefault("container.maxWidth", containerVar, layoutId, undefined);
    const containerMarginLeft = getLayoutValueWithSafeDefault("container.marginLeft", undefined, layoutId, "auto");
    const containerMarginRight = getLayoutValueWithSafeDefault("container.marginRight", undefined, layoutId, "auto");
    const containerBoxSizing = getLayoutValueWithSafeDefault("container.boxSizing", undefined, layoutId, "border-box");
    const containerOverflowX = getLayoutValueWithSafeDefault("container.overflowX", undefined, layoutId, "hidden");
    
    if (containerWidth !== undefined) outerStyle.width = containerWidth;
    if (containerMaxWidth !== undefined) outerStyle.maxWidth = containerMaxWidth;
    if (containerMarginLeft !== undefined) outerStyle.marginLeft = containerMarginLeft;
    if (containerMarginRight !== undefined) outerStyle.marginRight = containerMarginRight;
    if (containerBoxSizing !== undefined) outerStyle.boxSizing = containerBoxSizing;
    if (containerOverflowX !== undefined) outerStyle.overflowX = containerOverflowX;
  }

  // FINAL_LAYOUT_INPUT logging - track what renderer is ACTUALLY using
  // Note: resolved is already computed earlier in the function
  console.log("FINAL_LAYOUT_INPUT", {
    width: containerVar,
    height: undefined, // Not set in this renderer
    flexDirection: resolved?.direction,
    display: resolved?.display,
    gap: gap,
    containerWidth: rawWidth,
    parentWidth: undefined, // Not available here
    source: "LayoutMoleculeRenderer",
  });

  const childrenArr = React.Children.toArray(children);
  const firstChild = childrenArr[0];
  const firstChildType =
    (firstChild as any)?.type?.name ?? (firstChild as any)?.type ?? "unknown";
  const slotNamesArr = Object.keys((layout as any)?.slots ?? {});
  console.log("FINAL RENDER TRACE", {
    layoutId: layoutIdUsed,
    slotNames: slotNamesArr,
    childrenCount: React.Children.count(children),
    firstChildType,
  });
  console.log("FINAL STRUCTURE CHECK", {
    layoutId: layoutIdUsed,
    slotNames: slotNamesArr,
    slotCount: slotNamesArr.length,
    childrenCount: React.Children.count(children),
    childTypes: React.Children.map(children, (c) =>
      (c as any)?.type?.displayName ?? (c as any)?.type?.name ?? typeof c
    ),
  });
  console.log("LAYOUT DEF TRACE", {
    id: (layout as any)?.id ?? layoutPresetId ?? null,
    slotKeys: Object.keys((layout as any)?.slots ?? {}),
    slotCount: Object.keys((layout as any)?.slots ?? {}).length,
  });

  // Ensure section outer has display and boxSizing so layout doesn't collapse.
  // Phase D: allow layout-provided horizontal padding (contentInsetX) to pass through; strip only accidental vertical and other constraints.
  // Phase G: layout is sole authority for containerWidth, maxWidth, marginLeft/marginRight (centering); no DEBUG override.
  const combinedOuterStyle =
    Object.keys(outerStyle).length > 0
      ? {
          display: "block" as const,
          boxSizing: "border-box" as const,
          ...outerStyle,
          paddingTop: 0,
          paddingBottom: 0,
          border: "none"
        }
      : {
          paddingTop: 0,
          paddingBottom: 0,
          border: "none"
        };

  return (
    <OriginTraceProvider value={{ layoutId: layoutId ?? undefined }}>
      <div
        data-section-id={id}
        data-section-layout={layoutPresetId ?? undefined}
        data-layout-2
        data-container-width={rawWidth ?? undefined}
        style={combinedOuterStyle}
      >
        <SurfaceAtom params={surfaceWithVariant}>{innerContent}</SurfaceAtom>
      </div>
    </OriginTraceProvider>
  );
}
