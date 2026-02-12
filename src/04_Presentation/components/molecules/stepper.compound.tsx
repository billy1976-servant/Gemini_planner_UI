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
export type StepperCompoundProps = {
  params?: {
    moleculeLayout?: {
      type: string;
      preset?: string;
      params?: Record<string, any>;
    };
    surface?: any;
    text?: any;
    surfaceActive?: any;
    textActive?: any;
  };
  steps?: Array<{
    content?: {
      label?: string;
    };
    params?: {
      trigger?: any;
      surface?: any;
      text?: any;
    };
    behavior?: any;
    onTap?: () => void;
  }>;
  activeValue?: string;
};


/* ======================================================
   3a) SLOT DECLARATION (ENGINE-VISIBLE)
   ====================================================== */
(StepperCompound as any).slots = {
  step: "steps",
};


/* ======================================================
   4) MOLECULE IMPLEMENTATION
   ====================================================== */
export default function StepperCompound({
  params = {},
  steps = [],
  activeValue,
}: StepperCompoundProps) {
  /* ======================================================
     STEP ITEMS (BUTTON-LIKE, INTERACTIVE)
     ====================================================== */
  const slotContent = (
    <>
      {steps.map((step, i) => {
        const handleTap = () => {
          if (step.onTap) return step.onTap();
          if (!step.behavior) return;
          if (step.behavior.type === "Navigation")
            return window.dispatchEvent(
              new CustomEvent("navigate", { detail: step.behavior.params })
            );
          if (step.behavior.type === "Action")
            return window.dispatchEvent(
              new CustomEvent("action", { detail: step.behavior })
            );
          if (step.behavior.type === "Interaction")
            return window.dispatchEvent(
              new CustomEvent("interaction", { detail: step.behavior })
            );
        };

        // Check if this step is active based on behavior value
        const isActive = activeValue !== undefined && 
          step.behavior?.params?.value === activeValue;

        return (
          <TriggerAtom
            key={i}
            params={step.params?.trigger}
            onTap={handleTap}
          >
            <SurfaceAtom params={resolveParams(
              isActive ? params.surfaceActive : params.surface
            )}>
              <TextAtom params={resolveParams(
                isActive ? params.textActive : params.text
              )}>
                {step.content?.label}
              </TextAtom>
            </SurfaceAtom>
          </TriggerAtom>
        );
      })}
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
    "row" // ← default for Stepper
  );


  let laidOutSteps: React.ReactNode = slotContent;


  if (layout.flow === "grid") {
    laidOutSteps = (
      <CollectionAtom params={layout}>
        {slotContent}
      </CollectionAtom>
    );
  } else if (layout.direction) {
    laidOutSteps = (
      <SequenceAtom params={layout}>
        {slotContent}
      </SequenceAtom>
    );
  }


  /* ======================================================
     FINAL RENDER
     ====================================================== */
  return <>{laidOutSteps}</>;
}

