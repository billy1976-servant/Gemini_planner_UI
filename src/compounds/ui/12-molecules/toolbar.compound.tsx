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
export type ToolbarCompoundProps = {
  params?: {
    surface?: any; // toolbar container styling
    item?: {
      trigger?: any;
      text?: any;
    };
    moleculeLayout?: {
      type: string;
      preset?: string;
      params?: Record<string, any>;
    };
  };
  content?: {
    actions?: {
      label?: string;
      behavior?: any;
      onTap?: () => void;
    }[];
  };
};


/* ======================================================
   3a) SLOT DECLARATION (ENGINE-VISIBLE)
   ====================================================== */
(ToolbarCompound as any).slots = {
  actions: "item",
};


/* ======================================================
   4) MOLECULE IMPLEMENTATION
   ====================================================== */
export default function ToolbarCompound({
  params = {},
  content = {},
}: ToolbarCompoundProps) {
  /* ======================================================
     ITEM RENDERER (PURE)
     ====================================================== */
  const items = (content.actions || []).map((action, i) => {
    const handleTap = () => {
      if (action.onTap) return action.onTap();
      if (!action.behavior) return;
      if (action.behavior.type === "Navigation")
        return window.dispatchEvent(
          new CustomEvent("navigate", { detail: action.behavior.params })
        );
      if (action.behavior.type === "Action")
        return window.dispatchEvent(
          new CustomEvent("action", { detail: action.behavior })
        );
      if (action.behavior.type === "Interaction")
        return window.dispatchEvent(
          new CustomEvent("interaction", { detail: action.behavior })
        );
    };


    return (
      <TriggerAtom
        key={i}
        params={params.item?.trigger}
        onTap={handleTap}
      >
        <TextAtom params={params.item?.text}>
          {action.label}
        </TextAtom>
      </TriggerAtom>
    );
  });


  /* ======================================================
     APPLY MOLECULE LAYOUT *ONLY TO ITEMS*
     ====================================================== */
  const layout = resolveWithDefaultLayout(
    params.moleculeLayout?.type,
    params.moleculeLayout?.preset ?? null,
    params.moleculeLayout?.params,
    "row" // ← default for Toolbar
  );


  let laidOutItems: React.ReactNode = items;


  if (layout.flow === "grid") {
    laidOutItems = (
      <CollectionAtom params={layout}>
        {items}
      </CollectionAtom>
    );
  } else if (layout.direction) {
    laidOutItems = (
      <SequenceAtom params={layout}>
        {items}
      </SequenceAtom>
    );
  }


  /* ======================================================
     FINAL RENDER
     ====================================================== */
  return (
    <SurfaceAtom params={resolveParams(params.surface)}>
      {laidOutItems}
    </SurfaceAtom>
  );
}

