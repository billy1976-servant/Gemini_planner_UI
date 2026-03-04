"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-splitpane";

export function SplitPaneOrgan({ organId, slots, className }: OrganProps<"splitPane">) {
  const s = slots ?? {};
  return (
    <Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>
      {s["splitPane.primary"]}
      {s["splitPane.secondary"]}
    </Section>
  );
}
