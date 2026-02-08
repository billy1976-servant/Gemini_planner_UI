"use client";
/* ======================================================
   1) ROLE / INTENT (DO NOT MODIFY)
   ====================================================== */
/**
 * FieldCompound
 *
 * Purpose:
 * - Structural + visual container ONLY
 * - MUST NOT create, replace, or normalize params
 * - MUST pass params straight through to FieldAtom
 *
 * Guarantees:
 * - Stable field identity
 * - No style mutation
 * - No layout logic leakage
 */
/* ======================================================
   2) ATOM IMPORTS (UI ONLY)
   ====================================================== */
import { SurfaceAtom, FieldAtom, TextAtom, SequenceAtom, CollectionAtom } from "@/components/atoms";
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
   3) PROPS CONTRACT (MATCHES CARD TEMPLATE)
   ====================================================== */
export type FieldCompoundProps = {
  id?: string;
  state?: any;
  params?: {
    surface?: any;
    label?: any;
    field?: any; // ⚠️ MUST PASS THROUGH UNTOUCHED
    error?: any;
    moleculeLayout?: {
      type: string;
      preset?: string;
      params?: Record<string, any>;
    };
  };
  content?: {
    label?: string;
    error?: string;
  };
  children?: React.ReactNode;
};


/* ======================================================
   3a) SLOT DECLARATION (ENGINE-VISIBLE)
   ====================================================== */
(FieldCompound as any).slots = {
  label: "label",
  field: "field",
  error: "error",
};


/* ======================================================
   4) MOLECULE IMPLEMENTATION
   ====================================================== */
export default function FieldCompound(props: FieldCompoundProps) {
  const { params = {}, content = {}, children } = props;


  /* --------------------------------------------------
     STABLE FIELD IDENTITY (LOCKED BEHAVIOR)
     -------------------------------------------------- */
  const stableFieldKey =
    typeof props?.state?.key === "string" && props.state.key.length > 0
      ? props.state.key
      : typeof props?.id === "string" && props.id.length > 0
      ? props.id
      : undefined;


  // ⚠️ MUTATE-IN-PLACE ONLY (NO PARAM REBUILD)
  if (stableFieldKey) {
    if (!params.field) params.field = {};
    if (params.field.fieldKey === undefined) {
      params.field.fieldKey = stableFieldKey;
    }
  }


  /* ======================================================
     INTERNAL SLOT CONTENT (PURE, STATE-SAFE)
     ====================================================== */
  const slotContent = (
    <>
      {content.label && (
        <TextAtom params={resolveParams(params.label)}>
          {content.label}
        </TextAtom>
      )}
      <FieldAtom params={params.field}>{children ?? null}</FieldAtom>
      {content.error && (
        <TextAtom params={resolveParams(params.error ?? (params as Record<string, unknown>).errorStyle)}>
          {content.error}
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
    "row" // ← default for Field
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
    <SurfaceAtom params={resolveParams(params.surface)}>
      {laidOutSlots}
    </SurfaceAtom>
  );
}

