"use client";

import React, { memo, useMemo, useRef, useLayoutEffect, useState } from "react";
import JsonRenderer from "@/engine/core/json-renderer";
import { getDefaultCardPresetForSectionPreset, SAFE_DEFAULT_CARD_PRESET_ID } from "@/layout";

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

  useLayoutEffect(() => {
    const outer = containerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner || containerWidth <= 0) return;
    const scale = containerWidth / BASE_RENDER_WIDTH;
    const contentHeight = inner.offsetHeight;
    setScaledHeight(Math.ceil(contentHeight * scale));
  });

  const content = useMemo(() => {
    if (!screenModel) return null;
    const sectionNode = findSectionByKey(screenModel, sectionKey);
    const previewRoot = sectionNode ?? screenModel;
    if (!sectionNode && typeof process !== "undefined" && process.env.NODE_ENV === "development") {
      console.log("[PreviewRender] using full screenModel (section not found)", { sectionKey });
    }
    let sectionOverrides: Record<string, string>;
    let cardOverrides: Record<string, string>;
    if (previewType === "sectionLayout") {
      sectionOverrides = { [sectionKey]: previewValue };
      const defaultCard = getDefaultCardPresetForSectionPreset(previewValue || null) ?? SAFE_DEFAULT_CARD_PRESET_ID;
      cardOverrides = { [sectionKey]: defaultCard };
    } else {
      sectionOverrides = currentSectionPreset ? { [sectionKey]: currentSectionPreset } : {};
      cardOverrides = { [sectionKey]: previewValue };
    }
    return (
      <JsonRenderer
        node={previewRoot}
        defaultState={defaultState}
        profileOverride={profileOverride}
        sectionLayoutPresetOverrides={sectionOverrides}
        cardLayoutPresetOverrides={cardOverrides}
        organInternalLayoutOverrides={{}}
        screenId={screenKey}
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
    return (
      <div
        style={{
          width: "100%",
          minHeight: 80,
          background: "#f1f5f9",
          borderRadius: 8,
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

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: scaledHeight ?? "auto",
        minHeight: scaledHeight ?? 120,
        position: "relative",
        overflow: "hidden",
        borderRadius: 8,
        background: "#f8fafc",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <div
        ref={innerRef}
        style={{
          width: BASE_RENDER_WIDTH,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          overflow: "hidden",
        }}
      >
        {content}
      </div>
    </div>
  );
}

/** Fallback when preview render throws (e.g. heavy or broken tree). */
function PreviewFallback() {
  return (
    <div
      style={{
        width: "100%",
        minHeight: 80,
        background: "#f1f5f9",
        borderRadius: 8,
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
