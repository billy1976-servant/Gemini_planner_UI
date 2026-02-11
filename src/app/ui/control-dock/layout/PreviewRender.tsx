"use client";

import React, { memo, useMemo, useRef, useLayoutEffect, useState } from "react";
import JsonRenderer from "@/engine/core/json-renderer";
import { getDefaultCardPresetForSectionPreset, SAFE_DEFAULT_CARD_PRESET_ID } from "@/layout";
import { PreviewTileProvider } from "@/04_Presentation/contexts/PreviewTileContext";

// STRICT PREVIEW MODE: If true, NO fallback values allowed. Preview must obey JSON 100%.
const STRICT_PREVIEW = true;

/** Content is rendered at this width, then scaled to container width. Height grows naturally. */
const BASE_RENDER_WIDTH = 1200;

export type PreviewRenderProps = {
  /** Root node of the currently loaded screen (same object passed to main JsonRenderer). */
  screenModel: any;
  /** "sectionLayout" = preview that section's layout; "cardLayout" = preview that section's card layout. */
  previewType: "sectionLayout" | "cardLayout";
  /** Layout id to preview (section layout id or card layout id). */
  previewValue: string;
  /** Section key to apply the preview override to. */
  sectionKey: string;
  /** Current section layout id for this section (required for card layout preview so compatibility is valid). */
  currentSectionPreset?: string;
  defaultState?: any;
  profileOverride?: any;
  screenKey?: string;
};

/** Section key = node.id ?? node.role (same as collectSectionKeysAndNodes). */
function findSectionByKey(screenModel: any, sectionKey: string): any {
  const children = screenModel?.children;
  if (Array.isArray(children)) {
    const found = children.find(
      (n: any) =>
        (n?.type ?? "").toString().toLowerCase() === "section" &&
        ((n.id ?? n.role) ?? "") === sectionKey
    );
    if (found) return found;
  }
  const sections = screenModel?.sections;
  if (Array.isArray(sections)) {
    const found = sections.find(
      (n: any) =>
        (n?.type ?? "").toString().toLowerCase() === "section" &&
        ((n.id ?? n.role) ?? "") === sectionKey
    );
    if (found) return found;
  }
  const fromChildren = Array.isArray(children)
    ? (children as any[])
        .filter((n: any) => (n?.type ?? "").toString().toLowerCase() === "section")
        .map((n: any) => (n.id ?? n.role) ?? "")
    : [];
  const fromSections = Array.isArray(sections)
    ? (sections as any[])
        .filter((n: any) => (n?.type ?? "").toString().toLowerCase() === "section")
        .map((n: any) => (n.id ?? n.role) ?? "")
    : [];
  const availableKeys = fromChildren.length > 0 ? fromChildren : fromSections;
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("[PreviewRender] section lookup failed", {
      sectionKey,
      availableKeys,
      hasChildren: Array.isArray(children),
      hasSections: Array.isArray(sections),
    });
  }
  return null;
}

