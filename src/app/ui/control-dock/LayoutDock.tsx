"use client";

import React from "react";
import OrganPanel, { type OrganPanelProps } from "@/components/organs/OrganPanel";
import DockSection from "./DockSection";

type LayoutDockProps = {
  isOpen: boolean;
  onToggle: () => void;
} & OrganPanelProps;

/**
 * LayoutDock wraps OrganPanel in a dock-style panel.
 * This integrates OrganPanel into the modern dock UI while keeping all its functionality intact.
 */
export default function LayoutDock({
  isOpen,
  onToggle,
  ...organPanelProps
}: LayoutDockProps) {
  return (
    <DockSection
      title="Layout Controls"
      icon="📊"
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div style={{ padding: 0 }}>
        <OrganPanel {...organPanelProps} />
      </div>
    </DockSection>
  );
}
