"use client";
/* ======================================================
   1) CONTRACT (DO NOT MODIFY)
   ====================================================== */
/**
 * Interaction priority:
 * onTap → behavior → no-op
 *
 * Footer IS interactive, but delegates interaction
 * to its child items (left / right).
 */
/* ======================================================
   2) ATOM IMPORTS (UI + INTERACTION)
   ====================================================== */
import { TriggerAtom, SurfaceAtom, TextAtom, SequenceAtom, CollectionAtom } from "@/components/atoms";
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
export type FooterCompoundProps = {
  params?: {
    surface?: any;
    item?: any;
    moleculeLayout?: {
      type: string;
      preset?: string;
      params?: Record<string, any>;
    };
  };
  content?: {
    left?: {
      label?: string;
      behavior?: any;
      onTap?: () => void;
    };
    right?: {
      label?: string;
      behavior?: any;
      onTap?: () => void;
    };
  };
};


/* ======================================================
   3a) SLOT DECLARATION (ENGINE-VISIBLE)
   ====================================================== */
(FooterCompound as any).slots = {
  left: "left",
  right: "right",
};


/* ======================================================
   4) MOLECULE IMPLEMENTATION
   ====================================================== */
export default function FooterCompound({
  params = {},
  content = {},
}: FooterCompoundProps) {
  const fire = (behavior: any, onTap?: () => void) => {
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
     INTERNAL SLOT CONTENT (PURE)
     ====================================================== */
  const slotContent = (
    <>
      {content.left && (
        <TriggerAtom
          onTap={() => fire(content.left?.behavior, content.left?.onTap)}
        >
          <TextAtom params={resolveParams(params.item ?? params.link ?? params.copyright)}>
            {content.left.label}
          </TextAtom>
        </TriggerAtom>
      )}
      {content.right && (
        <TriggerAtom
          onTap={() => fire(content.right?.behavior, content.right?.onTap)}
        >
          <TextAtom params={resolveParams(params.item ?? params.link ?? params.copyright)}>
            {content.right.label}
          </TextAtom>
        </TriggerAtom>
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
    "row" // ← default for Footer
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
    </SurfaceAtom>
  );
}

