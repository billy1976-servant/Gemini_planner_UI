"use client";

import React, { useLayoutEffect } from "react";
import { useSearchParams } from "next/navigation";
import { dispatchState } from "@/state/state-store";
import ContainerCreationsLanding from "@/01_App/(live) Business/Container_Creations/ContainerCreationsLanding";
import { TSXScreenWithEnvelope } from "@/lib/tsx-structure/TSXScreenWithEnvelope";
import "@/app/landing/landing-theme.css";

const SCREEN_PATH = "(live) Business/Container_Creations/ContainerCreationsLanding";

/** Map /flow?step= to landingStep: fit → 1 (stamped), skylight → 2, intro → 0 */
const STEP_TO_LANDING: Record<string, number> = {
  fit: 1,
  skylight: 2,
  intro: 0,
};

export default function FlowPage() {
  const searchParams = useSearchParams();
  const step = searchParams.get("step") ?? "fit";

  useLayoutEffect(() => {
    const landingStep = STEP_TO_LANDING[step] ?? 1;
    dispatchState("state.update", { key: "landingStep", value: landingStep });
  }, [step]);

  return (
    <div className="landing-container-creations" data-landing="flow">
      <TSXScreenWithEnvelope screenPath={SCREEN_PATH} Component={ContainerCreationsLanding} />
    </div>
  );
}
