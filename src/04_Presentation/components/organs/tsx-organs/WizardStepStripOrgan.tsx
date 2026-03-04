"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-wizardstepstrip";

export function WizardStepStripOrgan({ organId, slots, className }: OrganProps<"wizardStepStrip">) {
  const s = slots ?? {};
  return (
    <Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>
      {s["wizardStepStrip.steps"]}
      {s["wizardStepStrip.nav"]}
    </Section>
  );
}
