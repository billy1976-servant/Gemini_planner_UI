"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-paginationbar";

export function PaginationBarOrgan({ organId, slots, onAction, className }: OrganProps<"paginationBar">) {
  const s = slots ?? {};
  return (
    <Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>
      {s["paginationBar.label"]}
      {s["paginationBar.extra"]}
    </Section>
  );
}
