"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-modal";

export function ModalOrgan({ organId, slots, onAction, className }: OrganProps<"modal">) {
  return (
    <Section
      id={organId}
      role={LAYOUT_ID}
      layout={LAYOUT_ID}
      params={{ internalLayoutId: LAYOUT_ID }}
    >
      {slots["modal.title"]}
      {slots["modal.content"]}
    </Section>
  );
}
