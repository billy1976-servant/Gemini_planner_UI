"use client";
/* ======================================================
   1) CONTRACT (DO NOT MODIFY)
   ====================================================== */
/**
 * Interaction priority:
 * onTap → behavior → no-op
 *
 * Cards MAY be interactive or presentational.
 */
/* ======================================================
   2) ATOM IMPORTS (UI + INTERACTION)
   ====================================================== */
import TriggerAtom from "@/components/9-atoms/primitives/trigger";
import SurfaceAtom from "@/components/9-atoms/primitives/surface";
import MediaAtom from "@/components/9-atoms/primitives/media";
import TextAtom from "@/components/9-atoms/primitives/text";
import SequenceAtom from "@/components/9-atoms/primitives/sequence";
import CollectionAtom from "@/components/9-atoms/primitives/collection";
import { resolveParams } from "@/engine/core/palette-resolver";
import { resolveMoleculeLayout } from "@/layout/molecule-layout-resolver";


function resolveWithDefaultLayout(
  flow?: string,
  preset?: string | null,
  params?: Record<string, any>,
  defaultFlow: "row" | "column" | "grid" = "row"
) {
  return resolveMoleculeLayout(
    flow ?? defaultFlow,
    preset ?? null,
    params
  );
}


/* ======================================================
   3) PROPS CONTRACT
   ====================================================== */
export type CardCompoundProps = {
  params?: {
    trigger?: any;
    surface?: any;
    media?: any;
    title?: any;
    body?: any;
    /** Definition/preset layout (gap, padding) — merged with moleculeLayout.params for inner layout */
    layout?: { gap?: any; padding?: any; [k: string]: any };
    moleculeLayout?: {
      type: string;
      preset?: string;
      params?: Record<string, any>;
    };
    /** Where media appears: top (default), left, right, bottom */
    mediaPosition?: "top" | "left" | "right" | "bottom";
    /** Alignment of slot content: start/left (default), center, end/right */
    contentAlign?: "start" | "center" | "end" | "left" | "right";
    /** Hero split: render only media filling container, no card surface (set by SectionCompound). */
    heroMediaFill?: boolean;
    /** Declarative hero media: render only image, no surface/padding/radius/shadow (e.g. hero split column). */
    variant?: "hero-media" | string;
  };
  content?: {
    media?: string;   // ← FIXED (was image)
    title?: string;
    body?: string;
  };
  behavior?: any;
  onTap?: () => void;
  children?: React.ReactNode;
};


/* ======================================================
   3a) SLOT DECLARATION (ENGINE-VISIBLE)
   ====================================================== */
(CardCompound as any).slots = {
  media: "media",     // ← FIXED
  title: "title",
  body: "body",
};


/* ======================================================
   4) MOLECULE IMPLEMENTATION
   ====================================================== */
export default function CardCompound({
  params = {},
  content = {},
  behavior,
  onTap,
  children,
}: CardCompoundProps) {
  const mediaPosition = params?.mediaPosition ?? "top";
  const rawContentAlign = params?.contentAlign ?? "start";
  // Normalize: "left" → "start", "right" → "end" for layout
  const contentAlign =
    rawContentAlign === "left" ? "start"
    : rawContentAlign === "right" ? "end"
    : rawContentAlign;

  const handleTap = () => {
    if (onTap) return onTap();
    if (!behavior) return;
    if (behavior.type === "Navigation") {
      window.dispatchEvent(
        new CustomEvent("navigate", { detail: behavior.params })
      );
    }
    if (behavior.type === "Action") {
      window.dispatchEvent(
        new CustomEvent("action", { detail: behavior })
      );
    }
    if (behavior.type === "Interaction") {
      window.dispatchEvent(
        new CustomEvent("interaction", { detail: behavior })
      );
    }
  };


  /* ======================================================
     INTERNAL SLOT CONTENT (PURE, STATE-SAFE)
     mediaPosition and contentAlign drive layout; moleculeLayout supplies gap/padding.
     ====================================================== */
  const layoutParams = {
    ...(params.layout ?? {}),
    ...(params.moleculeLayout?.params ?? {}),
  };
  const gap = layoutParams.gap ?? "var(--spacing-4)";
  const alignItems =
    contentAlign === "center" ? "center" : contentAlign === "end" ? "flex-end" : "flex-start";
  const textAlign =
    contentAlign === "center" ? "center" : contentAlign === "end" ? "right" : "left";

  const media = content?.media;
  const isPrimaryMedia =
    typeof media === "string" &&
    !media.includes("avatar") &&
    !media.includes("profile") &&
    !media.includes("icon") &&
    !media.includes("thumb");
  const hasLayoutMedia = isPrimaryMedia && mediaPosition;

  const isHeroMedia =
    (params?.heroMediaFill || params?.variant === "hero-media") && isPrimaryMedia && media;
  if (isHeroMedia) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <img
          src={media}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
    );
  }

  const mediaChunk = isPrimaryMedia && media ? (
    <MediaAtom
      params={resolveParams(params.media)}
      src={media}
    />
  ) : null;

  const textChunk = (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)", textAlign, minWidth: 0 }}>
      {!isPrimaryMedia && media && (
        <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
          <MediaAtom src={media} params={{ aspectRatio: "1", radius: "999px" }} />
        </div>
      )}
      {content.title && (
        <TextAtom params={resolveParams(params.title)}>
          {content.title}
        </TextAtom>
      )}
      {content.body && (
        <TextAtom params={resolveParams(params.body)}>
          {content.body}
        </TextAtom>
      )}
    </div>
  );

  const isRow = hasLayoutMedia && (mediaPosition === "left" || mediaPosition === "right");
  const firstChunk = hasLayoutMedia && (mediaPosition === "bottom" || mediaPosition === "right") ? textChunk : mediaChunk;
  const secondChunk = hasLayoutMedia && (mediaPosition === "bottom" || mediaPosition === "right") ? mediaChunk : textChunk;

  const slotContent =
    !mediaChunk ? (
      textChunk
    ) : (
      <div
        style={{
          display: "flex",
          flexDirection: isRow ? "row" : "column",
          gap,
          alignItems: isRow ? "center" : alignItems,
          width: "100%",
        }}
      >
        {firstChunk}
        {secondChunk}
      </div>
    );

  const layout = resolveWithDefaultLayout(
    params.moleculeLayout?.type,
    params.moleculeLayout?.preset ?? null,
    layoutParams,
    "column"
  );

  let laidOutSlots: React.ReactNode = slotContent;

  if (mediaChunk) {
    laidOutSlots = slotContent;
  } else if (layout.flow === "grid") {
    laidOutSlots = (
      <CollectionAtom params={{ ...layout, gap }}>
        {slotContent}
      </CollectionAtom>
    );
  } else if (layout.direction) {
    laidOutSlots = (
      <SequenceAtom params={{ ...layout, gap }}>
        {slotContent}
      </SequenceAtom>
    );
  }


  /* ======================================================
     FINAL RENDER
     ====================================================== */
  return (
    <TriggerAtom
      params={params.trigger}
      onTap={onTap || behavior ? handleTap : undefined}
    >
      <SurfaceAtom params={resolveParams(params.surface)}>
        {laidOutSlots}
        {children}
      </SurfaceAtom>
    </TriggerAtom>
  );
}


