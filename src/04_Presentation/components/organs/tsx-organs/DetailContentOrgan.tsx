"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-detailcontent";

export function DetailContentOrgan({ organId, slots, className }: OrganProps<"detailContent">) {
  const hasBody = slots["detailContent.body"];
  return (
    <Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>
      {hasBody ?? slots["detailContent.emptyState"]}
    </Section>
  );
}
