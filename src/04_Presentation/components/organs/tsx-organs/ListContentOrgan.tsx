"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-listcontent";

export function ListContentOrgan({ organId, slots, className }: OrganProps<"listContent">) {
  const s = slots ?? {};
  const hasItems = s["listContent.items"];
  return (
    <Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>
      {s["listContent.header"]}
      {hasItems ?? s["listContent.emptyState"]}
    </Section>
  );
}
