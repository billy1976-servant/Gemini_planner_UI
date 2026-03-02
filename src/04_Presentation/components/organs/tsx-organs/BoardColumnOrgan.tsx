"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-boardcolumn";

export function BoardColumnOrgan({ organId, slots, className }: OrganProps<"boardColumn">) {
  return (
    <Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>
      {slots["boardColumn.header"]}
      {slots["boardColumn.cards"]}
      {slots["boardColumn.footer"]}
    </Section>
  );
}
