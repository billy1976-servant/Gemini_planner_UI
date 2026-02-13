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
import { TriggerAtom, SurfaceAtom, MediaAtom, TextAtom, SequenceAtom, CollectionAtom } from "@/components/atoms";
import { resolveParams } from "@/engine/core/palette-resolver";
import { resolveMoleculeLayout } from "@/layout";

// STRICT JSON MODE: If true, NO fallback values allowed. Renderer must obey JSON 100%.
const STRICT_JSON_MODE = true;

function warnDefault(fallbackName: string, value: any, source: string) {
  if (STRICT_JSON_MODE) {
    console.warn(`[STRICT_JSON_MODE] DEFAULT DETECTED: renderer used fallback value "${fallbackName}" = ${JSON.stringify(value)} (source: ${source})`);
  }
}


function resolveWithDefaultLayout(
  flow?: string,
  preset?: string | null,
  params?: Record<string, any>,
  defaultFlow: "row" | "column" | "grid" = "row"
) {
  // STRICT: Log fallback flow
  if (!flow && STRICT_JSON_MODE) {
    warnDefault("moleculeLayout.type", defaultFlow, "card.compound.tsx:resolveWithDefaultLayout");
  }
  return resolveMoleculeLayout(
    flow ?? (STRICT_JSON_MODE ? undefined : defaultFlow),
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
  // STRICT: Only use defaults if not provided in JSON
  const mediaPosition = params?.mediaPosition;
  if (!mediaPosition && STRICT_JSON_MODE) {
    warnDefault("mediaPosition", "top", "card.compound.tsx:90");
  }
  const finalMediaPosition = mediaPosition ?? (STRICT_JSON_MODE ? undefined : "top");
  const rawContentAlign = params?.contentAlign;
  if (!rawContentAlign && STRICT_JSON_MODE) {
    warnDefault("contentAlign", "start", "card.compound.tsx:91");
  }
  const finalRawContentAlign = rawContentAlign ?? (STRICT_JSON_MODE ? undefined : "start");
  // Normalize: "left" → "start", "right" → "end" for layout
  const contentAlign =
    finalRawContentAlign === "left" ? "start"
    : finalRawContentAlign === "right" ? "end"
    : finalRawContentAlign;

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
    ...(typeof (params as Record<string, unknown>).layout === "object" && (params as Record<string, unknown>).layout != null ? (params as Record<string, unknown>).layout as Record<string, unknown> : {}),
    ...(params.moleculeLayout?.params ?? {}),
  };
  // STRICT: Only use gap if explicitly provided in JSON
  const gap = layoutParams.gap as string | undefined;
  if (!gap && STRICT_JSON_MODE) {
    warnDefault("gap", "var(--spacing-4)", "card.compound.tsx:127");
  }
  const finalGap = gap ?? (STRICT_JSON_MODE ? undefined : "var(--spacing-4)");
  const alignItems =
    contentAlign === "center" ? "center" : contentAlign === "end" ? "flex-end" : "flex-start";
  const textAlign =
    contentAlign === "center" ? "center" : contentAlign === "end" ? "right" : "left";

  const media = content?.media;
  const mediaSrc =
    typeof media === "string"
      ? media
      : (media && typeof media === "object"
          ? (media as { url?: string; src?: string; path?: string }).url ||
            (media as { url?: string; src?: string; path?: string }).src ||
            (media as { url?: string; src?: string; path?: string }).path ||
            ""
          : "") ?? "";
  const isPrimaryMedia =
    !!mediaSrc &&
    !mediaSrc.includes("avatar") &&
    !mediaSrc.includes("profile") &&
    !mediaSrc.includes("icon") &&
    !mediaSrc.includes("thumb");
  const hasLayoutMedia = isPrimaryMedia && finalMediaPosition;

  const isHeroMedia =
    (params?.heroMediaFill || params?.variant === "hero-media") && isPrimaryMedia && mediaSrc;
  if (isHeroMedia) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <img
          src={mediaSrc}
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
    );
  }

  const mediaChunk = isPrimaryMedia && mediaSrc ? (
    <MediaAtom
      params={resolveParams(params.media)}
      src={mediaSrc}
    />
  ) : null;

  // STRICT: Log hard-coded text chunk styles
  if (STRICT_JSON_MODE) {
    warnDefault("display", "flex", "card.compound.tsx:179");
    warnDefault("flexDirection", "column", "card.compound.tsx:179");
    warnDefault("gap", "var(--spacing-2)", "card.compound.tsx:179");
    warnDefault("minWidth", 0, "card.compound.tsx:179");
  }
  const textChunk = (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)", textAlign, minWidth: 0 }}>
      {!isPrimaryMedia && mediaSrc && (
        <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
          <MediaAtom src={mediaSrc} params={{ aspectRatio: "1", radius: "999px" }} />
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

  const isRow = hasLayoutMedia && (finalMediaPosition === "left" || finalMediaPosition === "right");
  const firstChunk = hasLayoutMedia && (finalMediaPosition === "bottom" || finalMediaPosition === "right") ? textChunk : mediaChunk;
  const secondChunk = hasLayoutMedia && (finalMediaPosition === "bottom" || finalMediaPosition === "right") ? mediaChunk : textChunk;

  // STRICT: Log hard-coded slot content styles
  if (STRICT_JSON_MODE && mediaChunk) {
    warnDefault("display", "flex", "card.compound.tsx:207");
    warnDefault("width", "100%", "card.compound.tsx:212");
  }
  const slotContent =
    !mediaChunk ? (
      textChunk
    ) : (
      <div
        style={{
          display: "flex",
          flexDirection: isRow ? "row" : "column",
          gap: finalGap,
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
      <CollectionAtom params={{ ...layout, gap: finalGap }}>
        {slotContent}
      </CollectionAtom>
    );
  } else if (layout.direction) {
    laidOutSlots = (
      <SequenceAtom params={{ ...layout, gap: finalGap }}>
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


