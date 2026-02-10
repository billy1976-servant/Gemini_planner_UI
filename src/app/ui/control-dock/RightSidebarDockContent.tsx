/**
 * Right Sidebar Dock — narrow dark strip with expandable icon pills.
 * Experience, Palette, Template, etc. open in a panel to the left of the strip.
 */

"use client";

import React from "react";
import type { DockPanelId } from "./dock-state";

const MODES = ["template", "custom"] as const;
const STYLING_PRESETS = ["default", "clean", "minimal", "bold", "soft"];
const BEHAVIOR_PROFILES = ["default", "calm", "fast", "educational", "interactive"];
const EXPERIENCES = [
  { id: "website", label: "Website" },
  { id: "app", label: "App" },
  { id: "learning", label: "Learning" },
] as const;

const DOCK_STRIP_WIDTH = 48;
const EXPANDED_PANEL_WIDTH = 280;

/* Icon components (compact, for pills) */
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

const PILL_CONFIG: Array<{
  id: DockPanelId;
  label: string;
  Icon: React.FC;
}> = [
  { id: "experience", label: "Experience", Icon: IconGlobe },
  { id: "mode", label: "Mode", Icon: IconGear },
  { id: "palette", label: "Palette", Icon: IconPalette },
  { id: "template", label: "Template", Icon: IconDocument },
  { id: "styling", label: "Styling", Icon: IconStar },
  { id: "behavior", label: "Behavior", Icon: IconLightning },
  { id: "layout", label: "Layout", Icon: IconLayout },
];

export type RightSidebarDockContentProps = {
  experience: string;
  layoutMode: string;
  templateId: string;
  paletteName: string;
  stylingPreset: string;
  behaviorProfile: string;
  templateList: Array<{ id: string; label: string }>;
  isPanelOpen: (id: DockPanelId) => boolean;
  setPanelOpen: (id: DockPanelId) => void;
  setValue: (key: string, value: string) => void;
  handlePaletteChange: (name: string) => void;
  layoutPanelContent?: React.ReactNode;
  paletteNames: string[];
};

export default function RightSidebarDockContent(props: RightSidebarDockContentProps) {
  const {
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
    paletteNames,
  } = props;

  const openPanel = PILL_CONFIG.map((p) => p.id).find((id) => isPanelOpen(id)) ?? null;
  const hasLayout = layoutPanelContent != null;
  const pills = hasLayout ? PILL_CONFIG : PILL_CONFIG.filter((p) => p.id !== "layout");

  return (
    <div
      className="editor-root right-sidebar-dock"
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
        minHeight: 0,
        background: "var(--editor-dock-strip-bg, #252526)",
        overflow: "hidden",
      }}
    >
      {/* Expandable panel (to the left of the strip) */}
      <div
        style={{
          width: openPanel ? EXPANDED_PANEL_WIDTH : 0,
          minWidth: openPanel ? EXPANDED_PANEL_WIDTH : 0,
          flexShrink: 0,
          overflow: "hidden",
          transition: "min-width 0.2s ease, width 0.2s ease",
          background: "var(--editor-bg)",
          borderLeft: "1px solid var(--editor-border)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {openPanel && (
          <div style={{ width: EXPANDED_PANEL_WIDTH, flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div
              className="editor-header"
              style={{
                padding: "var(--spacing-3)",
                flexShrink: 0,
                borderBottom: "1px solid var(--editor-border)",
              }}
            >
              <h3 className="editor-text-primary" style={{ margin: 0, fontSize: "var(--font-size-base)", fontWeight: 600 }}>
                {PILL_CONFIG.find((p) => p.id === openPanel)?.label ?? openPanel}
              </h3>
            </div>
            <div style={{ padding: "var(--spacing-3)", flex: 1 }}>
              {openPanel === "experience" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
                  {EXPERIENCES.map((exp) => (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => setValue("experience", exp.id)}
                      className={experience === exp.id ? "editor-button active" : "editor-button"}
                      style={{
                        padding: "var(--spacing-2) var(--spacing-3)",
                        borderRadius: "4px",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: "var(--font-size-sm)",
                      }}
                    >
                      {exp.label}
                    </button>
                  ))}
                </div>
              )}
              {openPanel === "mode" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
                  {MODES.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setValue("layoutMode", mode)}
                      className={layoutMode === mode ? "editor-button active" : "editor-button"}
                      style={{
                        padding: "var(--spacing-2) var(--spacing-3)",
                        borderRadius: "4px",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: "var(--font-size-sm)",
                        textTransform: "capitalize",
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              )}
              {openPanel === "palette" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--spacing-2)" }}>
                  {paletteNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handlePaletteChange(name)}
                      className={paletteName === name ? "editor-button active" : "editor-button"}
                      style={{
                        padding: "var(--spacing-3)",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: paletteName === name ? 600 : 400,
                        textTransform: "capitalize",
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
              {openPanel === "template" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
                  <button
                    type="button"
                    onClick={() => setValue("templateId", "")}
                    className={templateId === "" ? "editor-button active" : "editor-button"}
                    style={{
                      padding: "var(--spacing-2) var(--spacing-3)",
                      borderRadius: "4px",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "var(--font-size-sm)",
                    }}
                  >
                    (experience only)
                  </button>
                  {templateList.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setValue("templateId", t.id)}
                      className={templateId === t.id ? "editor-button active" : "editor-button"}
                      style={{
                        padding: "var(--spacing-2) var(--spacing-3)",
                        borderRadius: "4px",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: "var(--font-size-sm)",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
              {openPanel === "styling" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
                  {STYLING_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setValue("stylingPreset", preset)}
                      className={stylingPreset === preset ? "editor-button active" : "editor-button"}
                      style={{
                        padding: "var(--spacing-2) var(--spacing-3)",
                        borderRadius: "4px",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: "var(--font-size-sm)",
                        textTransform: "capitalize",
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}
              {openPanel === "behavior" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
                  {BEHAVIOR_PROFILES.map((profile) => (
                    <button
                      key={profile}
                      type="button"
                      onClick={() => setValue("behaviorProfile", profile)}
                      className={behaviorProfile === profile ? "editor-button active" : "editor-button"}
                      style={{
                        padding: "var(--spacing-2) var(--spacing-3)",
                        borderRadius: "4px",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: "var(--font-size-sm)",
                        textTransform: "capitalize",
                      }}
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
      </div>

      {/* Narrow dark strip with icon pills */}
      <div
        className="right-sidebar-dock-strip"
        style={{
          width: DOCK_STRIP_WIDTH,
          minWidth: DOCK_STRIP_WIDTH,
          flexShrink: 0,
          background: "var(--editor-dock-strip-bg, #252526)",
          borderLeft: "1px solid var(--editor-dock-strip-border, #3c3c3c)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "var(--spacing-2)",
          paddingBottom: "var(--spacing-2)",
          gap: "var(--spacing-1)",
        }}
      >
        {pills.map(({ id, label, Icon }) => {
          const isActive = isPanelOpen(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => setPanelOpen(id)}
              title={label}
              aria-label={label}
              aria-pressed={isActive}
              className="editor-dock-pill"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--editor-dock-pill-color, #cccccc)",
                background: isActive ? "var(--editor-dock-pill-active-bg, #3c3c3c)" : "transparent",
                transition: "background 0.15s ease, color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "var(--editor-dock-pill-hover-bg, #3c3c3c)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon />
            </button>
          );
        })}
      </div>
    </div>
  );
}
