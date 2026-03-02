"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-columnstrip";

export function ColumnStripOrgan({
  organId,
  slots,
  children,
  className,
}: OrganProps<"columnStrip"> & { children?: React.ReactNode }) {
  return (
    <Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>
      {slots["columnStrip.title"]}
      {children}
    </Section>
  );
}
