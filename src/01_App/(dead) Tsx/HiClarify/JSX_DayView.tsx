"use client";

import React, { useEffect } from "react";
import { getState } from "@/state/state-store";
import { runAction } from "@/logic/runtime/action-runner";
import { useDayViewModel } from "./usePlannerViewModels";
import { addDays, toKey } from "@/logic/planner/date-helpers";
import { effectivePriority } from "@/logic/engines/structure/prioritization.engine";
import type { StructureItem } from "@/logic/engines/structure/structure.types";
import { ViewSwitcherLinks } from "./ViewSwitcherLinks";
import { blockToPosition, TIMELINE_GRID_HEIGHT } from "./planner-timeline-constants";

const styles: Record<string, React.CSSProperties> = {
  screen: {
    minHeight: "100vh",
    background: "var(--color-bg-primary)",
    color: "var(--color-text-primary)",
    fontFamily: "var(--font-family-base, var(--font-family-sans), system-ui, sans-serif)",
  },
  header: {
    position: "sticky",
    top: 0,
    background: "var(--color-surface-1)",
    borderBottom: "1px solid var(--color-border)",
    zIndex: 10,
    padding: "var(--spacing-md) var(--spacing-lg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "var(--spacing-md)",
  },
  navBtn: {
    width: 36,
    height: 36,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    background: "var(--color-bg-secondary)",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    fontSize: "var(--font-size-sm)",
    color: "var(--color-text-primary)",
  },
  title: {
    fontSize: "var(--font-size-base)",
    fontWeight: "var(--font-weight-semibold)",
    color: "var(--color-text-primary)",
  },
  section: {
    padding: "var(--spacing-lg)",
    maxWidth: 896,
    margin: "0 auto",
  },
  sectionTitle: {
    fontSize: "var(--font-size-sm)",
    fontWeight: "var(--font-weight-medium)",
    color: "var(--color-text-muted)",
    marginBottom: "var(--spacing-sm)",
  },
  blockRow: {
    display: "flex",
    alignItems: "center",
    gap: "var(--spacing-md)",
    padding: "var(--spacing-sm) 0",
    borderBottom: "1px solid var(--color-border)",
    fontSize: "var(--font-size-sm)",
  },
  taskCard: {
    background: "var(--color-bg-secondary)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    padding: "var(--spacing-md)",
    marginBottom: "var(--spacing-sm)",
    fontSize: "var(--font-size-sm)",
  },
  priorityBadge: {
    display: "inline-block",
    padding: "2px 6px",
    borderRadius: "var(--radius-sm)",
    fontSize: "var(--font-size-xs)",
    marginRight: "var(--spacing-sm)",
    background: "var(--color-surface-1)",
    color: "var(--color-text-secondary)",
  },
  dayGrid: {
    position: "relative",
    minHeight: 400,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    overflow: "hidden",
  },
  blockSlot: {
    position: "absolute",
    left: 8,
    right: 8,
    background: "var(--color-surface-1)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    padding: "4px 8px",
    fontSize: "var(--font-size-sm)",
    overflow: "hidden",
    boxSizing: "border-box",
  },
};

function formatHeaderDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  const today = toKey(new Date());
  if (iso === today) return "Today";
  const yesterday = toKey(addDays(new Date(), -1));
  if (iso === yesterday) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export type JSX_DayViewProps = {
  /** When true, render only grid + tasks (no screen wrapper or header). For use inside unified PlannerRoot. */
  embedded?: boolean;
};

