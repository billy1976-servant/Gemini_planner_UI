"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-detailcontent";

export function DetailContentOrgan({ organId, slots, className }: OrganProps<"detailContent">) {
  const s = slots ?? {};
  const hasBody = s["detailContent.body"];
  return (
    <Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>
      {hasBody ?? s["detailContent.emptyState"]}
    </Section>
  );
}
