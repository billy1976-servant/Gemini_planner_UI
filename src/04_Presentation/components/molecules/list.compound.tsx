"use client";
/* ======================================================
   1) CONTRACT (DO NOT MODIFY)
   ====================================================== */
/**
 * Interaction priority:
 * onTap → behavior → no-op
 *
 * List is an interactive container:
 * - Each item is independently interactive
 * - List itself provides layout + surface only
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
export type ListCompoundProps = {
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
    items?: {
      label?: string;
      behavior?: any;
      onTap?: () => void;
    }[];
  };
};


/* ======================================================
   3a) SLOT DECLARATION (ENGINE-VISIBLE)
   ====================================================== */
(ListCompound as any).slots = {
  items: "items",
};


/* ======================================================
   4) MOLECULE IMPLEMENTATION
   ====================================================== */
export default function ListCompound({
  params = {},
  content = {},
}: ListCompoundProps) {
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
      {(content.items || []).map((item, i) => (
        <TriggerAtom
          key={i}
          onTap={() => fire(item.behavior, item.onTap)}
        >
          <TextAtom params={resolveParams(params.item ?? params.text)}>
            {item.label}
          </TextAtom>
        </TriggerAtom>
      ))}
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
    "column" // ← default for List
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

