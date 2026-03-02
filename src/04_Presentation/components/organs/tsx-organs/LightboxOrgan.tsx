"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-lightbox";

export function LightboxOrgan({ organId, slots, onAction, className }: OrganProps<"lightbox">) {
  return (
    <Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>
      {slots["lightbox.item"]}
      {slots["lightbox.caption"]}
    </Section>
  );
}
