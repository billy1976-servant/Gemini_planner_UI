"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-widgetcell";

export function WidgetCellOrgan({ organId, slots, className }: OrganProps<"widgetCell">) {
  const s = slots ?? {};
  return (
    <Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>
      {s["widgetCell.content"]}
    </Section>
  );
}
