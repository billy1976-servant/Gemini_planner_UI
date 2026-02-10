/**
 * RightFloatingSidebar — floating vertical tool bar, fixed on the right.
 * Does NOT affect page layout. Mount at app level (e.g. via portal to document.body).
 */

"use client";

import React, { useEffect, useState } from "react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import "@/editor/editor-theme.css";
import { useDockState } from "./dock-state";
import type { DockPanelId } from "./dock-state";
import { getState, subscribeState, dispatchState } from "@/state/state-store";
import { getPaletteName, setPalette, subscribePalette } from "@/engine/core/palette-store";
import { palettes } from "@/palettes";
import { getTemplateList } from "@/lib/layout/template-profiles";
import { getSidebarIconPathOrWarn } from "@/app/ui/sidebarIconRegistry";
import PaletteLivePreview from "@/app/ui/control-dock/PaletteLivePreview";
import StylingLivePreview from "@/app/ui/control-dock/StylingLivePreview";

const PALETTE_NAMES = Object.keys(palettes) as string[];
const MODES = ["template", "custom"] as const;
const STYLING_PRESETS = ["default", "clean", "minimal", "bold", "soft"];
const BEHAVIOR_PROFILES = ["default", "calm", "fast", "educational", "interactive"];
const EXPERIENCES = [
  { id: "website", label: "Website" },
  { id: "app", label: "App" },
  { id: "learning", label: "Learning" },
] as const;

const FLOATING_PANEL_WIDTH = 280;
const RAIL_WIDTH = 56;
/** Total width when panel is open (panel + rail). Use for main content padding-right. */
export const SIDEBAR_TOTAL_WIDTH = FLOATING_PANEL_WIDTH + RAIL_WIDTH;

const PILL_CONFIG: Array<{ id: DockPanelId; label: string }> = [
  { id: "experience", label: "Experience" },
  { id: "mode", label: "Mode" },
  { id: "palette", label: "Palette" },
  { id: "template", label: "Template" },
  { id: "styling", label: "Styling" },
  { id: "behavior", label: "Behavior" },
  { id: "layout", label: "Layout" },
];

/* Google-style: Material surface, blue primary, gray hierarchy */
const GOOGLE = {
  primary: "#1a73e8",
  primaryHover: "#1765cc",
  primaryBg: "#e8f0fe",
  surface: "#ffffff",
  surfaceHover: "#f1f3f4",
  border: "#dadce0",
  textPrimary: "#202124",
  textSecondary: "#5f6368",
  textCaption: "#80868b",
  fontFamily: "'Google Sans', 'Roboto', system-ui, sans-serif",
  radius: 8,
  radiusFull: 20,
  shadow: "0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)",
};

const RAIL_STYLE: React.CSSProperties = {
  width: RAIL_WIDTH,
  flexShrink: 0,
  padding: "8px 0",
  background: GOOGLE.surface,
  borderLeft: `1px solid ${GOOGLE.border}`,
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  alignItems: "center",
  boxShadow: GOOGLE.shadow,
};

const ICON_BUTTON_STYLE: React.CSSProperties = {
  width: 40,
  height: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: GOOGLE.radiusFull,
  cursor: "pointer",
  background: "transparent",
  border: "none",
  transition: "background 0.15s ease",
};

export type RightFloatingSidebarProps = {
  /** Optional: Layout section content (e.g. OrganPanel) */
  layoutPanelContent?: React.ReactNode;
};

