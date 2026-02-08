"use client";
/* ======================================================
   1) ROLE / INTENT (DO NOT MODIFY)
   ====================================================== */
/**
 * ModalCompound
 *
 * Purpose:
 * - Visual + structural container for modal content
 * - NOT directly interactive (no Trigger, no behavior)
 * - Interaction happens via nested buttons / actions
 *
 * Modal is responsible for:
 * - Surface (backdrop + container)
 * - Layout (stacking / grid if needed)
 * - Typography (title / body)
 */
/* ======================================================
   2) ATOM IMPORTS (UI ONLY)
   ====================================================== */
import { SurfaceAtom, TextAtom, SequenceAtom, CollectionAtom } from "@/components/atoms";
import { resolveParams } from "@/engine/core/palette-resolver";
import { resolveMoleculeLayout } from "@/layout";


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


/* ======================================================
   3) PROPS CONTRACT
   ====================================================== */
export type ModalCompoundProps = {
  params?: {
    surface?: any;
    title?: any;
    body?: any;
    moleculeLayout?: {
      type: string;
      preset?: string;
      params?: Record<string, any>;
    };
  };
  content?: {
    title?: string;
    body?: string;
  };
  children?: React.ReactNode;
};


/* ======================================================
   3a) SLOT DECLARATION (ENGINE-VISIBLE)
   ====================================================== */
(ModalCompound as any).slots = {
  title: "title",
  body: "body",
};


/* ======================================================
   4) MOLECULE IMPLEMENTATION
   ====================================================== */
export default function ModalCompound({
  params = {},
  content = {},
  children,
}: ModalCompoundProps) {
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
    ...(params.layout ?? {}),
    ...(params.moleculeLayout?.params ?? {}),
  };
  const layout = resolveWithDefaultLayout(
    params.moleculeLayout?.type,
    params.moleculeLayout?.preset ?? null,
    layoutParams,
    "column" // ← default for Modal
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
    <SurfaceAtom params={resolveParams(params.surface)}>
      {laidOutSlots}
      {children}
    </SurfaceAtom>
  );
}

