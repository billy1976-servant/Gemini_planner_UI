"use client";
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


/* ======================================================
   3) PROPS CONTRACT
   ====================================================== */
export type SectionCompoundProps = {
  params?: {
    surface?: any;
    title?: any;
    /** Template-driven: contained (max-width), edge-to-edge (full bleed), narrow (reading column) */
    containerWidth?: "contained" | "edge-to-edge" | "narrow";
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
  params = {},
  content = {},
  children,
}: SectionCompoundProps) {
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
     APPLY MOLECULE LAYOUT *ONLY TO SLOT CONTENT*
     ====================================================== */
  const layout = resolveWithDefaultLayout(
    params.moleculeLayout?.type,
    params.moleculeLayout?.preset ?? null,
    params.moleculeLayout?.params,
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
     FINAL RENDER — optional container width from template
     ====================================================== */
  const surfaceContent = (
    <SurfaceAtom params={resolveParams(params.surface)}>
      {laidOutSlots}
      {children}
    </SurfaceAtom>
  );

  const containerWidth = params.containerWidth;
  if (containerWidth === "contained") {
    return (
      <div style={{ width: "100%", maxWidth: "var(--container-xl, 1200px)", marginLeft: "auto", marginRight: "auto" }}>
        {surfaceContent}
      </div>
    );
  }
  if (containerWidth === "narrow") {
    return (
      <div style={{ width: "100%", maxWidth: "var(--container-md, 768px)", marginLeft: "auto", marginRight: "auto" }}>
        {surfaceContent}
      </div>
    );
  }
  return surfaceContent;
}

