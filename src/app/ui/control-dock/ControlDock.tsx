/**
 * SYSTEM RULE:
 * Control Dock is EDITOR UI.
 * It must NEVER respond to:
 * - Palette
 * - Experience
 * - Template
 * - Preview styling
 * 
 * This component uses fixed editor tokens (--editor-*) that are
 * permanently isolated from app surface styling.
 */

"use client";

import React from "react";
import "@/editor/editor-theme.css";
import { useDockState, type DockPanelId } from "./dock-state";
import DockPanel from "./DockPanel";
import DockSection from "./DockSection";

type ControlDockProps = {
  // Palette props
  paletteName: string;
  palettes: string[];
  onPaletteChange: (paletteName: string) => void;

  // Template props
  templateId: string;
  templateList: Array<{ id: string; label: string }>;
  onTemplateChange: (templateId: string) => void;

  // Experience props
  experience: string;
  onExperienceChange: (experience: string) => void;

  // Mode props
  layoutMode: string;
  onLayoutModeChange: (mode: string) => void;

  // Styling preset (placeholder)
  stylingPreset?: string;
  onStylingPresetChange?: (preset: string) => void;

  // Behavior profile (placeholder)
  behaviorProfile?: string;
  onBehaviorProfileChange?: (profile: string) => void;

  // Layout panel content (OrganPanel will be passed here)
  layoutPanelContent?: React.ReactNode;
};

