/**
 * RightFloatingSidebar — floating vertical tool bar, fixed on the right.
 * Does NOT affect page layout. Mount at app level (e.g. via portal to document.body).
 */

"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import "@/editor/editor-theme.css";
import { useDockState } from "./dock-state";
import type { DockPanelId } from "./dock-state";
import { getState, subscribeState, dispatchState } from "@/state/state-store";
import { getPaletteName, setPalette, subscribePalette } from "@/engine/core/palette-store";
import { palettes } from "@/palettes";
import { getTemplateList } from "@/lib/layout/template-profiles";
import AppIcon, { getAppIconNameForPanel } from "@/04_Presentation/icons/AppIcon";
import PaletteLivePreview from "@/app/ui/control-dock/PaletteLivePreview";
import StylingLivePreview from "@/app/ui/control-dock/StylingLivePreview";
import CreateNewInterfacePanel from "@/app/ui/control-dock/CreateNewInterfacePanel";
import ExperienceRenderer from "@/engine/core/ExperienceRenderer";
import { applyPaletteToElement } from "@/lib/site-renderer/palette-bridge";
import PaletteContractInspector from "@/04_Presentation/diagnostics/PaletteContractInspector";

/** Wraps content and applies a specific palette's CSS variables to the wrapper so the content renders in that palette. */
function PaletteFullPreviewFrame({
  paletteName,
  children,
}: {
  paletteName: string;
  children: React.ReactNode;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      elRef.current = el;
      if (el) applyPaletteToElement(el, paletteName);
    },
    [paletteName]
  );
  useLayoutEffect(() => {
    const el = elRef.current;
    if (el) applyPaletteToElement(el, paletteName);
  }, [paletteName]);
  return (
    <div
      ref={setRef}
      className="palette-live-preview-scope"
      style={{
        width: "100%",
        minHeight: "100%",
        isolation: "isolate",
        position: "relative",
        zIndex: 0,
      }}
      data-palette-preview={paletteName}
    >
      {children}
    </div>
  );
}

const PALETTE_NAMES = Object.keys(palettes) as string[];
const MODES = ["template", "custom"] as const;
const STYLING_PRESETS = ["default", "clean", "minimal", "bold", "soft", "apple"];
const BEHAVIOR_PROFILES = ["default", "calm", "fast", "educational", "interactive"];
const EXPERIENCES = [
  { id: "website", label: "Website" },
  { id: "app", label: "App" },
  { id: "learning", label: "Learning" },
] as const;

/** Panel content width (360–420 range). Tiles/layout use full width; no clipping. */
const FLOATING_PANEL_WIDTH = 380;
const RAIL_WIDTH = 44;
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
  { id: "newInterface", label: "New Interface" },
  { id: "expand", label: "Expand" },
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
  justifyContent: "center",
  gap: "6px",
  alignItems: "center",
  boxShadow: GOOGLE.shadow,
};

const ICON_BUTTON_BASE: React.CSSProperties = {
  width: 44,
  height: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 8,
  cursor: "pointer",
  background: "transparent",
  border: "none",
  transition: "background 0.12s ease, transform 0.06s ease",
};

/** Props passed to ExperienceRenderer for the palette panel full-page preview. */
export type PalettePreviewProps = {
  defaultState?: any;
  profileOverride?: any;
  sectionLayoutPresetOverrides?: Record<string, string>;
  cardLayoutPresetOverrides?: Record<string, string>;
  organInternalLayoutOverrides?: Record<string, string>;
  screenKey: string;
  behaviorProfile?: string;
  experience?: string;
  sectionKeys?: string[];
  sectionLabels?: Record<string, string>;
};

export type RightFloatingSidebarProps = {
  /** Optional: Layout section content (e.g. OrganPanel) */
  layoutPanelContent?: React.ReactNode;
  /** Optional: Screen tree for palette panel full-page live preview (same as passed to ExperienceRenderer). */
  palettePreviewScreen?: any;
  /** Optional: Props for rendering ExperienceRenderer in the palette preview (when palettePreviewScreen is set). */
  palettePreviewProps?: PalettePreviewProps;
};

