"use client";

import React, { useState, useEffect } from "react";

/**
 * FocusWorkStudio — focused productivity workspace.
 * Layout: main content area, secondary notes panel, compact activity strip
 * for tasks, time blocks, and quick entries. Uses palette CSS variables.
 * Client-only: renders after mount to avoid SSR/hydration issues.
 */
export default function FocusWorkStudio() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [activeStripTab, setActiveStripTab] = useState<"tasks" | "time" | "quick">("tasks");
  const [noteText, setNoteText] = useState("");
  const [quickEntry, setQuickEntry] = useState("");

  if (!mounted) return null;

  const stripTabs = [
    { id: "tasks" as const, label: "Tasks", short: "T" },
    { id: "time" as const, label: "Time", short: "⏱" },
    { id: "quick" as const, label: "Quick", short: "Q" },
  ];

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "row",
    background: "var(--color-bg-primary, #0f0f14)",
    color: "var(--color-text-primary, #e8e8e8)",
    fontFamily: "var(--font-family-base, var(--font-family-sans), system-ui, sans-serif)",
    boxSizing: "border-box",
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    padding: "var(--spacing-xl, 1.5rem)",
    borderRight: "1px solid var(--color-border, #2a2a32)",
  };

  const notesPanelStyle: React.CSSProperties = {
    width: 280,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    background: "var(--color-bg-secondary, #16161c)",
    borderRight: "1px solid var(--color-border, #2a2a32)",
  };

  const stripStyle: React.CSSProperties = {
    width: 52,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    background: "var(--color-bg-muted, #1a1a22)",
    alignItems: "center",
    padding: "var(--spacing-sm, 0.5rem) 0",
    gap: 4,
  };

  return (
    <div style={containerStyle}>
      {/* Main content area */}
      <main style={mainStyle}>
        <header style={{ marginBottom: "var(--spacing-lg, 1rem)" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "var(--font-size-headline, 1.35rem)",
              fontWeight: "var(--font-weight-bold, 700)",
              color: "var(--color-text-primary)",
            }}
          >
            Focus Work
          </h1>
          <p
            style={{
              margin: "var(--spacing-xs, 0.25rem) 0 0",
              fontSize: "var(--font-size-sm, 0.875rem)",
              color: "var(--color-text-secondary, #9ca3af)",
            }}
          >
            Main content area — your current focus session
          </p>
        </header>
        <section
          style={{
            flex: 1,
            background: "var(--color-surface-1, rgba(255,255,255,0.03))",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md, 8px)",
            padding: "var(--spacing-lg)",
            minHeight: 200,
          }}
        >
          <p style={{ margin: 0, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            Use this space for your primary task: writing, coding, or deep work.
            The notes panel captures side thoughts; the activity strip manages tasks,
            time blocks, and quick entries without leaving the flow.
          </p>
        </section>
      </main>

      {/* Secondary panel — notes */}
      <aside style={notesPanelStyle}>
        <div
          style={{
            padding: "var(--spacing-md) var(--spacing-lg)",
            borderBottom: "1px solid var(--color-border)",
            fontSize: "var(--font-size-sm)",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
          }}
        >
          Notes
        </div>
        <textarea
          placeholder="Capture ideas, links, follow-ups…"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          style={{
            flex: 1,
            minHeight: 120,
            margin: "var(--spacing-md)",
            padding: "var(--spacing-sm) var(--spacing-md)",
            background: "var(--color-bg-primary)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-text-primary)",
            fontSize: "var(--font-size-sm)",
            resize: "none",
            fontFamily: "inherit",
          }}
          aria-label="Notes"
        />
      </aside>

      {/* Compact activity strip — tasks, time blocks, quick entries */}
      <div style={stripStyle} role="tablist" aria-label="Activity strip">
        {stripTabs.map(({ id, label, short }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeStripTab === id}
            aria-label={label}
            title={label}
            onClick={() => setActiveStripTab(id)}
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              borderRadius: "var(--radius-sm, 6px)",
              background: activeStripTab === id ? "var(--color-primary, #3b82f6)" : "transparent",
              color: activeStripTab === id ? "var(--color-on-primary, #fff)" : "var(--color-text-muted, #6b7280)",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.15s ease, color 0.15s ease",
            }}
          >
            {short}
          </button>
        ))}
      </div>

      {/* Activity strip content (could be a slide-out or inline below on small screens) */}
      {activeStripTab === "tasks" && (
        <div
          style={{
            position: "fixed",
            right: 52,
            top: "50%",
            transform: "translateY(-50%)",
            width: 260,
            maxHeight: "70vh",
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--spacing-md)",
            boxShadow: "var(--shadow-lg, 0 10px 40px rgba(0,0,0,0.3))",
            zIndex: 10,
            overflowY: "auto",
          }}
        >
          <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: "var(--spacing-sm)" }}>
            Tasks
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
            <li style={{ padding: "var(--spacing-xs) 0" }}>• Current focus item</li>
            <li style={{ padding: "var(--spacing-xs) 0" }}>• Next up</li>
            <li style={{ padding: "var(--spacing-xs) 0" }}>• Backlog</li>
          </ul>
        </div>
      )}
      {activeStripTab === "time" && (
        <div
          style={{
            position: "fixed",
            right: 52,
            top: "50%",
            transform: "translateY(-50%)",
            width: 260,
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--spacing-md)",
            boxShadow: "var(--shadow-lg, 0 10px 40px rgba(0,0,0,0.3))",
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: "var(--spacing-sm)" }}>
            Time blocks
          </div>
          <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
            9:00 – 11:00 Deep work
          </p>
          <p style={{ margin: "var(--spacing-xs) 0 0", fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
            11:30 – 12:00 Review
          </p>
        </div>
      )}
      {activeStripTab === "quick" && (
        <div
          style={{
            position: "fixed",
            right: 52,
            top: "50%",
            transform: "translateY(-50%)",
            width: 260,
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--spacing-md)",
            boxShadow: "var(--shadow-lg, 0 10px 40px rgba(0,0,0,0.3))",
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: "var(--spacing-sm)" }}>
            Quick entry
          </div>
          <input
            type="text"
            placeholder="Add task or note…"
            value={quickEntry}
            onChange={(e) => setQuickEntry(e.target.value)}
            style={{
              width: "100%",
              padding: "var(--spacing-sm) var(--spacing-md)",
              background: "var(--color-bg-primary)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-text-primary)",
              fontSize: "var(--font-size-sm)",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
            aria-label="Quick entry"
          />
        </div>
      )}
    </div>
  );
}
