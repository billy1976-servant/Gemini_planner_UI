"use client";

import React from "react";
import SurfaceAtom from "@/components/9-atoms/primitives/surface";
import TextAtom from "@/components/9-atoms/primitives/text";
import SequenceAtom from "@/components/9-atoms/primitives/sequence";
import CollectionAtom from "@/components/9-atoms/primitives/collection";
import { resolveParams } from "@/engine/core/palette-resolver";
import { resolveMoleculeLayout } from "@/lib/layout/molecule-layout-resolver";
import type { LayoutDefinition } from "@/layout/resolver";

function isMediaChild(child: React.ReactNode): child is React.ReactElement {
  if (!React.isValidElement(child)) return false;
  const p: any = child.props;
  return p.content?.media != null || p.node?.content?.media != null;
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

function getMediaUrl(mediaChild: React.ReactElement | null): string | null {
  if (!mediaChild || !React.isValidElement(mediaChild)) return null;
  const p = mediaChild.props as any;
  const url = p?.content?.media ?? p?.node?.content?.media;
  return typeof url === "string" ? url : null;
}

export type LayoutMoleculeRendererProps = {
  layout: LayoutDefinition | null | undefined;
  /** Preset id applied (e.g. from dropdown); used for data-section-layout in DOM for e2e. */
  layoutPresetId?: string | null;
  id?: string;
  role?: string;
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
  params = {},
  content = {},
  children,
}: LayoutMoleculeRendererProps) {
  if (layout == null) {
    return <>{children}</>;
  }

  const {
    containerWidth: rawWidth,
    split: splitConfig,
    backgroundVariant: variant,
    moleculeLayout,
  } = layout;

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
  const mediaSlot = splitConfig?.mediaSlot ?? "right";
  const { contentChildren, mediaChild } = isSplit
    ? partitionChildren(children)
    : { contentChildren: [] as React.ReactNode[], mediaChild: null as React.ReactElement | null };

  const contentColumn = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-4)",
        alignItems: "flex-start",
        minWidth: 0,
      }}
    >
      {slotContent}
      {contentChildren}
    </div>
  );

  const mediaUrl = getMediaUrl(mediaChild);
  const mediaColumn =
    mediaChild != null ? (
      <div
        data-layout-2-media
        style={{
          display: "flex",
          minHeight: 0,
          overflow: "hidden",
          alignItems: "stretch",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        {mediaUrl ? (
          <div
            style={{
              width: "100%",
              maxWidth: "100%",
              height: "100%",
              minHeight: 0,
              maxHeight: "min(70vh, 560px)",
              overflow: "hidden",
            }}
          >
            <img
              src={mediaUrl}
              alt=""
              style={{
                width: "100%",
                maxWidth: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        ) : (
          mediaChild
        )}
      </div>
    ) : null;

  const mlParams = (moleculeLayout?.params ?? {}) as Record<string, unknown>;
  const gap = (mlParams.gap as string) ?? "var(--spacing-6)";
  const padding: string | undefined = mlParams.padding != null ? (mlParams.padding as string) : undefined;

  const hasMoleculeType = typeof moleculeLayout?.type === "string" && moleculeLayout.type.trim().length > 0;
  const resolved = hasMoleculeType
    ? resolveMoleculeLayout(
        moleculeLayout!.type as "column" | "row" | "grid" | "stacked",
        moleculeLayout?.preset ?? null,
        { ...(moleculeLayout?.params ?? {}) }
      )
    : null;

  const innerContent = isSplit ? (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap,
        alignItems: "center",
        maxWidth: "100%",
        minWidth: 0,
        ...(padding != null ? { padding } : {}),
      }}
    >
      {mediaSlot === "left" ? (
        <>
          {mediaColumn}
          {contentColumn}
        </>
      ) : (
        <>
          {contentColumn}
          {mediaColumn}
        </>
      )}
    </div>
  ) : resolved != null && resolved.display === "grid" ? (
    <CollectionAtom params={resolved}>
      {slotContent}
      {children}
    </CollectionAtom>
  ) : resolved != null && resolved.direction != null ? (
    <SequenceAtom params={resolved}>
      {slotContent}
      {children}
    </SequenceAtom>
  ) : resolved != null ? (
    <div style={{ ...resolved, width: "100%" }}>
      {slotContent}
      {children}
    </div>
  ) : (
    <>
      {slotContent}
      {children}
    </>
  );

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
        (isCssVar || isLength ? (rawWidth as string).trim() : "var(--container-content)")
      : null;

  const outerStyle: React.CSSProperties =
    rawWidth != null && rawWidth !== "edge-to-edge" && containerVar != null
      ? {
          width: "100%",
          maxWidth: containerVar,
          marginLeft: "auto",
          marginRight: "auto",
          boxSizing: "border-box",
          overflowX: "hidden",
        }
      : {};

  return (
    <div
      data-section-id={id}
      data-section-layout={layoutPresetId ?? undefined}
      data-layout-2
      data-container-width={rawWidth ?? undefined}
      style={Object.keys(outerStyle).length > 0 ? outerStyle : undefined}
    >
      <SurfaceAtom params={surfaceWithVariant}>{innerContent}</SurfaceAtom>
    </div>
  );
}
