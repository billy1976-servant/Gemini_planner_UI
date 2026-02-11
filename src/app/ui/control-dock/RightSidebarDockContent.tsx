/**
 * Right Sidebar Dock — narrow dark strip with expandable icon pills.
 * Experience, Palette, Template, etc. open in a panel to the left of the strip.
 */

"use client";

import React from "react";
import type { DockPanelId } from "./dock-state";
import AppIcon, { getAppIconNameForPanel } from "@/04_Presentation/icons/AppIcon";
import CreateNewInterfacePanel from "@/app/ui/control-dock/CreateNewInterfacePanel";

const MODES = ["template", "custom"] as const;
const STYLING_PRESETS = ["default", "clean", "minimal", "bold", "soft"];
const BEHAVIOR_PROFILES = ["default", "calm", "fast", "educational", "interactive"];
const EXPERIENCES = [
  { id: "website", label: "Website" },
  { id: "app", label: "App" },
  { id: "learning", label: "Learning" },
] as const;

const DOCK_STRIP_WIDTH = 44;
/** Panel content width (360–420 range). Must match RightFloatingSidebar for consistent Layout panel. */
const EXPANDED_PANEL_WIDTH = 380;

const PILL_CONFIG: Array<{ id: DockPanelId; label: string }> = [
  { id: "experience", label: "Experience" },
  { id: "mode", label: "Mode" },
  { id: "palette", label: "Palette" },
  { id: "template", label: "Template" },
  { id: "styling", label: "Styling" },
  { id: "behavior", label: "Behavior" },
  { id: "layout", label: "Layout" },
  { id: "newInterface", label: "New Interface" },
  { id: "expand", label: "Expand" },
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
            <div
              style={{
                width: "100%",
                maxWidth: "100%",
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                overflowY: "auto",
                overflowX: "visible",
                display: "flex",
                flexDirection: "column",
              }}
            >
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
            <div style={{ padding: "var(--spacing-3)", flex: 1, minWidth: 0, width: "100%", maxWidth: "100%", overflowX: "visible", overflowY: "auto", display: "flex", flexDirection: "column" }}>
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
                  <div style={{ width: "100%", maxWidth: "none", minWidth: 0, flex: 1, overflowX: "visible", overflowY: "visible", display: "flex", flexDirection: "column" }}>
                    {layoutPanelContent}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--editor-text-muted)" }}>
                    Layout controls appear when a website-style screen is loaded.
                  </p>
                )
              )}
              {openPanel === "newInterface" && (
                <CreateNewInterfacePanel />
              )}
              {openPanel === "expand" && (
                <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--editor-text-muted)" }}>
                  Use the floating sidebar Expand pill for the large overlay editor.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Icon rail — 44px width, 10px gap, 8px padding, centered */}
      <div
        className="right-sidebar-dock-strip"
        style={{
          width: DOCK_STRIP_WIDTH,
          minWidth: DOCK_STRIP_WIDTH,
          flexShrink: 0,
          background: "var(--editor-bg)",
          borderLeft: "1px solid var(--editor-border)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px 0",
          gap: "6px",
        }}
      >
        {pills.map(({ id, label }) => {
          const isActive = isPanelOpen(id);
          const iconName = getAppIconNameForPanel(id);
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
                width: 44,
                height: 44,
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--editor-text-primary)",
                background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
                boxShadow: isActive ? "inset 0 0 0 1px rgba(255,255,255,0.08)" : "none",
                transition: "background 0.12s ease, transform 0.06s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.transform = "scale(1.04)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
            >
              {iconName ? <AppIcon name={iconName} /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
