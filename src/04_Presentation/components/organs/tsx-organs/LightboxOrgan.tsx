"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-lightbox";

export function LightboxOrgan({ organId, slots, onAction, className }: OrganProps<"lightbox">) {
  const s = slots ?? {};
  return (
    <Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>
      {s["lightbox.item"]}
      {s["lightbox.caption"]}
    </Section>
  );
}
