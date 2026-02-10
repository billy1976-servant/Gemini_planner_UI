/**
 * Right Sidebar Control Dock — Photoshop-style collapsible panel.
 * Accordion sections: Mode, Palette, Template, Styling Preset, Behavior Profile, Layout.
 * Uses existing engine/store for selection state; UI only.
 */

"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import "@/editor/editor-theme.css";
import { useDockState } from "./dock-state";
import type { DockPanelId } from "./dock-state";
import RightSidebarDockContent from "./RightSidebarDockContent";
import { getState, subscribeState, dispatchState } from "@/state/state-store";
import { getPaletteName, setPalette, subscribePalette } from "@/engine/core/palette-store";
import { palettes } from "@/palettes";
import { getTemplateList } from "@/lib/layout/template-profiles";

const PALETTE_NAMES = Object.keys(palettes) as string[];

export type RightSidebarDockProps = {
  /** Optional: Layout section content (e.g. OrganPanel) */
  layoutPanelContent?: React.ReactNode;
};

export default function RightSidebarDock({ layoutPanelContent }: RightSidebarDockProps) {
  const { openPanel, togglePanel } = useDockState();
  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  useSyncExternalStore(subscribePalette, getPaletteName, () => "default");

  const experience = (stateSnapshot?.values?.experience ?? "website") as string;
  const layoutMode = (stateSnapshot?.values?.layoutMode ?? "template") as string;
  const templateId = (stateSnapshot?.values?.templateId ?? "") as string;
  const paletteName = (stateSnapshot?.values?.paletteName ?? getPaletteName()) || "default";
  const stylingPreset = (stateSnapshot?.values?.stylingPreset ?? "default") as string;
  const behaviorProfile = (stateSnapshot?.values?.behaviorProfile ?? "default") as string;

  const templateList = getTemplateList();

  const setValue = (key: string, value: string) => {
    dispatchState("state.update", { key, value });
  };

  const handlePaletteChange = (name: string) => {
    if (!(name in palettes)) return;
    setValue("paletteName", name);
    setPalette(name);
  };

  const isPanelOpen = (id: DockPanelId) => openPanel === id;
  const setPanelOpen = (id: DockPanelId) => togglePanel(id);

  const dockWidth = openPanel ? 328 : 48;

  return React.createElement(
    "div",
    {
      style: {
        width: dockWidth,
        minWidth: 48,
        flexShrink: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        overflow: "hidden",
      },
    },
    React.createElement(RightSidebarDockContent, {
    experience,
    layoutMode,
    templateId,
    paletteName,
    stylingPreset,
    behaviorProfile,
    templateList,
    isPanelOpen,
    setPanelOpen,
    setValue,
    handlePaletteChange,
    layoutPanelContent,
    paletteNames: PALETTE_NAMES,
  })
  );
}
