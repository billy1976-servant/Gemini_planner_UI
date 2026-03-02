"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-gridlayout";

export function GridLayoutOrgan({ organId, slots, children, className }: OrganProps<"gridLayout"> & { children?: React.ReactNode }) {
  return (
    <Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>
      {slots["gridLayout.title"]}
      {children}
    </Section>
  );
}
