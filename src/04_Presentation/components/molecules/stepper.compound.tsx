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
import { useState, useEffect } from "react";


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

/**
 * Hook to detect mobile viewport width for responsive tab sizing.
 * Returns true if viewport is phone-sized (≤420px).
 */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 420);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

/**
 * Apply mobile-optimized params for tab components on narrow screens.
 * Reduces padding and text size to fit more tabs in constrained width.
 */
function applyMobileTabOptimization(params: any, isMobile: boolean) {
  if (!isMobile) return params;
  
  const mobileSurface = {
    ...params.surface,
  };

  const mobileSurfaceActive = {
    ...params.surfaceActive,
  };

  const mobileText = {
    ...params.text,
    size: "textSize.sm", // 14px instead of 16px
  };
  
  const mobileTextActive = {
    ...params.textActive,
    size: "textSize.sm",
  };
  
  return {
    ...params,
    surface: mobileSurface,
    surfaceActive: mobileSurfaceActive,
    text: mobileText,
    textActive: mobileTextActive,
  };
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
     RESPONSIVE MOBILE OPTIMIZATION
     ====================================================== */
  const isMobile = useIsMobile();
  const responsiveParams = applyMobileTabOptimization(params, isMobile);
  
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
              isActive ? responsiveParams.surfaceActive : responsiveParams.surface
            )}>
              <TextAtom params={resolveParams(
                isActive ? responsiveParams.textActive : responsiveParams.text
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
    ...(typeof (responsiveParams as Record<string, unknown>).layout === "object" && (responsiveParams as Record<string, unknown>).layout != null ? (responsiveParams as Record<string, unknown>).layout as Record<string, unknown> : {}),
    ...(responsiveParams.moleculeLayout?.params ?? {}),
  };
  const layout = resolveWithDefaultLayout(
    responsiveParams.moleculeLayout?.type,
    responsiveParams.moleculeLayout?.preset ?? null,
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

