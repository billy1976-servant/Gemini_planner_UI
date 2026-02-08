"use client";
/* ======================================================
   1) CONTRACT (DO NOT MODIFY)
   ====================================================== */
/**
 * Interaction priority:
 * onTap → behavior → no-op
 *
 * Chips are ALWAYS interactive.
 */
/* ======================================================
   2) ATOM IMPORTS (UI + INTERACTION)
   ====================================================== */
import { TriggerAtom, SurfaceAtom, TextAtom, MediaAtom, SequenceAtom, CollectionAtom } from "@/components/atoms";
import { resolveParams } from "@/engine/core/palette-resolver";
import { resolveMoleculeLayout } from "@/layout";


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
export type ChipCompoundProps = {
  params?: {
    trigger?: any;
    surface?: any;
    text?: any;
    body?: any;
    media?: any;
    moleculeLayout?: {
      type: string;
      preset?: string;
      params?: Record<string, any>;
    };
  };
  content?: {
    title?: string;
    body?: string;
    media?: string;
  };
  behavior?: any;
  onTap?: () => void;
  children?: React.ReactNode;
};


/* ======================================================
   3a) SLOT DECLARATION (ENGINE-VISIBLE)
   ====================================================== */
(ChipCompound as any).slots = {
  title: "text",
  body: "body",
  media: "media",
};


/* ======================================================
   4) MOLECULE IMPLEMENTATION
   ====================================================== */
export default function ChipCompound({
  params = {},
  content = {},
  behavior,
  onTap,
  children,
}: ChipCompoundProps) {
  /* ----------------------------------------------
     INTERACTION HANDLER (LOCKED PATTERN)
     ---------------------------------------------- */
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
     ====================================================== */
  const slotContent = (
    <>
      {content.media && (
        <MediaAtom
          params={resolveParams(params.media)}
          src={content.media}
        />
      )}
      {content.title && (
        <TextAtom params={resolveParams(params.text)}>
          {content.title}
        </TextAtom>
      )}
      {content.body && (
        <TextAtom params={resolveParams(params.body)}>
          {content.body}
        </TextAtom>
      )}
    </>
  );


  /* ======================================================
     APPLY MOLECULE LAYOUT *ONLY TO SLOT CONTENT*
     ====================================================== */
  const layoutParams = {
    ...(typeof (params as Record<string, unknown>).layout === "object" && (params as Record<string, unknown>).layout != null ? (params as Record<string, unknown>).layout as Record<string, unknown> : {}),
    ...(params.moleculeLayout?.params ?? {}),
  };
  const layout = resolveWithDefaultLayout(
    params.moleculeLayout?.type,
    params.moleculeLayout?.preset ?? null,
    layoutParams,
    "row" // default for Chip
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
     FINAL RENDER (MATCHES CARD / AVATAR TEMPLATE)
     ====================================================== */
  return (
    <TriggerAtom params={params.trigger} onTap={handleTap}>
      <SurfaceAtom params={resolveParams(params.surface)}>
        {laidOutSlots}
        {children}
      </SurfaceAtom>
    </TriggerAtom>
  );
}