function RightFloatingSidebarInner({ layoutPanelContent, palettePreviewScreen, palettePreviewProps }: RightFloatingSidebarProps) {
  const { openPanel, togglePanel } = useDockState();
  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const currentHref = typeof window !== "undefined" ? window.location.href : "";
  useSyncExternalStore(subscribePalette, getPaletteName, () => "default");
  const [paletteViewMode, setPaletteViewMode] = useState<"live" | "swatches">("swatches");
  const experience = (stateSnapshot?.values?.experience ?? "website") as string;
  const layoutMode = (stateSnapshot?.values?.layoutMode ?? "template") as string;
  const templateId = (stateSnapshot?.values?.templateId ?? "") as string;
  const paletteName = (stateSnapshot?.values?.paletteName ?? getPaletteName()) || "default";
  const stylingPreset = (stateSnapshot?.values?.stylingPreset ?? "default") as string;
  const behaviorProfile = (stateSnapshot?.values?.behaviorProfile ?? "default") as string;
  const templateList = getTemplateList();

  const activePalette = (palettes as Record<string, any>)[paletteName] ?? null;

  const setValue = (key: string, value: string) => {
    dispatchState("state.update", { key, value });
  };
  const handlePaletteChange = (name: string) => {
    if (process.env.NODE_ENV !== "production") console.log("[palette] click", name);
    if (!(name in palettes)) return;
    setValue("paletteName", name);
    if (process.env.NODE_ENV !== "production") console.log("[palette] state.update dispatched paletteName", name);
    setPalette(name);
    if (process.env.NODE_ENV !== "production") console.log("[palette] setPalette called", name);
  };

  const isPanelOpen = (id: DockPanelId) => openPanel === id;
  const pills = PILL_CONFIG;

  const activeLabel = openPanel ? PILL_CONFIG.find((p) => p.id === openPanel)?.label : null;

  const headerHeight = 56;
  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: headerHeight,
        height: `calc(100vh - ${headerHeight}px)`,
        width: openPanel ? FLOATING_PANEL_WIDTH + RAIL_WIDTH : RAIL_WIDTH,
        minWidth: openPanel ? undefined : RAIL_WIDTH,
        display: "flex",
        flexDirection: "row",
        zIndex: 900,
        transition: "width 0.2s ease",
      }}
    >
      {/* Docked panel — full height, scrollable content; minWidth:0 so flex children can use full width */}
      <div
        style={{
          width: openPanel ? FLOATING_PANEL_WIDTH : 0,
          minWidth: 0,
          flexShrink: 0,
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
            <div style={{ padding: "12px 16px", overflowY: "auto", overflowX: "visible", height: "100%", flex: 1, minHeight: 0, minWidth: 0, fontFamily: GOOGLE.fontFamily }}>
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
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <PaletteContractInspector palette={activePalette} />
                {palettePreviewScreen != null && palettePreviewProps != null && (
                  <div style={{ display: "flex", gap: "var(--spacing-2)", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: GOOGLE.textSecondary, fontWeight: 500 }}>Mode:</span>
                    {(["live", "swatches"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaletteViewMode(mode)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          border: "none",
                          background: paletteViewMode === mode ? "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)" : GOOGLE.surfaceHover,
                          color: paletteViewMode === mode ? "#fff" : GOOGLE.textPrimary,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                          boxShadow: paletteViewMode === mode ? "0 2px 6px rgba(59, 130, 246, 0.35)" : "none",
                          transition: "background 0.2s ease, box-shadow 0.2s ease",
                          textTransform: "capitalize",
                        }}
                      >
                        {mode === "live" ? "Live" : "Swatches"}
                      </button>
                    ))}
                  </div>
                )}
                {paletteViewMode === "live" && palettePreviewScreen != null && palettePreviewProps != null && (
                  <div
                    style={{
                      maxHeight: "50vh",
                      minHeight: 120,
                      overflowY: "auto",
                      overflowX: "hidden",
                      borderRadius: GOOGLE.radius,
                      border: `1px solid ${GOOGLE.border}`,
                      background: GOOGLE.surface,
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      padding: "8px",
                    }}
                  >
                    {PALETTE_NAMES.map((name) => {
                      const isActive = paletteName === name;
                      return (
                        <div
                          key={name}
                          style={{
                            border: `1px solid ${isActive ? GOOGLE.primary : GOOGLE.border}`,
                            borderRadius: GOOGLE.radius,
                            overflow: "hidden",
                            background: GOOGLE.surface,
                          }}
                        >
                          <div
                            style={{
                              padding: "6px 10px",
                              borderBottom: `1px solid ${GOOGLE.border}`,
                              fontSize: 12,
                              fontWeight: 600,
                              color: GOOGLE.textPrimary,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span style={{ textTransform: "capitalize" }}>{name}</span>
                            <button
                              type="button"
                              onClick={() => handlePaletteChange(name)}
                              style={{
                                padding: "4px 10px",
                                borderRadius: 6,
                                border: "none",
                                background: isActive ? GOOGLE.primary : GOOGLE.surfaceHover,
                                color: isActive ? "#fff" : GOOGLE.textPrimary,
                                fontSize: 11,
                                fontWeight: 500,
                                cursor: "pointer",
                              }}
                            >
                              {isActive ? "Selected" : "Use"}
                            </button>
                          </div>
                          <div
                            style={{
                              minHeight: 180,
                              maxHeight: 280,
                              overflow: "auto",
                            }}
                          >
                            <PaletteFullPreviewFrame paletteName={name}>
                              <ExperienceRenderer
                                key={`palette-preview-${name}`}
                                node={
                                  typeof structuredClone === "function"
                                    ? structuredClone(palettePreviewScreen)
                                    : JSON.parse(JSON.stringify(palettePreviewScreen))
                                }
                                defaultState={palettePreviewProps.defaultState}
                                profileOverride={palettePreviewProps.profileOverride}
                                sectionLayoutPresetOverrides={palettePreviewProps.sectionLayoutPresetOverrides}
                                cardLayoutPresetOverrides={palettePreviewProps.cardLayoutPresetOverrides}
                                organInternalLayoutOverrides={palettePreviewProps.organInternalLayoutOverrides}
                                screenId={palettePreviewProps.screenKey}
                                behaviorProfile={palettePreviewProps.behaviorProfile}
                                experience={palettePreviewProps.experience}
                                sectionKeys={palettePreviewProps.sectionKeys}
                                sectionLabels={palettePreviewProps.sectionLabels}
                                paletteOverride={name}
                              />
                            </PaletteFullPreviewFrame>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {(paletteViewMode === "swatches" || palettePreviewScreen == null || palettePreviewProps == null) && (
                  <>
                    <div style={{ fontSize: 12, color: GOOGLE.textSecondary, marginBottom: "4px", fontWeight: 500 }}>
                      {palettePreviewScreen != null && palettePreviewProps != null ? "Swatches" : "Live preview"}
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
                  </>
                )}
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
                <div style={{ width: "100%", maxWidth: "none", minWidth: 0, flex: 1, overflowX: "visible", overflowY: "visible", display: "flex", flexDirection: "column" }}>
                  {layoutPanelContent}
                </div>
              ) : (
                <div style={{ padding: "16px 0", fontSize: 14, color: GOOGLE.textSecondary, lineHeight: 1.5 }}>
                  Layout controls appear when a website-style screen is loaded.
                </div>
              )
            )}
            {openPanel === "newInterface" && (
              <CreateNewInterfacePanel />
            )}
            {openPanel === "expand" && (
              <div style={{ fontSize: 14, color: GOOGLE.textSecondary }}>
                Large overlay opens above. Click Expand again to close.
              </div>
            )}
            </div>
          </>
        )}
      </div>

      {/* Expand overlay: fullscreen iframe with same screen (same state bindings, no new state) */}
      {openPanel === "expand" && currentHref && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: GOOGLE.surface,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              flexShrink: 0,
              padding: "8px 16px",
              borderBottom: `1px solid ${GOOGLE.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: GOOGLE.surface,
            }}
          >
            <span style={{ fontSize: 14, color: GOOGLE.textPrimary, fontWeight: 500 }}>Expanded view (same screen)</span>
            <button
              type="button"
              onClick={() => togglePanel("expand")}
              style={{
                padding: "8px 16px",
                borderRadius: GOOGLE.radius,
                border: "none",
                background: GOOGLE.primary,
                color: "#fff",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
          <iframe
            title="Expanded editor"
            src={currentHref}
            style={{
              flex: 1,
              width: "100%",
              border: "none",
              minHeight: 0,
            }}
          />
        </div>
      )}

      {/* Icon rail — 44px, 10px gap, subtle hover/active */}
      <div style={RAIL_STYLE}>
        {pills.map(({ id, label }) => {
          const isActive = isPanelOpen(id);
          const iconName = getAppIconNameForPanel(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => togglePanel(id)}
              title={label}
              aria-label={label}
              aria-pressed={isActive}
              style={{
                ...ICON_BUTTON_BASE,
                background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
                boxShadow: isActive ? "inset 0 0 0 1px rgba(255,255,255,0.08)" : "none",
                color: GOOGLE.textSecondary,
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
              {iconName ? <AppIcon name={iconName} color={GOOGLE.textSecondary} /> : null}
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
