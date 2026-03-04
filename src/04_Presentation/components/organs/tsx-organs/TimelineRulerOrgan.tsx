"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-timelineruler";

export function TimelineRulerOrgan({ organId, slots, className }: OrganProps<"timelineRuler">) {
  const s = slots ?? {};
  return (
    <Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>
      {s["timelineRuler.label"]}
    </Section>
  );
}