export default function JSX_DayView({ embedded = false }: JSX_DayViewProps) {
  const { selectedDate, blocks, items, rules, refDate, treeFolders, scheduledSection } = useDayViewModel();

  // Bootstrap: load ruleset and ensure taskTemplateRows when empty
  useEffect(() => {
    const state = getState() ?? {};
    if (!(rules && typeof rules === "object" && Object.keys(rules).length > 0)) {
      fetch("/api/rulesets/base")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data === "object")
            runAction({ name: "structure:loadRuleset", rules: data }, getState() ?? {});
        })
        .catch(() => {});
    }
    runAction({ name: "structure:ensureTaskTemplateRows" }, state);
  }, [rules]);

  const goPrev = () => {
    const d = new Date(selectedDate + "T12:00:00");
    runAction({ name: "calendar:setDay", date: toKey(addDays(d, -1)) }, getState() ?? {});
  };
  const goNext = () => {
    const d = new Date(selectedDate + "T12:00:00");
    runAction({ name: "calendar:setDay", date: toKey(addDays(d, 1)) }, getState() ?? {});
  };
  const goToday = () => {
    runAction({ name: "calendar:setDay", date: toKey(new Date()) }, getState() ?? {});
  };

  const cancelDay = () => {
    runAction({ name: "structure:cancelDay", date: selectedDate }, getState() ?? {});
  };

  const setSection = (section: string) => {
    runAction({ name: "structure:setScheduledSection", section: section || undefined }, getState() ?? {});
  };

  const gridContent = (
    <>
      <div style={{ ...styles.dayGrid, height: TIMELINE_GRID_HEIGHT }}>
        {blocks.map((b, i) => {
            const pos = blockToPosition(b);
            return (
              <div
                key={b.id ?? i}
                style={{
                  ...styles.blockSlot,
                  top: pos.top,
                  height: pos.height,
                  minHeight: 20,
                }}
                title={`${b.start} – ${b.end}`}
              >
                {b.label ?? "—"}
              </div>
            );
          })}
      </div>
      {blocks.length === 0 && (
        <p style={{ marginTop: 8, color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
          No blocks for this day. Add blocks via structure:setBlocksForDate.
        </p>
      )}
      <section style={embedded ? { ...styles.section, padding: "var(--spacing-md) 0" } : styles.section}>
        <h2 style={styles.sectionTitle}>Tasks ({items.length})</h2>
        {items.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
            No tasks due this day.
          </p>
        ) : (
          items.map((item: StructureItem) => (
            <div key={item.id} style={styles.taskCard}>
              <span style={styles.priorityBadge}>P{effectivePriority(item, refDate, rules)}</span>
              <span>{item.title}</span>
              {item.dueDate && (
                <span style={{ marginLeft: "var(--spacing-sm)", color: "var(--color-text-muted)", fontSize: "var(--font-size-xs)" }}>
                  {item.dueDate}
                </span>
              )}
            </div>
          ))
        )}
      </section>
    </>
  );

  if (embedded) {
    return (
      <div style={{ minWidth: 0, flex: 1, height: "100%", minHeight: TIMELINE_GRID_HEIGHT }}>
        {gridContent}
      </div>
    );
  }

  return (
    <div style={styles.screen}>
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)", flexWrap: "wrap" }}>
          <button type="button" style={styles.navBtn} onClick={goPrev} aria-label="Previous day">
            ←
          </button>
          <button type="button" style={styles.title} onClick={goToday}>
            {formatHeaderDate(selectedDate)}
          </button>
          <button type="button" style={styles.navBtn} onClick={goNext} aria-label="Next day">
            →
          </button>
          <ViewSwitcherLinks currentView="day" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>Scheduled:</span>
          <select
            value={scheduledSection ?? ""}
            onChange={(e) => setSection(e.target.value)}
            style={{
              fontSize: "var(--font-size-sm)",
              padding: "4px 8px",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-bg-secondary)",
              color: "var(--color-text-primary)",
            }}
            aria-label="Section"
          >
            <option value="">Work day</option>
            {treeFolders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={cancelDay}
            style={{ ...styles.navBtn, fontSize: "var(--font-size-xs)" }}
            aria-label="Cancel day"
          >
            Cancel day
          </button>
        </div>
      </header>
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Day grid</h2>
        {gridContent}
      </section>
    </div>
  );
}
