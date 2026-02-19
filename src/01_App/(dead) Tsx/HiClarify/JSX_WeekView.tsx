"use client";

import React, { useEffect } from "react";
import { getState } from "@/state/state-store";
import { runAction } from "@/logic/runtime/action-runner";
import { useWeekViewModel } from "./usePlannerViewModels";
import { addDays, toKey, fromHM } from "@/logic/planner/date-helpers";
import { effectivePriority } from "@/logic/engines/structure/prioritization.engine";
import type { StructureItem, Block } from "@/logic/engines/structure/structure.types";
import { ViewSwitcherLinks } from "./ViewSwitcherLinks";

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
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
  },
  dayLink: {
    fontSize: "var(--font-size-sm)",
    color: "var(--color-primary)",
    background: "none",
    border: "none",
    cursor: "pointer",
    textDecoration: "underline",
    padding: 0,
  },
  section: {
    padding: "var(--spacing-lg)",
    maxWidth: 1200,
    margin: "0 auto",
  },
  gridWrap: {
    overflowX: "auto",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    background: "var(--color-bg-primary)",
  },
  timeGrid: {
    display: "grid",
    minWidth: 800,
  },
  timeAxis: {
    position: "sticky",
    left: 0,
    zIndex: 5,
    background: "var(--color-bg-secondary)",
    borderRight: "1px solid var(--color-border)",
    fontSize: "var(--font-size-xs)",
    color: "var(--color-text-muted)",
  },
  timeSlot: {
    height: 32,
    paddingLeft: "var(--spacing-xs)",
    lineHeight: "32px",
    boxSizing: "border-box",
  },
  dayCol: {
    minWidth: 0,
    borderRight: "1px solid var(--color-border)",
  },
  dayColLast: {
    borderRight: "none",
  },
  dayHeader: {
    position: "sticky",
    top: 0,
    zIndex: 4,
    background: "var(--color-surface-1)",
    borderBottom: "1px solid var(--color-border)",
    padding: "var(--spacing-sm)",
    fontSize: "var(--font-size-xs)",
    fontWeight: "var(--font-weight-medium)",
    color: "var(--color-text-muted)",
    textAlign: "center",
  },
  dayHeaderToday: {
    color: "var(--color-primary)",
    fontWeight: "var(--font-weight-semibold)",
  },
  dayColContent: {
    position: "relative",
    minHeight: 576,
  },
  blockSlot: {
    position: "absolute",
    left: 2,
    right: 2,
    background: "var(--color-primary)",
    opacity: 0.85,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    padding: "2px 6px",
    fontSize: "var(--font-size-xs)",
    color: "var(--color-on-primary, #fff)",
    overflow: "hidden",
    boxSizing: "border-box",
  },
  taskChip: {
    fontSize: "var(--font-size-xs)",
    padding: "2px 6px",
    marginBottom: 2,
    borderRadius: "var(--radius-sm)",
    background: "var(--color-surface-1)",
    border: "1px solid var(--color-border)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};

const DAY_START_MIN = 6 * 60;
const DAY_END_MIN = 24 * 60;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 32;
const TOTAL_SLOTS = (DAY_END_MIN - DAY_START_MIN) / SLOT_MINUTES;

function blockToPosition(block: { start: string; end: string }) {
  const startMin = Math.max(DAY_START_MIN, fromHM(block.start));
  const endMin = Math.min(DAY_END_MIN, fromHM(block.end));
  const top = ((startMin - DAY_START_MIN) / (DAY_END_MIN - DAY_START_MIN)) * 100;
  const height = ((endMin - startMin) / (DAY_END_MIN - DAY_START_MIN)) * 100;
  return { top: `${top}%`, height: `${height}%` };
}

function formatDayShort(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  const today = toKey(new Date());
  if (iso === today) return "Today";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
}

function formatWeekRange(weekDates: string[]): string {
  if (weekDates.length < 2) return "";
  const first = new Date(weekDates[0] + "T12:00:00");
  const last = new Date(weekDates[6] + "T12:00:00");
  return `${first.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${last.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

function toMin(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
}

export default function JSX_WeekView() {
  const { weekDates, itemsByDay, blocksByDay, rules } = useWeekViewModel();

  useEffect(() => {
    runAction({ name: "calendar:setWeek" }, getState() ?? {});
  }, []);

  const weekStart = weekDates[0];
  const today = toKey(new Date());

  const goPrev = () => {
    if (!weekStart) return;
    const d = new Date(weekStart + "T12:00:00");
    runAction({ name: "calendar:setWeek", date: toKey(addDays(d, -7)) }, getState() ?? {});
  };
  const goNext = () => {
    if (!weekStart) return;
    const d = new Date(weekStart + "T12:00:00");
    runAction({ name: "calendar:setWeek", date: toKey(addDays(d, 7)) }, getState() ?? {});
  };
  const goThisWeek = () => {
    runAction({ name: "calendar:setWeek" }, getState() ?? {});
  };
  const goToDay = (dateKey: string) => {
    runAction({ name: "calendar:setDay", date: dateKey }, getState() ?? {});
  };

  const timeSlots = Array.from({ length: TOTAL_SLOTS + 1 }, (_, i) => {
    const min = DAY_START_MIN + i * SLOT_MINUTES;
    if (min >= DAY_END_MIN) return null;
    return toMin(min);
  }).filter(Boolean) as string[];

  return (
    <div style={styles.screen}>
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)", flexWrap: "wrap" }}>
          <button type="button" style={styles.navBtn} onClick={goPrev} aria-label="Previous week">
            ‹
          </button>
          <button type="button" style={styles.title} onClick={goThisWeek} aria-label="Current week">
            {formatWeekRange(weekDates)}
          </button>
          <button type="button" style={styles.navBtn} onClick={goNext} aria-label="Next week">
            ›
          </button>
          <ViewSwitcherLinks currentView="week" />
          <button
            type="button"
            style={styles.dayLink}
            onClick={() => goToDay(weekDates[0] ?? today)}
            aria-label="Daily schedule"
          >
            Daily schedule
          </button>
        </div>
      </header>

      <section style={styles.section}>
        <div style={styles.gridWrap}>
          <div
            style={{
              ...styles.timeGrid,
              gridTemplateColumns: `80px repeat(${weekDates.length}, minmax(100px, 1fr))`,
              gridTemplateRows: `auto repeat(${timeSlots.length}, ${SLOT_HEIGHT}px)`,
            }}
          >
            {/* Corner */}
            <div style={{ ...styles.timeAxis, gridColumn: 1, gridRow: 1, minHeight: 44, borderBottom: "1px solid var(--color-border)" }} />
            {/* Day headers */}
            {weekDates.map((dateKey, i) => (
              <div
                key={dateKey}
                style={{
                  ...styles.dayHeader,
                  ...(dateKey === today ? styles.dayHeaderToday : {}),
                  gridColumn: i + 2,
                  gridRow: 1,
                }}
              >
                {formatDayShort(dateKey)}
              </div>
            ))}
            {/* Time axis cells */}
            {timeSlots.map((label, rowIdx) => (
              <div
                key={label}
                style={{
                  ...styles.timeAxis,
                  ...styles.timeSlot,
                  gridColumn: 1,
                  gridRow: rowIdx + 2,
                }}
              >
                {label}
              </div>
            ))}
            {/* Day columns: time strip + blocks */}
            {weekDates.map((dateKey, colIdx) => (
              <div
                key={dateKey}
                style={{
                  ...styles.dayCol,
                  ...(colIdx === weekDates.length - 1 ? styles.dayColLast : {}),
                  gridColumn: colIdx + 2,
                  gridRow: `2 / -1`,
                }}
              >
                <div style={{ ...styles.dayColContent, height: timeSlots.length * SLOT_HEIGHT }}>
                  {(blocksByDay[dateKey] ?? []).map((block, bi) => {
                    const pos = blockToPosition(block);
                    return (
                      <div
                        key={block.id ?? bi}
                        style={{
                          ...styles.blockSlot,
                          top: pos.top,
                          height: pos.height,
                          minHeight: 18,
                        }}
                        title={`${block.label ?? "—"} ${block.start} – ${block.end}`}
                      >
                        {block.label ?? "—"}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks per day (below grid, same style as before) */}
        <div style={{ marginTop: "var(--spacing-lg)", display: "grid", gridTemplateColumns: `repeat(${weekDates.length}, 1fr)`, gap: "var(--spacing-md)" }}>
          {weekDates.map((dateKey) => {
            const items = itemsByDay[dateKey] ?? [];
            const refDate = new Date(dateKey + "T12:00:00");
            return (
              <div key={dateKey}>
                <div style={{ ...styles.dayHeader, marginBottom: "var(--spacing-xs)", textAlign: "left" }}>
                  {formatDayShort(dateKey)} — tasks
                </div>
                {items.length === 0 ? (
                  <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", margin: 0 }}>No tasks</p>
                ) : (
                  items.map((item: StructureItem) => (
                    <div key={item.id} style={styles.taskChip} title={item.title}>
                      <span style={{ marginRight: 4, color: "var(--color-text-muted)" }}>
                        P{effectivePriority(item, refDate, rules)}
                      </span>
                      {item.title}
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
