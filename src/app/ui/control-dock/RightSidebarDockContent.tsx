/**
 * Right Sidebar Dock — narrow dark strip with expandable icon pills.
 * Experience, Palette, Template, etc. open in a panel to the left of the strip.
 */

"use client";

import React from "react";
import type { DockPanelId } from "./dock-state";
import { getSidebarIconPathOrWarn } from "@/app/ui/sidebarIconRegistry";

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

const PILL_CONFIG: Array<{ id: DockPanelId; label: string }> = [
  { id: "experience", label: "Experience" },
  { id: "mode", label: "Mode" },
  { id: "palette", label: "Palette" },
  { id: "template", label: "Template" },
  { id: "styling", label: "Styling" },
  { id: "behavior", label: "Behavior" },
  { id: "layout", label: "Layout" },
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
  const pills = PILL_CONFIG;

  return (
    <div
      className="editor-root right-sidebar-dock"
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
        minHeight: 0,
        background: "transparent",
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
              {openPanel === "layout" && (
                layoutPanelContent != null ? (
                  <div>{layoutPanelContent}</div>
                ) : (
                  <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--editor-text-muted)" }}>
                    Layout controls appear when a website-style screen is loaded.
                  </p>
                )
              )}
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
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.5) inset, -4px 0 16px rgba(0,0,0,0.04)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "var(--spacing-2)",
          paddingBottom: "var(--spacing-2)",
          gap: "6px",
        }}
      >
        {pills.map(({ id, label }) => {
          const isActive = isPanelOpen(id);
          const iconPath = getSidebarIconPathOrWarn(id);
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
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isActive ? "rgba(59, 130, 246, 0.14)" : "transparent",
                boxShadow: isActive ? "0 0 0 1px rgba(59, 130, 246, 0.35), 0 0 24px rgba(59, 130, 246, 0.18)" : "none",
                transition: "background 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.5)";
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(0,0,0,0.08)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.boxShadow = "none";
                }
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
