"use client";

import React from "react";
import OrganPanel, { type OrganPanelProps } from "@/components/organs/OrganPanel";
import DockSection from "./DockSection";
import AppIcon from "@/04_Presentation/icons/AppIcon";

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
      icon={<AppIcon name="LayoutGrid" size={18} strokeWidth={1.6} />}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div style={{ padding: 0 }}>
        <OrganPanel {...organPanelProps} />
      </div>
    </DockSection>
  );
}
