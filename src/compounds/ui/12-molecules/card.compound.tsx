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
        <TextAtom params={resolveParams(params.title)}>
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
     Definition/preset layout (gap, padding) merged so spacing tokens apply.
     ====================================================== */
  const layoutParams = {
    ...(params.layout ?? {}),
    ...(params.moleculeLayout?.params ?? {}),
  };
  const layout = resolveWithDefaultLayout(
    params.moleculeLayout?.type,
    params.moleculeLayout?.preset ?? null,
    layoutParams,
    "column" // default for Card
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


