"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-timelinelanestrip";

export function TimelineLaneStripOrgan({
  organId,
  slots,
  children,
  className,
}: OrganProps<"timelineLaneStrip"> & { children?: React.ReactNode }) {
  return (
    <Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>
      {slots["timelineLaneStrip.title"]}
      {children}
    </Section>
  );
}