export default function ControlDock({
  paletteName,
  palettes,
  onPaletteChange,
  templateId,
  templateList,
  onTemplateChange,
  experience,
  onExperienceChange,
  layoutMode,
  onLayoutModeChange,
  stylingPreset = "default",
  onStylingPresetChange,
  behaviorProfile = "default",
  onBehaviorProfileChange,
  layoutPanelContent,
}: ControlDockProps) {
  const { openPanel, togglePanel } = useDockState();

  const handlePaletteClick = (palette: string) => {
    onPaletteChange(palette);
  };

  const handleTemplateClick = (id: string) => {
    onTemplateChange(id);
  };

  const handleStylingPresetClick = (preset: string) => {
    onStylingPresetChange?.(preset);
  };

  const handleBehaviorProfileClick = (profile: string) => {
    onBehaviorProfileChange?.(profile);
  };

  return (
    <div className="editor-root"
      style={{
        position: "fixed",
        right: 0,
        top: "var(--app-chrome-height, 48px)",
        bottom: 0,
        width: openPanel ? "320px" : "60px",
        background: "var(--editor-bg)",
        borderLeft: "1px solid var(--editor-border)",
        boxShadow: openPanel ? "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" : "none",
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s ease",
      }}
    >
      {/* Collapsed Icon Rail */}
      {!openPanel && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "var(--spacing-2)",
            gap: "var(--spacing-1)",
          }}
        >
          <button
            type="button"
            onClick={() => togglePanel("experience")}
            className="editor-button-icon"
            style={{
              width: "44px",
              height: "44px",
              padding: "var(--spacing-2)",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--font-size-lg)",
            }}
            title="Experience"
          >
            🌐
          </button>
          <button
            type="button"
            onClick={() => togglePanel("mode")}
            className="editor-button-icon"
            style={{
              width: "44px",
              height: "44px",
              padding: "var(--spacing-2)",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--font-size-lg)",
            }}
            title="Mode"
          >
            ⚙️
          </button>
          <button
            type="button"
            onClick={() => togglePanel("palette")}
            className="editor-button-icon"
            style={{
              width: "44px",
              height: "44px",
              padding: "var(--spacing-2)",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--font-size-lg)",
            }}
            title="Palette"
          >
            🎨
          </button>
          <button
            type="button"
            onClick={() => togglePanel("template")}
            className="editor-button-icon"
            style={{
              width: "44px",
              height: "44px",
              padding: "var(--spacing-2)",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--font-size-lg)",
            }}
            title="Template"
          >
            📐
          </button>
          <button
            type="button"
            onClick={() => togglePanel("styling")}
            className="editor-button-icon"
            style={{
              width: "44px",
              height: "44px",
              padding: "var(--spacing-2)",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--font-size-lg)",
            }}
            title="Styling"
          >
            ✨
          </button>
          <button
            type="button"
            onClick={() => togglePanel("behavior")}
            className="editor-button-icon"
            style={{
              width: "44px",
              height: "44px",
              padding: "var(--spacing-2)",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--font-size-lg)",
            }}
            title="Behavior"
          >
            ⚡
          </button>
          <button
            type="button"
            onClick={() => togglePanel("layout")}
            className="editor-button-icon"
            style={{
              width: "44px",
              height: "44px",
              padding: "var(--spacing-2)",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--font-size-lg)",
            }}
            title="Layout"
          >
            📊
          </button>
        </div>
      )}

      {/* Expanded Panel */}
      {openPanel && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            className="editor-header"
            style={{
              padding: "var(--spacing-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h3
              className="editor-text-primary"
              style={{
                margin: 0,
                fontSize: "var(--font-size-base)",
                fontWeight: 600,
              }}
            >
              Control Dock
            </h3>
            <button
              type="button"
              onClick={() => togglePanel(openPanel)}
              className="editor-text-secondary"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "var(--font-size-lg)",
                padding: "var(--spacing-1)",
              }}
              title="Collapse"
            >
              ×
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
            }}
          >
            {/* Experience Panel */}
            <DockPanel
              panelId="experience"
              title="Experience"
              icon="🌐"
              isOpen={openPanel === "experience"}
              onToggle={() => togglePanel("experience")}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
                {["website", "app", "learning"].map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    onClick={() => onExperienceChange(exp)}
                    className={experience === exp ? "editor-button active" : "editor-button"}
                    style={{
                      padding: "var(--spacing-2) var(--spacing-3)",
                      borderRadius: "4px",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "var(--font-size-sm)",
                      textTransform: "capitalize",
                    }}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </DockPanel>

            {/* Mode Panel */}
            <DockPanel
              panelId="mode"
              title="Mode"
              icon="⚙️"
              isOpen={openPanel === "mode"}
              onToggle={() => togglePanel("mode")}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
                {["template", "custom"].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onLayoutModeChange(mode)}
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
            </DockPanel>

            {/* Palette Panel */}
            <DockPanel
              panelId="palette"
              title="Palette"
              icon="🎨"
              isOpen={openPanel === "palette"}
              onToggle={() => togglePanel("palette")}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "var(--spacing-2)",
                }}
              >
                {palettes.map((palette) => (
                  <button
                    key={palette}
                    type="button"
                    onClick={() => handlePaletteClick(palette)}
                    className={paletteName === palette ? "editor-button active" : "editor-button"}
                    style={{
                      padding: "var(--spacing-3)",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "var(--font-size-sm)",
                      fontWeight: paletteName === palette ? 600 : 400,
                      textTransform: "capitalize",
                    }}
                  >
                    {palette}
                  </button>
                ))}
              </div>
            </DockPanel>

            {/* Template Panel */}
            <DockPanel
              panelId="template"
              title="Template"
              icon="📐"
              isOpen={openPanel === "template"}
              onToggle={() => togglePanel("template")}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
                <button
                  type="button"
                  onClick={() => handleTemplateClick("")}
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
                {templateList.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateClick(template.id)}
                    className={templateId === template.id ? "editor-button active" : "editor-button"}
                    style={{
                      padding: "var(--spacing-2) var(--spacing-3)",
                      borderRadius: "4px",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "var(--font-size-sm)",
                    }}
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </DockPanel>

            {/* Styling Panel (Placeholder) */}
            <DockPanel
              panelId="styling"
              title="Styling Preset"
              icon="✨"
              isOpen={openPanel === "styling"}
              onToggle={() => togglePanel("styling")}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
                {["default", "clean", "minimal", "bold", "soft"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleStylingPresetClick(preset)}
                    disabled={!onStylingPresetChange}
                    className={stylingPreset === preset ? "editor-button active" : "editor-button"}
                    style={{
                      padding: "var(--spacing-2) var(--spacing-3)",
                      borderRadius: "4px",
                      cursor: onStylingPresetChange ? "pointer" : "not-allowed",
                      textAlign: "left",
                      fontSize: "var(--font-size-sm)",
                      textTransform: "capitalize",
                      opacity: onStylingPresetChange ? 1 : 0.6,
                    }}
                  >
                    {preset}
                  </button>
                ))}
                {!onStylingPresetChange && (
                  <p className="editor-text-muted" style={{ fontSize: "var(--font-size-xs)", margin: "var(--spacing-2) 0 0 0" }}>
                    Coming soon
                  </p>
                )}
              </div>
            </DockPanel>

            {/* Behavior Panel (Placeholder) */}
            <DockPanel
              panelId="behavior"
              title="Behavior Profile"
              icon="⚡"
              isOpen={openPanel === "behavior"}
              onToggle={() => togglePanel("behavior")}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
                {["default", "calm", "fast", "educational", "interactive"].map((profile) => (
                  <button
                    key={profile}
                    type="button"
                    onClick={() => handleBehaviorProfileClick(profile)}
                    disabled={!onBehaviorProfileChange}
                    className={behaviorProfile === profile ? "editor-button active" : "editor-button"}
                    style={{
                      padding: "var(--spacing-2) var(--spacing-3)",
                      borderRadius: "4px",
                      cursor: onBehaviorProfileChange ? "pointer" : "not-allowed",
                      textAlign: "left",
                      fontSize: "var(--font-size-sm)",
                      textTransform: "capitalize",
                      opacity: onBehaviorProfileChange ? 1 : 0.6,
                    }}
                  >
                    {profile}
                  </button>
                ))}
                {!onBehaviorProfileChange && (
                  <p className="editor-text-muted" style={{ fontSize: "var(--font-size-xs)", margin: "var(--spacing-2) 0 0 0" }}>
                    Coming soon
                  </p>
                )}
              </div>
            </DockPanel>

            {/* Layout Panel (OrganPanel content) */}
            <DockPanel
              panelId="layout"
              title="Layout"
              icon="📊"
              isOpen={openPanel === "layout"}
              onToggle={() => togglePanel("layout")}
            >
              {layoutPanelContent || (
                <p className="editor-text-muted" style={{ fontSize: "var(--font-size-sm)" }}>
                  No sections available
                </p>
              )}
            </DockPanel>
          </div>
        </div>
      )}
    </div>
  );
}





