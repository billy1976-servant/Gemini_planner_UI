"use client";
/* ======================================================
   1) CONTRACT (DO NOT MODIFY)
   ====================================================== */
/**
 * Interaction priority:
 * onTap → behavior → no-op
 *
 * REQUIRED for all interactive molecules.
 */
/* ======================================================
   2) ATOM IMPORTS (UI + INTERACTION)
   ====================================================== */
import TriggerAtom from "@/components/9-atoms/primitives/trigger";
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
export type ToastCompoundProps = {
  params?: {
    trigger?: any;
    surface?: any;
    text?: any;
    moleculeLayout?: {
      type: string;
      preset?: string;
      params?: Record<string, any>;
    };
  };
  content?: {
    message?: string;
  };
  behavior?: any;
  onTap?: () => void;
};


/* ======================================================
   3a) SLOT DECLARATION (ENGINE-VISIBLE)
   ====================================================== */
(ToastCompound as any).slots = {
  message: "text",
};


/* ======================================================
   4) MOLECULE IMPLEMENTATION
   ====================================================== */
export default function ToastCompound({
  params = {},
  content = {},
  behavior,
  onTap,
}: ToastCompoundProps) {
  /* ======================================================
     INTERACTION HANDLER (LOCKED PATTERN)
     ====================================================== */
  const handleTap = () => {
    if (onTap) return onTap();
    if (!behavior) return;
    if (behavior.type === "Navigation")
      return window.dispatchEvent(
        new CustomEvent("navigate", { detail: behavior.params })
      );
    if (behavior.type === "Action")
      return window.dispatchEvent(
        new CustomEvent("action", { detail: behavior })
      );
    if (behavior.type === "Interaction")
      return window.dispatchEvent(
        new CustomEvent("interaction", { detail: behavior })
      );
  };


  /* ======================================================
     SLOT CONTENT (PURE)
     ====================================================== */
  const slotContent = (
    <TextAtom params={resolveParams(params.text)}>
      {content.message}
    </TextAtom>
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
    "row" // ← default for Toast
  );


  let laidOutContent: React.ReactNode = slotContent;


  if (layout.flow === "grid") {
    laidOutContent = (
      <CollectionAtom params={layout}>
        {slotContent}
      </CollectionAtom>
    );
  } else if (layout.direction) {
    laidOutContent = (
      <SequenceAtom params={layout}>
        {slotContent}
      </SequenceAtom>
    );
  }


  /* ======================================================
     FINAL RENDER
     ====================================================== */
  return (
    <TriggerAtom params={params.trigger} onTap={handleTap}>
      <SurfaceAtom params={resolveParams(params.surface)}>
        {laidOutContent}
      </SurfaceAtom>
    </TriggerAtom>
  );
}