function RightFloatingSidebarInner({ layoutPanelContent }: RightFloatingSidebarProps) {
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
  const pills = PILL_CONFIG;

  const activeLabel = openPanel ? PILL_CONFIG.find((p) => p.id === openPanel)?.label : null;

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        height: "100vh",
        width: openPanel ? FLOATING_PANEL_WIDTH + RAIL_WIDTH : RAIL_WIDTH,
        display: "flex",
        flexDirection: "row",
        zIndex: 999,
        transition: "width 0.2s ease",
      }}
    >
      {/* Docked panel — full height, scrollable content */}
      <div
        style={{
          width: openPanel ? FLOATING_PANEL_WIDTH : 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: GOOGLE.surface,
          borderLeft: `1px solid ${GOOGLE.border}`,
          boxShadow: GOOGLE.shadow,
          transition: "width 0.2s ease",
        }}
      >
        {openPanel && (
          <>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${GOOGLE.border}`, flexShrink: 0, background: GOOGLE.surface }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500, color: GOOGLE.textPrimary, fontFamily: GOOGLE.fontFamily }}>
                {activeLabel}
              </h3>
            </div>
            <div style={{ padding: "12px 16px", overflowY: "auto", overflowX: "hidden", height: "100%", flex: 1, minHeight: 0, minWidth: 0, fontFamily: GOOGLE.fontFamily }}>
            {openPanel === "experience" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {EXPERIENCES.map((exp) => {
                  const isActive = experience === exp.id;
                  return (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => setValue("experience", exp.id)}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = GOOGLE.surfaceHover; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? GOOGLE.primaryBg : "transparent"; }}
                      style={{
                        minHeight: 48,
                        padding: "0 12px",
                        borderRadius: GOOGLE.radius,
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: 14,
                        border: "none",
                        background: isActive ? GOOGLE.primaryBg : "transparent",
                        color: isActive ? GOOGLE.primary : GOOGLE.textPrimary,
                        fontWeight: isActive ? 500 : 400,
                        transition: "background 0.15s ease",
                      }}
                    >
                      {exp.label}
                    </button>
                  );
                })}
              </div>
            )}
            {openPanel === "mode" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {MODES.map((mode) => {
                  const isActive = layoutMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setValue("layoutMode", mode)}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = GOOGLE.surfaceHover; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? GOOGLE.primaryBg : "transparent"; }}
                      style={{
                        minHeight: 48,
                        padding: "0 12px",
                        borderRadius: GOOGLE.radius,
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: 14,
                        textTransform: "capitalize",
                        border: "none",
                        background: isActive ? GOOGLE.primaryBg : "transparent",
                        color: isActive ? GOOGLE.primary : GOOGLE.textPrimary,
                        fontWeight: isActive ? 500 : 400,
                        transition: "background 0.15s ease",
                      }}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            )}
            {openPanel === "palette" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: 12, color: GOOGLE.textSecondary, marginBottom: "4px", fontWeight: 500 }}>
                  Live preview
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                  {PALETTE_NAMES.map((name) => {
                    const isActive = paletteName === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handlePaletteChange(name)}
                        style={{
                          padding: "12px",
                          borderRadius: GOOGLE.radius,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: isActive ? 500 : 400,
                          textTransform: "capitalize",
                          border: `1px solid ${isActive ? GOOGLE.primary : GOOGLE.border}`,
                          background: isActive ? GOOGLE.primaryBg : GOOGLE.surface,
                          color: isActive ? GOOGLE.primary : GOOGLE.textPrimary,
                          transition: "background 0.15s ease, border-color 0.15s ease",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <PaletteLivePreview paletteName={name} size={64} />
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {openPanel === "template" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <button
                  type="button"
                  onClick={() => setValue("templateId", "")}
                  onMouseEnter={(e) => { if (templateId !== "") e.currentTarget.style.background = GOOGLE.surfaceHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = templateId === "" ? GOOGLE.primaryBg : "transparent"; }}
                  style={{
                    minHeight: 48,
                    padding: "0 12px",
                    borderRadius: GOOGLE.radius,
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 14,
                    border: "none",
                    background: templateId === "" ? GOOGLE.primaryBg : "transparent",
                    color: templateId === "" ? GOOGLE.primary : GOOGLE.textPrimary,
                    fontWeight: templateId === "" ? 500 : 400,
                    transition: "background 0.15s ease",
                  }}
                >
                  (experience only)
                </button>
                {templateList.map((t) => {
                  const isActive = templateId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setValue("templateId", t.id)}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = GOOGLE.surfaceHover; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? GOOGLE.primaryBg : "transparent"; }}
                      style={{
                        minHeight: 48,
                        padding: "0 12px",
                        borderRadius: GOOGLE.radius,
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: 14,
                        border: "none",
                        background: isActive ? GOOGLE.primaryBg : "transparent",
                        color: isActive ? GOOGLE.primary : GOOGLE.textPrimary,
                        fontWeight: isActive ? 500 : 400,
                        transition: "background 0.15s ease",
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            )}
            {openPanel === "styling" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: 12, color: GOOGLE.textSecondary, marginBottom: "4px", fontWeight: 500 }}>
                  Live preview
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                  {STYLING_PRESETS.map((preset) => {
                    const isActive = stylingPreset === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setValue("stylingPreset", preset)}
                        style={{
                          padding: "12px",
                          borderRadius: GOOGLE.radius,
                          cursor: "pointer",
                          fontSize: 13,
                          textTransform: "capitalize",
                          border: `1px solid ${isActive ? GOOGLE.primary : GOOGLE.border}`,
                          background: isActive ? GOOGLE.primaryBg : GOOGLE.surface,
                          color: isActive ? GOOGLE.primary : GOOGLE.textPrimary,
                          fontWeight: isActive ? 500 : 400,
                          transition: "background 0.15s ease, border-color 0.15s ease",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <StylingLivePreview presetName={preset} size={64} />
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {openPanel === "behavior" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {BEHAVIOR_PROFILES.map((profile) => {
                  const isActive = behaviorProfile === profile;
                  return (
                    <button
                      key={profile}
                      type="button"
                      onClick={() => setValue("behaviorProfile", profile)}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = GOOGLE.surfaceHover; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? GOOGLE.primaryBg : "transparent"; }}
                      style={{
                        minHeight: 48,
                        padding: "0 12px",
                        borderRadius: GOOGLE.radius,
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: 14,
                        textTransform: "capitalize",
                        border: "none",
                        background: isActive ? GOOGLE.primaryBg : "transparent",
                        color: isActive ? GOOGLE.primary : GOOGLE.textPrimary,
                        fontWeight: isActive ? 500 : 400,
                        transition: "background 0.15s ease",
                      }}
                    >
                      {profile}
                    </button>
                  );
                })}
              </div>
            )}
            {openPanel === "layout" && (
              layoutPanelContent != null ? (
                <div>{layoutPanelContent}</div>
              ) : (
                <div style={{ padding: "16px 0", fontSize: 14, color: GOOGLE.textSecondary, lineHeight: 1.5 }}>
                  Layout controls appear when a website-style screen is loaded.
                </div>
              )
            )}
            </div>
          </>
        )}
      </div>

      {/* Icon rail — Google-style: white surface, circular active state */}
      <div style={RAIL_STYLE}>
        {pills.map(({ id, label }) => {
          const isActive = isPanelOpen(id);
          const iconPath = getSidebarIconPathOrWarn(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => togglePanel(id)}
              title={label}
              aria-label={label}
              aria-pressed={isActive}
              style={{
                ...ICON_BUTTON_STYLE,
                background: isActive ? GOOGLE.primaryBg : "transparent",
                color: isActive ? GOOGLE.primary : GOOGLE.textSecondary,
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = GOOGLE.surfaceHover;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              {iconPath ? (
                <img
                  src={iconPath}
                  alt=""
                  width={20}
                  height={20}
                  style={{ display: "block", opacity: isActive ? 1 : 0.7 }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function RightFloatingSidebar(props: RightFloatingSidebarProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(<RightFloatingSidebarInner {...props} />, document.body);
}
