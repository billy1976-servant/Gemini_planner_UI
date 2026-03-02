"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-filterbar";

export function FilterBarOrgan({ organId, slots, onAction, className }: OrganProps<"filterBar">) {
  return (
    <Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>
      {slots["filterBar.controls"]}
    </Section>
  );
}