function PreviewRenderInner({
  screenModel,
  previewType,
  previewValue,
  sectionKey,
  currentSectionPreset = "",
  defaultState,
  profileOverride,
  screenKey,
}: PreviewRenderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scaledHeight, setScaledHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setContainerWidth(el.offsetWidth);
    });
    ro.observe(el);
    setContainerWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  // Re-measure height when inner content size changes (e.g. images load) so tiles don't collapse.
  // ResizeObserver fires when the inner div's size changes; we scale and set scaledHeight.
  useLayoutEffect(() => {
    const outer = containerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner || containerWidth <= 0) return;

    const updateScaledHeight = () => {
      const w = containerRef.current?.offsetWidth ?? 0;
      if (w <= 0) return;
      const scale = w / BASE_RENDER_WIDTH;
      const contentHeight = innerRef.current?.offsetHeight ?? 0;
      const next = Math.ceil(contentHeight * scale);
      setScaledHeight(next);
      if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
        console.debug("[PreviewRender] scaledHeight recalculated", { previewValue, sectionKey, contentHeight, scaledHeight: next });
      }
    };

    updateScaledHeight();
    const ro = new ResizeObserver(updateScaledHeight);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [containerWidth, previewValue, sectionKey]);

  const content = useMemo(() => {
    if (!screenModel) return null;
    // PREVIEW ISOLATION: deep clone so each tile has an isolated tree (no shared reference).
    const isolatedModel =
      typeof structuredClone === "function"
        ? structuredClone(screenModel)
        : JSON.parse(JSON.stringify(screenModel));
    const sectionNode = findSectionByKey(isolatedModel, sectionKey);
    const previewRoot = sectionNode ?? isolatedModel;
    if (!sectionNode && typeof process !== "undefined" && process.env.NODE_ENV === "development") {
      console.log("[PreviewRender] using full screenModel (section not found)", { sectionKey });
    }
    let sectionOverrides: Record<string, string>;
    let cardOverrides: Record<string, string>;
    if (previewType === "sectionLayout") {
      sectionOverrides = { [sectionKey]: previewValue };
      const defaultCard = getDefaultCardPresetForSectionPreset(previewValue || null);
      if (!defaultCard && STRICT_PREVIEW) {
        console.warn("[PREVIEW FALLBACK BLOCKED]", { propName: "defaultCardPreset" });
      }
      cardOverrides = { [sectionKey]: defaultCard ?? (STRICT_PREVIEW ? undefined : SAFE_DEFAULT_CARD_PRESET_ID) };
    } else {
      sectionOverrides = currentSectionPreset ? { [sectionKey]: currentSectionPreset } : {};
      cardOverrides = { [sectionKey]: previewValue };
    }
    // PREVIEW ISOLATION: trace model refs — if modelRef is identical across tiles, React was reusing the same tree.
    console.log("PREVIEW MODEL ID", {
      previewValue,
      modelRef: screenModel,
      clonedRef: isolatedModel,
    });
    console.log("LIVE PREVIEW TILE", {
      previewValue,
      sectionKey,
      sectionOverrides,
    });
    return (
      <JsonRenderer
        key={previewValue}
        node={previewRoot}
        defaultState={defaultState}
        profileOverride={profileOverride}
        sectionLayoutPresetOverrides={sectionOverrides}
        cardLayoutPresetOverrides={cardOverrides}
        organInternalLayoutOverrides={{}}
        screenId={screenKey}
        forceCardCompatibility={previewType === "cardLayout"}
      />
    );
  }, [
    screenModel,
    defaultState,
    profileOverride,
    sectionKey,
    previewType,
    previewValue,
    currentSectionPreset,
    screenKey,
  ]);

  if (!screenModel) {
    const noScreenWidth = undefined;
    const noScreenMinHeight = undefined;
    const noScreenBackground = undefined;
    const noScreenBorderRadius = undefined;
    
    if (STRICT_PREVIEW) {
      if (noScreenWidth === undefined) console.warn("[PREVIEW FALLBACK BLOCKED]", { propName: "width" });
      if (noScreenMinHeight === undefined) console.warn("[PREVIEW FALLBACK BLOCKED]", { propName: "minHeight" });
      if (noScreenBackground === undefined) console.warn("[PREVIEW FALLBACK BLOCKED]", { propName: "background" });
      if (noScreenBorderRadius === undefined) console.warn("[PREVIEW FALLBACK BLOCKED]", { propName: "borderRadius" });
    }
    
    return (
      <div
        style={{
          width: STRICT_PREVIEW ? noScreenWidth : (noScreenWidth ?? "100%"),
          minHeight: STRICT_PREVIEW ? noScreenMinHeight : (noScreenMinHeight ?? 80),
          background: STRICT_PREVIEW ? noScreenBackground : (noScreenBackground ?? "#f1f5f9"),
          borderRadius: STRICT_PREVIEW ? noScreenBorderRadius : (noScreenBorderRadius ?? 8),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: "#64748b",
        }}
      >
        No screen
      </div>
    );
  }

  const scale = containerWidth > 0 ? containerWidth / BASE_RENDER_WIDTH : 1;

  // DEBUG: Log preview size information
  useLayoutEffect(() => {
    const bounding = containerRef.current?.getBoundingClientRect?.();
    console.log("PREVIEW SIZE CHECK", {
      layoutId: previewValue,
      containerWidthApplied: containerWidth,
      bounding,
    });
  }, [previewValue, containerWidth]);

  // STRICT: Only apply styles if explicitly provided (no fallbacks in strict mode)
  const containerStyle: React.CSSProperties = {
    // Height follows scaled content so tile auto-adjusts vertically (no clip, no excess space)
    height: scaledHeight != null ? scaledHeight : "auto",
    minHeight: scaledHeight != null ? undefined : (STRICT_PREVIEW ? undefined : 120),
    position: "relative",
    width: "100%",
    maxWidth: "none",
    flex: "0 0 auto", // Don't grow/shrink; height is content-driven
    overflow: "hidden",
  };

  // These should come from JSON/props - currently undefined means no fallback in strict mode
  const minHeightProp = undefined; // Should come from JSON
  const borderRadiusProp = undefined; // Should come from JSON
  const backgroundProp = undefined; // Should come from JSON
  const boxShadowProp = undefined; // Should come from JSON
  const paddingProp = undefined; // Should come from JSON
  const marginProp = undefined; // Should come from JSON

  if (STRICT_PREVIEW) {
    if (minHeightProp === undefined) console.warn("[PREVIEW FALLBACK BLOCKED]", { propName: "minHeight" });
    if (borderRadiusProp === undefined) console.warn("[PREVIEW FALLBACK BLOCKED]", { propName: "borderRadius" });
    if (backgroundProp === undefined) console.warn("[PREVIEW FALLBACK BLOCKED]", { propName: "background" });
    if (boxShadowProp === undefined) console.warn("[PREVIEW FALLBACK BLOCKED]", { propName: "boxShadow" });
    if (paddingProp === undefined) console.warn("[PREVIEW FALLBACK BLOCKED]", { propName: "padding" });
    if (marginProp === undefined) console.warn("[PREVIEW FALLBACK BLOCKED]", { propName: "margin" });
  }

  // Only apply styles if defined, or use fallback if not in strict mode (skip minHeight when height is set from scaledHeight)
  if (scaledHeight == null) {
    containerStyle.minHeight = STRICT_PREVIEW ? minHeightProp : (minHeightProp ?? "280px");
  }
  containerStyle.borderRadius = STRICT_PREVIEW ? borderRadiusProp : (borderRadiusProp ?? 8);
  containerStyle.background = STRICT_PREVIEW ? backgroundProp : (backgroundProp ?? "#f8fafc");
  containerStyle.boxShadow = STRICT_PREVIEW ? boxShadowProp : (boxShadowProp ?? "0 1px 3px rgba(0,0,0,0.08)");
  if (paddingProp !== undefined || !STRICT_PREVIEW) {
    containerStyle.padding = STRICT_PREVIEW ? paddingProp : (paddingProp ?? undefined);
  }
  if (marginProp !== undefined || !STRICT_PREVIEW) {
    containerStyle.margin = STRICT_PREVIEW ? marginProp : (marginProp ?? undefined);
  }

  return (
    <div
      key={`${previewValue}-${sectionKey}`}
      ref={containerRef}
      style={containerStyle}
    >
      <div
        ref={innerRef}
        style={{
          width: `${BASE_RENDER_WIDTH}px`,
          height: "auto",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          overflow: "visible",
          display: "block",
        }}
      >
        <PreviewTileProvider>{content}</PreviewTileProvider>
      </div>
    </div>
  );
}

