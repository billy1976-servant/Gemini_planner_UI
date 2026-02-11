/**
 * Right Sidebar Control Dock — Photoshop-style collapsible panel.
 * Accordion sections: Mode, Palette, Template, Styling Preset, Behavior Profile, Layout.
 * Uses existing engine/store for selection state; UI only.
 */

"use client";

import React, { useEffect, useRef } from "react";
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
  const { openPanel, togglePanel, closePanel } = useDockState();
  const containerRef = useRef<HTMLDivElement | null>(null);
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

  /** Total width: panel (380) + strip (44) = 424 when open. Aligns with RightFloatingSidebar. */
  const dockWidth = openPanel ? 424 : 48;

  useEffect(() => {
    if (!openPanel) return;
    const handleClickOutside = (event: MouseEvent) => {
      const node = containerRef.current;
      if (!node) return;
      if (!node.contains(event.target as Node)) {
        closePanel();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openPanel, closePanel]);

  return React.createElement(
    "div",
    {
      ref: containerRef,
      style: {
        width: dockWidth,
        minWidth: 48,
        flex: "0 0 auto",
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
