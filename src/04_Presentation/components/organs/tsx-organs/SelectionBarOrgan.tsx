"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-selectionbar";

export function SelectionBarOrgan({ organId, slots, className }: OrganProps<"selectionBar">) {
  return (
    <Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>
      {slots["selectionBar.label"]}
      {slots["selectionBar.actions"]}
    </Section>
  );
}
