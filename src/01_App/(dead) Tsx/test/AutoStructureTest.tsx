"use client";

import React, { useState, useEffect } from "react";
import { useStructureConfig } from "@/lib/tsx-structure/StructureConfigContext";

/**
 * AutoStructureTest — productivity workspace layout for structure/TSX testing.
 * Consumes resolved structure from the envelope (structureType + structureConfig)
 * and renders visibly different layout and chrome based on it.
 * Re-renders when the TSX sidebar Apply button changes structure.
 * Client-only after mount to avoid SSR/hydration mismatch.
 */
const SAMPLE_TASKS = [
  { id: "1", title: "Review design mockups", done: false, time: "09:00" },
  { id: "2", title: "Team standup", done: false, time: "10:00" },
  { id: "3", title: "Deep work block", done: true, time: "11:00" },
  { id: "4", title: "Lunch & walk", done: false, time: "13:00" },
  { id: "5", title: "Ship feature branch", done: false, time: "14:30" },
];

const HOURS = Array.from({ length: 10 }, (_, i) => 8 + i);

export default function AutoStructureTest() {
  const [mounted, setMounted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>("1");

  const resolved = useStructureConfig();
  const structureType = resolved?.structureType ?? "list";
  const structureConfig = resolved?.template ?? {};

  useEffect(() => setMounted(true), []);

  const selected = SAMPLE_TASKS.find((t) => t.id === selectedId);

  if (!mounted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-bg-primary, #0f0f14)",
          color: "var(--color-text-primary, #e8e8e8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-family-base, system-ui, sans-serif)",
        }}
      >
        <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted, #6b7280)" }}>
          Loading…
        </span>
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "var(--color-bg-primary, #0f0f14)",
    color: "var(--color-text-primary, #e8e8e8)",
    fontFamily: "var(--font-family-base, var(--font-family-sans), system-ui, sans-serif)",
    boxSizing: "border-box",
  };

  const headerStyle: React.CSSProperties = {
    flexShrink: 0,
    padding: "var(--spacing-md, 0.75rem) var(--spacing-lg, 1rem)",
    background: "var(--color-surface-1, #16161c)",
    borderBottom: "1px solid var(--color-border, #2a2a32)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const bodyStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "row",
    minHeight: 0,
  };

  const leftStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    padding: "var(--spacing-lg, 1rem)",
    gap: "var(--spacing-lg, 1rem)",
    borderRight: "1px solid var(--color-border, #2a2a32)",
  };

  const panelStyle: React.CSSProperties = {
    background: "var(--color-bg-secondary, #16161c)",
    border: "1px solid var(--color-border, #2a2a32)",
    borderRadius: "var(--radius-md, 8px)",
    overflow: "hidden",
  };

  const taskListStyle: React.CSSProperties = {
    ...panelStyle,
    flex: "0 0 auto",
    maxHeight: 220,
    display: "flex",
    flexDirection: "column",
  };

  const timelineStyle: React.CSSProperties = {
    ...panelStyle,
    flex: 1,
    minHeight: 200,
    display: "flex",
    flexDirection: "column",
  };

  const isTimeline = structureType === "timeline";
  const isBoard = structureType === "board";
  const isDetail = structureType === "detail";
  const detailWidth = isDetail ? 360 : 280;

  const detailPanelStyle: React.CSSProperties = {
    width: detailWidth,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    background: "var(--color-bg-secondary, #16161c)",
    borderLeft: "1px solid var(--color-border, #2a2a32)",
    padding: "var(--spacing-lg, 1rem)",
  };

  const structureLabel = structureType.charAt(0).toUpperCase() + structureType.slice(1);
  const configSnippet =
    typeof structureConfig === "object" && structureConfig !== null
      ? Object.entries(structureConfig)
          .slice(0, 4)
          .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
          .join(" · ")
      : "";

  return (
    <div style={containerStyle}>
      {/* Header — structure badge so sidebar changes are visible */}
      <header style={headerStyle}>
        <h1
          style={{
            margin: 0,
            fontSize: "var(--font-size-headline, 1.25rem)",
            fontWeight: "var(--font-weight-bold, 700)",
            color: "var(--color-text-primary)",
          }}
        >
          Auto Structure Test
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "var(--font-size-sm, 0.875rem)",
              color: "var(--color-text-secondary, #9ca3af)",
            }}
          >
            Productivity workspace
          </span>
          <span
            data-structure-type={structureType}
            style={{
              padding: "4px 10px",
              borderRadius: "var(--radius-md, 8px)",
              background: "var(--color-primary, #3b82f6)",
              color: "var(--color-on-primary, #fff)",
              fontSize: "var(--font-size-xs, 0.75rem)",
              fontWeight: 600,
            }}
          >
            Structure: {structureLabel}
          </span>
          {configSnippet && (
            <span
              style={{
                fontSize: "var(--font-size-xs, 0.75rem)",
                color: "var(--color-text-muted, #6b7280)",
                maxWidth: 240,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={configSnippet}
            >
              {configSnippet}
            </span>
          )}
        </div>
      </header>

      {/* Body: left (tasks + timeline) | right (detail) */}
      <div style={bodyStyle}>
        <div style={leftStyle}>
          {/* Task list */}
          <section style={taskListStyle}>
            <div
              style={{
                padding: "var(--spacing-md) var(--spacing-lg)",
                borderBottom: "1px solid var(--color-border)",
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                color: isBoard ? "var(--color-primary, #3b82f6)" : "var(--color-text-secondary)",
              }}
            >
              {isBoard ? "Tasks (board)" : "Tasks"}
            </div>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: "var(--spacing-sm)",
                overflowY: "auto",
                flex: 1,
                display: isBoard ? "grid" : "block",
                gridTemplateColumns: isBoard ? "repeat(auto-fill, minmax(140px, 1fr))" : undefined,
                gap: isBoard ? "var(--spacing-sm)" : undefined,
              }}
            >
              {SAMPLE_TASKS.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(task.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "var(--spacing-sm) var(--spacing-md)",
                      marginBottom: 2,
                      border: "none",
                      borderRadius: "var(--radius-sm, 6px)",
                      background:
                        selectedId === task.id
                          ? "var(--color-primary-muted, rgba(59, 130, 246, 0.2))"
                          : "transparent",
                      color: "var(--color-text-primary)",
                      fontSize: "var(--font-size-sm)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--spacing-sm)",
                    }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid var(--color-border)",
                        borderRadius: 4,
                        background: task.done ? "var(--color-primary, #3b82f6)" : "transparent",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ textDecoration: task.done ? "line-through" : undefined, opacity: task.done ? 0.7 : 1 }}>
                      {task.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Day timeline — emphasized when structure is timeline */}
          <section
            style={{
              ...timelineStyle,
              flex: isTimeline ? "1 1 60%" : 1,
              borderColor: isTimeline ? "var(--color-primary, #3b82f6)" : undefined,
              borderWidth: isTimeline ? 2 : 1,
            }}
            data-structure-section="timeline"
          >
            <div
              style={{
                padding: "var(--spacing-md) var(--spacing-lg)",
                borderBottom: "1px solid var(--color-border)",
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                color: isTimeline ? "var(--color-primary, #3b82f6)" : "var(--color-text-secondary)",
              }}
            >
              {isTimeline ? "Today (timeline structure)" : "Today"}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "var(--spacing-sm)" }}>
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    minHeight: 40,
                    borderBottom: "1px solid var(--color-border)",
                    gap: "var(--spacing-md)",
                  }}
                >
                  <span
                    style={{
                      width: 36,
                      flexShrink: 0,
                      fontSize: "var(--font-size-xs, 0.75rem)",
                      color: "var(--color-text-muted, #6b7280)",
                    }}
                  >
                    {hour}:00
                  </span>
                  <div
                    style={{
                      flex: 1,
                      minHeight: 32,
                      background: "var(--color-bg-muted, rgba(255,255,255,0.03))",
                      borderRadius: "var(--radius-sm)",
                      border: "1px dashed var(--color-border)",
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right-side detail panel — shows structure config when no task selected */}
        <aside style={detailPanelStyle} data-structure-section="detail">
          <div
            style={{
              fontSize: "var(--font-size-sm)",
              fontWeight: 600,
              color: isDetail ? "var(--color-primary, #3b82f6)" : "var(--color-text-secondary)",
              marginBottom: "var(--spacing-md)",
            }}
          >
            {isDetail ? "Detail (master-detail structure)" : "Details"}
          </div>
          {selected ? (
            <div
              style={{
                background: "var(--color-bg-muted, rgba(255,255,255,0.05))",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "var(--spacing-lg)",
              }}
            >
              <div
                style={{
                  fontSize: "var(--font-size-base)",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  marginBottom: "var(--spacing-sm)",
                }}
              >
                {selected.title}
              </div>
              <dl style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                <dt style={{ marginTop: "var(--spacing-sm)", fontWeight: 500 }}>Time</dt>
                <dd style={{ margin: "2px 0 0" }}>{selected.time}</dd>
                <dt style={{ marginTop: "var(--spacing-sm)", fontWeight: 500 }}>Status</dt>
                <dd style={{ margin: "2px 0 0" }}>{selected.done ? "Done" : "To do"}</dd>
              </dl>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-muted)",
                }}
              >
                Select a task to see details.
              </p>
              {Object.keys(structureConfig).length > 0 && (
                <div
                  style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-muted)",
                    padding: "var(--spacing-sm)",
                    background: "var(--color-bg-muted, rgba(255,255,255,0.05))",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Resolved config</div>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {JSON.stringify(structureConfig, null, 2).slice(0, 400)}
                    {JSON.stringify(structureConfig).length > 400 ? "…" : ""}
                  </pre>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
