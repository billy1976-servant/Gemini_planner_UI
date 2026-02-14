/**
 * Pipeline Diagnostics Rail — left-side icon rail (mirror of right sidebar).
 * Exactly two buttons: Diagnostics (panel with tabs on top), Inspector (single panel).
 * Click icon → pop-out panel; close via icon again or X.
 * Does NOT touch the right sidebar. UI shell only; diagnostics logic unchanged.
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { getState, subscribeState } from "@/state/state-store";
import { getPaletteName } from "@/engine/core/palette-store";
import { getLayout, subscribeLayout } from "@/engine/core/layout-store";
import { getDevicePreviewMode, subscribeDevicePreviewMode } from "@/dev/device-preview-store";
import { getInspectMode, setInspectMode, getHoveredId, setHoveredId, getPinnedId, setPinnedId, subscribe } from "@/diagnostics/inspectorStore";
import { palettes } from "@/palettes";
import AppIcon from "@/04_Presentation/icons/AppIcon";
import type { AppIconName } from "@/04_Presentation/icons/AppIcon";
import PaletteContractInspector from "@/04_Presentation/diagnostics/PaletteContractInspector";
import PipelineFlowPanel from "@/diagnostics/PipelineFlowPanel";
import LayoutDiagnosticsPanel from "@/diagnostics/LayoutDiagnosticsPanel";
import SpacingAuditPanel from "@/diagnostics/SpacingAuditPanel";
import InspectorOverlay from "@/diagnostics/InspectorOverlay";
import InteractionTracerPanel from "@/devtools/InteractionTracerPanel";

const RAIL_WIDTH = 48;
const PANEL_WIDTH = 360;
const HEADER_HEIGHT = 56;

/** Which panel is open: diagnostics (with tabs), inspector, or debugger */
export type PanelId = "diagnostics" | "inspector" | "debugger";

/** Tab inside the Diagnostics panel */
export type TabId = "pipeline" | "layout" | "palette" | "spacing";

const DIAGNOSTICS_TABS: Array<{ id: TabId; label: string }> = [
  { id: "pipeline", label: "Pipeline" },
  { id: "layout", label: "Layout" },
  { id: "palette", label: "Palette" },
  { id: "spacing", label: "Spacing" },
];

/** Left sidebar rail buttons: Diagnostics, Inspector, Debugger */
const RAIL_BUTTONS: Array<{ id: PanelId; label: string; icon: AppIconName }> = [
  { id: "diagnostics", label: "Pipeline Diagnostics", icon: "Zap" },
  { id: "inspector", label: "Inspector", icon: "Search" },
  { id: "debugger", label: "Debugger", icon: "BarChart" },
];

/* Match right sidebar: Material surface, shadow, transitions */
const THEME = {
  primary: "#1a73e8",
  primaryBg: "#e8f0fe",
  surface: "#ffffff",
  surfaceHover: "#f1f3f4",
  border: "#dadce0",
  textPrimary: "#202124",
  textSecondary: "#5f6368",
  fontFamily: "'Google Sans', 'Roboto', system-ui, sans-serif",
  radius: 8,
  shadow: "0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)",
};

const RAIL_STYLE: React.CSSProperties = {
  width: RAIL_WIDTH,
  flexShrink: 0,
  padding: "8px 0",
  background: THEME.surface,
  borderRight: `1px solid ${THEME.border}`,
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  gap: "6px",
  alignItems: "center",
  boxShadow: THEME.shadow,
};

const ICON_BUTTON_BASE: React.CSSProperties = {
  width: 40,
  height: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: THEME.radius,
  cursor: "pointer",
  background: "transparent",
  border: "none",
  transition: "background 0.12s ease, transform 0.06s ease",
};

