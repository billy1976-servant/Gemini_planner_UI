"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-timelinelane";

export function TimelineLaneOrgan({ organId, slots, className }: OrganProps<"timelineLane">) {
  const s = slots ?? {};
  return (
    <Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>
      {s["timelineLane.label"]}
      {s["timelineLane.events"]}
    </Section>
  );
}
