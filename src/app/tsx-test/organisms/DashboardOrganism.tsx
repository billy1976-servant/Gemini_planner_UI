"use client";

import React from "react";
import { useSyncExternalStore } from "react";
import { ToolbarOrgan, SidebarOrgan, GridLayoutOrgan, WidgetCellOrgan } from "@/components/organs/tsx-organs";
import { getState, subscribeState } from "@/state/state-store";
import { createOnAction } from "./shared";

const SCREEN_KEY = "tsx-dashboard";

export function DashboardOrganism() {
  const state = useSyncExternalStore(subscribeState, getState, getState);
  const onAction = React.useMemo(() => createOnAction(), []);
  const layout = state?.dashboardLayout?.[SCREEN_KEY]?.widgets ?? [];

  return (
    <>
      <ToolbarOrgan
        organId="toolbar"
        slots={{
          "toolbar.actions": (
            <button type="button" onClick={() => onAction("dashboard:addWidget", { screenKey: SCREEN_KEY, widgetId: `w-${Date.now()}`, rect: { x: 0, y: 0, w: 2, h: 1 } })}>
              Add widget
            </button>
          ),
          "toolbar.breadcrumb": <span>Home / Dashboard</span>,
          "toolbar.viewToggles": <span>View</span>,
        }}
        onAction={onAction}
      />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <SidebarOrgan organId="sidebar" slots={{ "sidebar.content": <div>Dashboard nav</div> }} onAction={onAction} />
        <div style={{ flex: 1, padding: "1rem", display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 8, alignContent: "start" }}>
          {layout.map((w) => (
            <div
              key={w.id}
              style={{
                gridColumn: `span ${w.w}`,
                gridRow: `span ${w.h}`,
                minHeight: 60,
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: "0.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Widget {w.id}</span>
              <button type="button" onClick={() => onAction("dashboard:removeWidget", { screenKey: SCREEN_KEY, widgetId: w.id })}>
                Remove
              </button>
            </div>
          ))}
          {layout.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: "1rem", color: "#666" }}>
              No widgets. Click &quot;Add widget&quot; in the toolbar.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
