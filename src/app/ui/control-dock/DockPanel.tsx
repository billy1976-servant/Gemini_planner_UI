"use client";

import React from "react";
import DockSection from "./DockSection";

type DockPanelProps = {
  panelId: string;
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

export default function DockPanel({
  panelId,
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: DockPanelProps) {
  return (
    <DockSection title={title} icon={icon} isOpen={isOpen} onToggle={onToggle}>
      {children}
    </DockSection>
  );
}
