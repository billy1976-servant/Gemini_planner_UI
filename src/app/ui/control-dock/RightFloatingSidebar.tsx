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
import { getSidebarIconPathOrWarn } from "@/ui/sidebarIconRegistry";

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

/* Premium palette — glassy, soft glow, no hard borders */
const PALETTE = {
  softBlue: "#3b82f6",
  softBlueFill: "rgba(59, 130, 246, 0.14)",
  softBlueGlow: "rgba(59, 130, 246, 0.4)",
  neutralBg: "#f8fafc",
  neutralBgElevated: "#ffffff",
  neutralBorder: "rgba(255,255,255,0.5)",
  textPrimary: "rgba(0,0,0,0.82)",
  textMuted: "rgba(0,0,0,0.5)",
  hoverTint: "rgba(255,255,255,0.4)",
  shadowSoft: "0 4px 12px rgba(0,0,0,0.06)",
  shadowGlow: "0 0 24px rgba(59, 130, 246, 0.18)",
};

const RAIL_STYLE: React.CSSProperties = {
  width: RAIL_WIDTH,
  flexShrink: 0,
  padding: "10px 6px",
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderLeft: "1px solid rgba(0,0,0,0.06)",
  boxShadow: "0 0 0 1px rgba(255,255,255,0.6) inset",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  alignItems: "center",
};

const ICON_BUTTON_STYLE: React.CSSProperties = {
  width: "44px",
  height: "44px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "12px",
  cursor: "pointer",
  background: "transparent",
  border: "none",
  transition: "background 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease",
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
  const hasLayout = layoutPanelContent != null;
  const pills = hasLayout ? PILL_CONFIG : PILL_CONFIG.filter((p) => p.id !== "layout");

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
          background: PALETTE.neutralBgElevated,
          borderLeft: "1px solid " + PALETTE.neutralBorder,
          boxShadow: "2px 0 24px rgba(0,0,0,0.06)",
          transition: "width 0.2s ease",
        }}
      >
        {openPanel && (
          <>
            <div style={{ padding: "16px 18px", borderBottom: "1px solid " + PALETTE.neutralBorder, flexShrink: 0, background: "rgba(248,250,252,0.8)" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: PALETTE.textPrimary }}>
                {activeLabel}
              </h3>
            </div>
            <div style={{ padding: "18px", overflowY: "auto", overflowX: "hidden", height: "100%", flex: 1, minHeight: 0, minWidth: 0 }}>
            {openPanel === "experience" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {EXPERIENCES.map((exp) => {
                  const isActive = experience === exp.id;
                  return (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => setValue("experience", exp.id)}
                      className={experience === exp.id ? "editor-button active" : "editor-button"}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: "13px",
                        border: "none",
                        background: isActive ? PALETTE.softBlueFill : "transparent",
                        color: isActive ? PALETTE.softBlue : PALETTE.textPrimary,
                        fontWeight: isActive ? 600 : 400,
                        transition: "background 0.2s ease, color 0.2s ease",
                      }}
                    >
                      {exp.label}
                    </button>
                  );
                })}
              </div>
            )}
            {openPanel === "mode" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {MODES.map((mode) => {
                  const isActive = layoutMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setValue("layoutMode", mode)}
                      className={layoutMode === mode ? "editor-button active" : "editor-button"}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: "13px",
                        textTransform: "capitalize",
                        border: "none",
                        background: isActive ? PALETTE.softBlueFill : "transparent",
                        color: isActive ? PALETTE.softBlue : PALETTE.textPrimary,
                        fontWeight: isActive ? 600 : 400,
                        transition: "background 0.2s ease, color 0.2s ease",
                      }}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            )}
            {openPanel === "palette" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                {PALETTE_NAMES.map((name) => {
                  const isActive = paletteName === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handlePaletteChange(name)}
                      className={paletteName === name ? "editor-button active" : "editor-button"}
                      style={{
                        padding: "12px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: isActive ? 600 : 400,
                        textTransform: "capitalize",
                        border: "none",
                        background: isActive ? PALETTE.softBlueFill : "transparent",
                        color: isActive ? PALETTE.softBlue : PALETTE.textPrimary,
                        transition: "background 0.2s ease, color 0.2s ease",
                      }}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            )}
            {openPanel === "template" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setValue("templateId", "")}
                  className={templateId === "" ? "editor-button active" : "editor-button"}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "13px",
                    border: "none",
                    background: templateId === "" ? PALETTE.softBlueFill : "transparent",
                    color: templateId === "" ? PALETTE.softBlue : PALETTE.textPrimary,
                    fontWeight: templateId === "" ? 600 : 400,
                    transition: "background 0.2s ease, color 0.2s ease",
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
                      className={templateId === t.id ? "editor-button active" : "editor-button"}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: "13px",
                        border: "none",
                        background: isActive ? PALETTE.softBlueFill : "transparent",
                        color: isActive ? PALETTE.softBlue : PALETTE.textPrimary,
                        fontWeight: isActive ? 600 : 400,
                        transition: "background 0.2s ease, color 0.2s ease",
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            )}
            {openPanel === "styling" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {STYLING_PRESETS.map((preset) => {
                  const isActive = stylingPreset === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setValue("stylingPreset", preset)}
                      className={stylingPreset === preset ? "editor-button active" : "editor-button"}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: "13px",
                        textTransform: "capitalize",
                        border: "none",
                        background: isActive ? PALETTE.softBlueFill : "transparent",
                        color: isActive ? PALETTE.softBlue : PALETTE.textPrimary,
                        fontWeight: isActive ? 600 : 400,
                        transition: "background 0.2s ease, color 0.2s ease",
                      }}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            )}
            {openPanel === "behavior" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {BEHAVIOR_PROFILES.map((profile) => {
                  const isActive = behaviorProfile === profile;
                  return (
                    <button
                      key={profile}
                      type="button"
                      onClick={() => setValue("behaviorProfile", profile)}
                      className={behaviorProfile === profile ? "editor-button active" : "editor-button"}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: "13px",
                        textTransform: "capitalize",
                        border: "none",
                        background: isActive ? PALETTE.softBlueFill : "transparent",
                        color: isActive ? PALETTE.softBlue : PALETTE.textPrimary,
                        fontWeight: isActive ? 600 : 400,
                        transition: "background 0.2s ease, color 0.2s ease",
                      }}
                    >
                      {profile}
                    </button>
                  );
                })}
              </div>
            )}
            {openPanel === "layout" && layoutPanelContent != null && <div>{layoutPanelContent}</div>}
            </div>
          </>
        )}
      </div>

      {/* Icon rail — docked to right edge */}
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
                background: isActive ? PALETTE.softBlueFill : "transparent",
                boxShadow: isActive ? `0 0 0 1px ${PALETTE.softBlueGlow}, ${PALETTE.shadowGlow}` : "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isActive ? PALETTE.softBlueFill : PALETTE.hoverTint;
                e.currentTarget.style.boxShadow = isActive ? `0 0 0 1px ${PALETTE.softBlueGlow}, ${PALETTE.shadowGlow}` : "0 0 20px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isActive ? PALETTE.softBlueFill : "transparent";
                e.currentTarget.style.boxShadow = isActive ? `0 0 0 1px ${PALETTE.softBlueGlow}, ${PALETTE.shadowGlow}` : "none";
              }}
            >
              {iconPath ? <img src={iconPath} alt="" width={22} height={22} style={{ display: "block" }} /> : null}
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
