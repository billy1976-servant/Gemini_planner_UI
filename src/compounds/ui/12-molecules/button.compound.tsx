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
import { resolveMoleculeLayout } from "@/lib/layout/molecule-layout-resolver";


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
export type ButtonCompoundProps = {
  params?: {
    trigger?: any;
    surface?: any;          // clickable button surface
    label?: any;            // label text inside button
    supportingText?: any;   // optional text outside button
    moleculeLayout?: {
      type: string;
      preset?: string;
      params?: Record<string, any>;
    };
  };
  content?: {
    label?: string;
    supportingText?: string;
  };
  behavior?: any;
  onTap?: () => void;
  children?: React.ReactNode;
};


/* ======================================================
   3a) SLOT DECLARATION (ENGINE-VISIBLE)
   ====================================================== */
(ButtonCompound as any).slots = {
  label: "label",
  supportingText: "supportingText",
};


/* ======================================================
   4) MOLECULE IMPLEMENTATION
   ====================================================== */
export default function ButtonCompound({
  params = {},
  content = {},
  behavior,
  onTap,
  children,
}: ButtonCompoundProps) {
  const handleTap = () => {
    if (onTap) return onTap();
    if (!behavior) return;
    if (behavior.type === "Navigation") {
      const destination = behavior.params?.to ?? behavior.params?.screenId;
      return window.dispatchEvent(
        new CustomEvent("navigate", { detail: { to: destination } })
      );
    }
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
     INTERNAL SLOT CONTENT (PURE, STATE-SAFE)
     ====================================================== */
  const slotContent = (
    <>
      <TriggerAtom params={params.trigger} onTap={handleTap}>
        <SurfaceAtom params={resolveParams(params.surface)}>
          <TextAtom params={resolveParams(params.label ?? params.text)}>
            {content.label}
          </TextAtom>
        </SurfaceAtom>
      </TriggerAtom>
      {content.supportingText && (
        <TextAtom params={resolveParams(params.supportingText)}>
          {content.supportingText}
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
    "row" // ← default for this molecule
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
    <>
      {laidOutSlots}
      {children}
    </>
  );
}