/** Fallback when preview render throws (e.g. heavy or broken tree). */
function PreviewFallback() {
  const fallbackWidth = undefined;
  const fallbackMinHeight = undefined;
  const fallbackBackground = undefined;
  const fallbackBorderRadius = undefined;
  
  if (STRICT_PREVIEW) {
    if (fallbackWidth === undefined) console.warn("[PREVIEW FALLBACK BLOCKED]", { propName: "width" });
    if (fallbackMinHeight === undefined) console.warn("[PREVIEW FALLBACK BLOCKED]", { propName: "minHeight" });
    if (fallbackBackground === undefined) console.warn("[PREVIEW FALLBACK BLOCKED]", { propName: "background" });
    if (fallbackBorderRadius === undefined) console.warn("[PREVIEW FALLBACK BLOCKED]", { propName: "borderRadius" });
  }
  
  return (
    <div
      style={{
        width: STRICT_PREVIEW ? fallbackWidth : (fallbackWidth ?? "100%"),
        minHeight: STRICT_PREVIEW ? fallbackMinHeight : (fallbackMinHeight ?? 80),
        background: STRICT_PREVIEW ? fallbackBackground : (fallbackBackground ?? "#f1f5f9"),
        borderRadius: STRICT_PREVIEW ? fallbackBorderRadius : (fallbackBorderRadius ?? 8),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        color: "#64748b",
      }}
    >
      Preview
    </div>
  );
}

class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

/**
 * Renders the currently loaded screen JSON with a single layout override applied for preview only.
 * Full sidebar width, width-based scale, auto height. Used in Section/Card Layout pickers.
 */
function PreviewRender(props: PreviewRenderProps) {
  return (
    <PreviewErrorBoundary fallback={<PreviewFallback />}>
      <PreviewRenderInner {...props} />
    </PreviewErrorBoundary>
  );
}

export default memo(PreviewRender);
