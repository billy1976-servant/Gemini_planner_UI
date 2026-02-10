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

function IconGlobe() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
function IconGear() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function IconPalette() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.7-.2 2.5-.5" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconLightning() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function IconDocument() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
function IconLayout() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

const PILL_CONFIG: Array<{ id: DockPanelId; label: string; Icon: React.FC }> = [
  { id: "experience", label: "Experience", Icon: IconGlobe },
  { id: "mode", label: "Mode", Icon: IconGear },
  { id: "palette", label: "Palette", Icon: IconPalette },
  { id: "template", label: "Template", Icon: IconDocument },
  { id: "styling", label: "Styling", Icon: IconStar },
  { id: "behavior", label: "Behavior", Icon: IconLightning },
  { id: "layout", label: "Layout", Icon: IconLayout },
];

const WRAPPER_STYLE: React.CSSProperties = {
  position: "fixed",
  right: "18px",
  top: "120px",
  width: "52px",
  background: "#2b2f31",
  borderRadius: "14px",
  padding: "10px 6px",
  display: "flex",
  flexDirection: "column",
  gap: "14px",
  alignItems: "center",
  zIndex: 9999,
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
};

const ICON_BUTTON_STYLE: React.CSSProperties = {
  width: "36px",
  height: "36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "8px",
  cursor: "pointer",
  color: "#ffffff",
  opacity: 0.9,
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
    <>
      {/* Floating panel to the left of the bar */}
      {openPanel && (
        <div
          style={{
            position: "fixed",
            right: "86px",
            top: "120px",
            width: FLOATING_PANEL_WIDTH,
            maxHeight: "calc(100vh - 140px)",
            background: "var(--editor-bg, #f6f7f9)",
            borderRadius: "14px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            zIndex: 9998,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid var(--editor-border, #e2e5ea)",
          }}
        >
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--editor-border, #e2e5ea)", flexShrink: 0 }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--editor-text, #1f2937)" }}>
              {activeLabel}
            </h3>
          </div>
          <div style={{ padding: "14px", overflowY: "auto", flex: 1, minHeight: 0 }}>
            {openPanel === "experience" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {EXPERIENCES.map((exp) => (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => setValue("experience", exp.id)}
                    className={experience === exp.id ? "editor-button active" : "editor-button"}
                    style={{ padding: "8px 12px", borderRadius: "4px", cursor: "pointer", textAlign: "left", fontSize: "13px" }}
                  >
                    {exp.label}
                  </button>
                ))}
              </div>
            )}
            {openPanel === "mode" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {MODES.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setValue("layoutMode", mode)}
                    className={layoutMode === mode ? "editor-button active" : "editor-button"}
                    style={{ padding: "8px 12px", borderRadius: "4px", cursor: "pointer", textAlign: "left", fontSize: "13px", textTransform: "capitalize" }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}
            {openPanel === "palette" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                {PALETTE_NAMES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handlePaletteChange(name)}
                    className={paletteName === name ? "editor-button active" : "editor-button"}
                    style={{ padding: "10px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", fontWeight: paletteName === name ? 600 : 400, textTransform: "capitalize" }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
            {openPanel === "template" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setValue("templateId", "")}
                  className={templateId === "" ? "editor-button active" : "editor-button"}
                  style={{ padding: "8px 12px", borderRadius: "4px", cursor: "pointer", textAlign: "left", fontSize: "13px" }}
                >
                  (experience only)
                </button>
                {templateList.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setValue("templateId", t.id)}
                    className={templateId === t.id ? "editor-button active" : "editor-button"}
                    style={{ padding: "8px 12px", borderRadius: "4px", cursor: "pointer", textAlign: "left", fontSize: "13px" }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            {openPanel === "styling" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {STYLING_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setValue("stylingPreset", preset)}
                    className={stylingPreset === preset ? "editor-button active" : "editor-button"}
                    style={{ padding: "8px 12px", borderRadius: "4px", cursor: "pointer", textAlign: "left", fontSize: "13px", textTransform: "capitalize" }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
            {openPanel === "behavior" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {BEHAVIOR_PROFILES.map((profile) => (
                  <button
                    key={profile}
                    type="button"
                    onClick={() => setValue("behaviorProfile", profile)}
                    className={behaviorProfile === profile ? "editor-button active" : "editor-button"}
                    style={{ padding: "8px 12px", borderRadius: "4px", cursor: "pointer", textAlign: "left", fontSize: "13px", textTransform: "capitalize" }}
                  >
                    {profile}
                  </button>
                ))}
              </div>
            )}
            {openPanel === "layout" && layoutPanelContent != null && <div>{layoutPanelContent}</div>}
          </div>
        </div>
      )}

      {/* Fixed vertical bar — exact spec */}
      <div style={WRAPPER_STYLE}>
        {pills.map(({ id, label, Icon }) => {
          const isActive = isPanelOpen(id);
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
                background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
                else e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              }}
            >
              <Icon />
            </button>
          );
        })}
      </div>
    </>
  );
}

export default function RightFloatingSidebar(props: RightFloatingSidebarProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(<RightFloatingSidebarInner {...props} />, document.body);
}
