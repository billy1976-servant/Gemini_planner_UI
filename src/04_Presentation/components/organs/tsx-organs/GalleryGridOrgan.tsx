"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-gallerygrid";

export function GalleryGridOrgan({ organId, slots, className }: OrganProps<"galleryGrid">) {
  const hasItems = slots["galleryGrid.items"];
  return (
    <Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>
      {slots["galleryGrid.header"]}
      {hasItems ?? slots["galleryGrid.emptyState"]}
    </Section>
  );
}
