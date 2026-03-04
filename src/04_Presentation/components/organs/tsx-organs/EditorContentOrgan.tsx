"use client";

import React from "react";
import type { OrganProps } from "./types";
import Section from "@/components/molecules/section.compound";

const LAYOUT_ID = "organ-editorcontent";

export function EditorContentOrgan({ organId, slots, className }: OrganProps<"editorContent">) {
  const s = slots ?? {};
  return (
    <Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>
      {s["editorContent.toolbar"]}
      {s["editorContent.body"]}
    </Section>
  );
}