export default function PipelineDiagnosticsRail() {
  const [openPanel, setOpenPanel] = useState<PanelId | null>(null);
  const [diagnosticsTab, setDiagnosticsTab] = useState<TabId>("pipeline");

  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const layoutSnapshot = useSyncExternalStore(subscribeLayout, getLayout, getLayout);
  const deviceMode = useSyncExternalStore(subscribeDevicePreviewMode, getDevicePreviewMode, getDevicePreviewMode);
  const paletteName = (stateSnapshot?.values?.paletteName ?? getPaletteName()) || "default";
  const activePalette = (palettes as Record<string, unknown>)[paletteName] ?? null;
  const templateId = (stateSnapshot?.values?.templateId ?? (layoutSnapshot as { templateId?: string })?.templateId) ?? "";
  const inspectMode = useSyncExternalStore(subscribe, getInspectMode, getInspectMode);
  const hoveredId = useSyncExternalStore(subscribe, getHoveredId, getHoveredId);
  const pinnedId = useSyncExternalStore(subscribe, getPinnedId, getPinnedId);

  const pipelineContext = {
    screenId: (stateSnapshot?.values?.currentView as string) ?? (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("screen") ?? "unknown" : "unknown"),
    layoutId: templateId || "default",
    deviceMode: deviceMode ?? "Desktop",
  };

  const togglePanel = useCallback((id: PanelId) => {
    setOpenPanel((prev) => (prev === id ? null : id));
  }, []);

  const closePanel = useCallback(() => setOpenPanel(null), []);

  const activeRailLabel = openPanel ? RAIL_BUTTONS.find((b) => b.id === openPanel)?.label ?? "" : "";

  // When Inspector panel is open and inspect mode on, wire hover/pin from document to inspector store
  useEffect(() => {
    if (openPanel !== "inspector" || !inspectMode) return;
    const onMove = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const withId = el?.closest?.("[data-hi-id]");
      const id = withId?.getAttribute?.("data-hi-id") ?? null;
      setHoveredId(id);
    };
    const onClick = (e: MouseEvent) => {
      const withId = document.elementFromPoint(e.clientX, e.clientY)?.closest?.("[data-hi-id]");
      const id = withId?.getAttribute?.("data-hi-id") ?? null;
      const prev = getPinnedId();
      setPinnedId(prev === id ? null : id);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("click", onClick);
    };
  }, [openPanel, inspectMode]);

  const diagnosticsBodyContent =
    diagnosticsTab === "pipeline" ? (
      <PipelineFlowPanel />
    ) : diagnosticsTab === "layout" ? (
      <LayoutDiagnosticsPanel />
    ) : diagnosticsTab === "palette" ? (
      <PaletteContractInspector
        palette={activePalette}
        paletteName={paletteName}
        pipelineContext={pipelineContext}
      />
    ) : (
      <SpacingAuditPanel />
    );

  const panelContent =
    openPanel === "diagnostics" ? (
      <>
        {/* Tabs on top */}
        <div
          style={{
            flexShrink: 0,
            padding: "8px 16px 0",
            borderBottom: `1px solid ${THEME.border}`,
            background: THEME.surface,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {DIAGNOSTICS_TABS.map(({ id, label }) => {
            const on = diagnosticsTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setDiagnosticsTab(id)}
                aria-pressed={on}
                style={{
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: 500,
                  border: `1px solid ${on ? THEME.primary : THEME.border}`,
                  borderRadius: THEME.radius,
                  background: on ? THEME.primaryBg : THEME.surface,
                  color: on ? THEME.primary : THEME.textPrimary,
                  cursor: "pointer",
                  fontFamily: THEME.fontFamily,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            padding: 16,
            fontFamily: THEME.fontFamily,
            fontSize: 14,
          }}
        >
          {diagnosticsBodyContent}
        </div>
      </>
    ) : openPanel === "inspector" ? (
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          padding: 16,
          fontFamily: THEME.fontFamily,
          fontSize: 14,
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            <input
              type="checkbox"
              checked={inspectMode}
              onChange={(e) => setInspectMode(e.target.checked)}
            />
            <span>Inspect mode (hover/click elements to inspect)</span>
          </label>
        </div>
        <InspectorOverlay
          enabled={inspectMode}
          hoveredId={hoveredId}
          pinnedId={pinnedId}
          onPin={setPinnedId}
          onClear={() => {
            setPinnedId(null);
            setHoveredId(null);
          }}
          embedded
        />
      </div>
    ) : openPanel === "debugger" ? (
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "#0d0d0d",
        }}
      >
        <InteractionTracerPanel embedded />
      </div>
    ) : null;

  const rail = (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: HEADER_HEIGHT,
        height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        width: openPanel ? RAIL_WIDTH + PANEL_WIDTH : RAIL_WIDTH,
        display: "flex",
        flexDirection: "row",
        zIndex: 899,
        pointerEvents: "auto",
        transition: "width 0.2s ease",
      }}
      data-pipeline-diagnostics-rail
    >
      {/* Icon rail — exactly two buttons, like right sidebar */}
      <div style={RAIL_STYLE}>
        {RAIL_BUTTONS.map(({ id, label, icon }) => {
          const isActive = openPanel === id;
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
                background: isActive ? "rgba(0,0,0,0.06)" : "transparent",
                boxShadow: isActive ? "inset 0 0 0 1px rgba(0,0,0,0.08)" : "none",
                color: THEME.textSecondary,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(0,0,0,0.04)";
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
              <AppIcon name={icon} color={THEME.textSecondary} size={20} />
            </button>
          );
        })}
      </div>

      {/* Pop-out panel — same overlay feel as right sidebar */}
      <div
        style={{
          width: openPanel ? PANEL_WIDTH : 0,
          minWidth: 0,
          flexShrink: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: THEME.surface,
          borderRight: `1px solid ${THEME.border}`,
          boxShadow: THEME.shadow,
          transition: "width 0.2s ease",
        }}
      >
        {openPanel && (
          <>
            {/* Top bar: panel title + close */}
            <div
              style={{
                padding: "12px 16px",
                borderBottom: `1px solid ${THEME.border}`,
                flexShrink: 0,
                background: THEME.surface,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 500,
                  color: THEME.textPrimary,
                  fontFamily: THEME.fontFamily,
                }}
              >
                {activeRailLabel}
              </h3>
              <button
                type="button"
                onClick={closePanel}
                title="Close"
                aria-label="Close panel"
                style={{
                  ...ICON_BUTTON_BASE,
                  width: 32,
                  height: 32,
                  color: THEME.textSecondary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = THEME.surfaceHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Body: tabs on top for Diagnostics, single content for Inspector */}
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {panelContent}
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(rail, document.body);
}
