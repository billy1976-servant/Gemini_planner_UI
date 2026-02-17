"use client";

import React, { useEffect, useCallback, useState } from "react";
import { getState } from "@/state/state-store";
import { runAction } from "@/logic/runtime/action-runner";
import { useMonthViewModel } from "./usePlannerViewModels";
import type { MonthCell } from "./usePlannerViewModels";
import { toKey, fromHM } from "@/logic/planner/date-helpers";
import type { StructureItem, Block } from "@/logic/engines/structure/structure.types";
import { ViewSwitcherLinks } from "./ViewSwitcherLinks";

/* ------------------ helpers ------------------ */
function dateKeyInRange(key: string, start: string, end: string): boolean {
  const t = new Date(key).getTime();
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  return t >= Math.min(a, b) && t <= Math.max(a, b);
}

/** Map numeric priority (1–10) to band for overlay. */
function priorityBand(p: number): "red" | "yellow" | "green" {
  if (p >= 8) return "red";
  if (p >= 5) return "yellow";
  return "green";
}

function blockHours(blocks: Block[]): number {
  return blocks.reduce((sum, b) => {
    const start = fromHM(b.start);
    const end = fromHM(b.end);
    return sum + (end - start) / 60;
  }, 0);
}

type OverlayType = "none" | "priority" | "health" | "projects";
type RangeMode = "normal" | "range";

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
  weekdays: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "1px",
    padding: "var(--spacing-md) var(--spacing-md) 0",
    maxWidth: 900,
    margin: "0 auto",
    fontSize: "var(--font-size-xs)",
    fontWeight: "var(--font-weight-medium)",
    color: "var(--color-text-muted)",
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "var(--spacing-xs)",
    padding: "var(--spacing-md)",
    maxWidth: 900,
    margin: "0 auto",
  },
  cell: {
    minHeight: 74,
    padding: "var(--spacing-xs)",
    background: "var(--color-bg-primary)",
    fontSize: "var(--font-size-sm)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
  },
  cellOther: {
    background: "var(--color-bg-secondary)",
    color: "var(--color-text-muted)",
    opacity: 0.7,
  },
  cellToday: {
    outline: "2px solid var(--color-primary)",
    outlineOffset: -1,
  },
  cellSelected: {
    outline: "2px solid var(--color-warning, #f59e0b)",
    outlineOffset: -1,
  },
  count: {
    fontSize: "var(--font-size-xs)",
    fontWeight: "var(--font-weight-semibold)",
    color: "var(--color-primary)",
    marginTop: "var(--spacing-1)",
  },
  overlayBar: {
    display: "flex",
    alignItems: "center",
    gap: "var(--spacing-sm)",
    flexWrap: "wrap",
    fontSize: "var(--font-size-xs)",
  },
  overlayBtn: {
    padding: "4px 8px",
    borderRadius: "var(--radius-full, 9999px)",
    border: "1px solid var(--color-border)",
    background: "var(--color-bg-secondary)",
    color: "var(--color-text-primary)",
    cursor: "pointer",
    fontSize: "var(--font-size-xs)",
  },
  overlayBtnActive: {
    background: "var(--color-primary)",
    color: "var(--color-on-primary, #fff)",
    borderColor: "var(--color-primary)",
  },
  overlayBtnRange: {
    background: "var(--color-warning, #f59e0b)",
    color: "#fff",
    borderColor: "var(--color-warning, #f59e0b)",
  },
  dayPanel: {
    position: "sticky",
    top: 52,
    zIndex: 20,
    background: "var(--color-surface-1)",
    borderBottom: "1px solid var(--color-border)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  dayPanelInner: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "var(--spacing-md) var(--spacing-lg)",
  },
  dayPanelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "var(--spacing-md)",
  },
  dayPanelTitle: {
    fontWeight: "var(--font-weight-bold)",
    fontSize: "var(--font-size-xl)",
    color: "var(--color-text-primary)",
  },
  dayPanelClose: {
    padding: "var(--spacing-sm) var(--spacing-md)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)",
    background: "var(--color-bg-secondary)",
    cursor: "pointer",
    fontSize: "var(--font-size-sm)",
  },
  dayPanelSection: {
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-lg)",
    background: "var(--color-bg-secondary)",
    padding: "var(--spacing-md)",
    fontSize: "var(--font-size-sm)",
  },
  dayPanelSectionTitle: {
    fontWeight: "var(--font-weight-bold)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--color-text-muted)",
    fontSize: "var(--font-size-xs)",
    marginBottom: "var(--spacing-sm)",
  },
  timeSlotRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "var(--spacing-xs) 0",
    borderBottom: "1px solid var(--color-border)",
  },
  rangeSummary: {
    maxWidth: 900,
    margin: "var(--spacing-md) auto 0",
    padding: "var(--spacing-md)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-lg)",
    background: "var(--color-surface-1)",
    fontSize: "var(--font-size-sm)",
    display: "flex",
    flexWrap: "wrap",
    gap: "var(--spacing-md)",
  },
  workdayDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--color-primary)",
  },
  offDayDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--color-text-muted)",
  },
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatMonthYear(year: number, month: number): string {
  const d = new Date(year, month, 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function isWorkday(dateKey: string): boolean {
  const d = new Date(dateKey);
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

/* ------------------ TopBar ------------------ */
function TopBar({
  monthLabel,
  onPrev,
  onNext,
  onTitleClick,
  overlay,
  setOverlay,
  mode,
  setMode,
}: {
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onTitleClick: () => void;
  overlay: OverlayType;
  setOverlay: (o: OverlayType) => void;
  mode: RangeMode;
  setMode: (m: RangeMode) => void;
}) {
  const overlays: OverlayType[] = ["none", "priority", "health", "projects"];
  return (
    <header style={styles.header}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
        <button type="button" style={styles.navBtn} onClick={onPrev} aria-label="Previous month">
          ‹
        </button>
        <button type="button" style={styles.title} onClick={onTitleClick} aria-label="Current month">
          {monthLabel}
        </button>
        <button type="button" style={styles.navBtn} onClick={onNext} aria-label="Next month">
          ›
        </button>
      </div>
      <ViewSwitcherLinks currentView="month" />
      <div style={styles.overlayBar}>
        {overlays.map((o) => (
          <button
            key={o}
            type="button"
            style={{
              ...styles.overlayBtn,
              ...(overlay === o ? styles.overlayBtnActive : {}),
            }}
            onClick={() => setOverlay(o)}
          >
            {o}
          </button>
        ))}
        <button
          type="button"
          style={{
            ...styles.overlayBtn,
            ...(mode === "range" ? styles.overlayBtnRange : {}),
          }}
          onClick={() => setMode(mode === "range" ? "normal" : "range")}
        >
          {mode === "range" ? "Range ✓" : "Range"}
        </button>
      </div>
    </header>
  );
}

/* ------------------ MonthGrid ------------------ */
function MonthGrid({
  cells,
  monthIndex,
  overlay,
  mode,
  range,
  rollupByKey,
  today,
  onPickDay,
  onRangeStart,
  onRangeOver,
  isDragging,
  dragStartKey,
}: {
  cells: MonthCell[];
  monthIndex: number;
  overlay: OverlayType;
  mode: RangeMode;
  range: { start: string; end: string } | null;
  rollupByKey: Record<string, { count: number; items?: StructureItem[] }>;
  today: string;
  onPickDay: (cell: MonthCell) => void;
  onRangeStart: (cell: MonthCell) => void;
  onRangeOver: (cell: MonthCell) => void;
  isDragging: boolean;
  dragStartKey: string | null;
}) {
  const inRange = useCallback(
    (dateKey: string) =>
      range?.start &&
      range?.end &&
      dateKeyInRange(dateKey, range.start, range.end),
    [range]
  );

  const getCellMonthIndex = (dateKey: string) => new Date(dateKey + "T12:00:00").getMonth();

  return (
    <>
      <div style={styles.weekdays}>
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div style={styles.grid}>
        {cells.map((cell) => {
          const rollup = rollupByKey[cell.dateKey];
          const items = rollup?.items ?? [];
          const count = rollup?.count ?? 0;
          const isCurrentMonth = getCellMonthIndex(cell.dateKey) === monthIndex;
          const isToday = cell.dateKey === today;
          const selected = inRange(cell.dateKey);
          const workday = isWorkday(cell.dateKey);

          const priorityCounts = items.reduce(
            (acc, i) => {
              const band = priorityBand(typeof i.priority === "number" ? i.priority : 5);
              acc[band] = (acc[band] ?? 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          );
          const projects = Array.from(new Set(items.map((i) => i.categoryId).filter(Boolean)));

          const handleMouseDown = () => {
            if (mode === "range") onRangeStart(cell);
          };
          const handleMouseOver = () => {
            if (isDragging && mode === "range") onRangeOver(cell);
          };
          const handleClick = () => {
            if (mode === "normal") onPickDay(cell);
          };

          return (
            <div
              key={cell.dateKey}
              role="button"
              tabIndex={0}
              onMouseDown={handleMouseDown}
              onMouseOver={handleMouseOver}
              onClick={handleClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (mode === "normal") onPickDay(cell);
                }
              }}
              style={{
                ...styles.cell,
                ...(isCurrentMonth ? {} : styles.cellOther),
                ...(isToday ? styles.cellToday : {}),
                ...(selected ? styles.cellSelected : {}),
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "var(--font-weight-semibold)" }}>{cell.dayOfMonth}</span>
                <span
                  style={workday ? styles.workdayDot : styles.offDayDot}
                  title={workday ? "Work day" : "Off day"}
                />
              </div>
              {count > 0 && overlay === "none" && <div style={styles.count}>{count}</div>}
              {overlay === "priority" && (
                <div style={{ marginTop: 2, fontSize: "var(--font-size-xs)", display: "flex", gap: 4 }}>
                  {priorityCounts.red != null && (
                    <span style={{ color: "var(--color-error, #dc2626)" }}>R{priorityCounts.red}</span>
                  )}
                  {priorityCounts.yellow != null && (
                    <span style={{ color: "var(--color-warning, #ca8a04)" }}>Y{priorityCounts.yellow}</span>
                  )}
                  {priorityCounts.green != null && (
                    <span style={{ color: "var(--color-success, #16a34a)" }}>G{priorityCounts.green}</span>
                  )}
                </div>
              )}
              {overlay === "health" && (
                <div style={{ marginTop: 2, fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                  —
                </div>
              )}
              {overlay === "projects" && (
                <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 2 }}>
                  {projects.slice(0, 3).map((p) => (
                    <span
                      key={p}
                      style={{
                        padding: "2px 4px",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--color-bg-secondary)",
                        border: "1px solid var(--color-border)",
                        fontSize: 10,
                      }}
                    >
                      {p}
                    </span>
                  ))}
                  {projects.length > 3 && (
                    <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>+{projects.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ------------------ DaySummaryPanel ------------------ */
function DaySummaryPanel({
  dateKey,
  blocks,
  onClose,
}: {
  dateKey: string;
  blocks: Block[];
  onClose: () => void;
}) {
  const d = new Date(dateKey + "T12:00:00");
  const label = d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  return (
    <div style={styles.dayPanel}>
      <div style={styles.dayPanelInner}>
        <div style={styles.dayPanelHeader}>
          <div style={styles.dayPanelTitle}>{label}</div>
          <button type="button" style={styles.dayPanelClose} onClick={onClose}>
            Close
          </button>
        </div>
        <div style={styles.dayPanelSection}>
          <h3 style={styles.dayPanelSectionTitle}>Time slots</h3>
          {blocks.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
              No blocks for this day. Blocks come from structure.blocksByDate.
            </p>
          ) : (
            blocks.map((chunk, i) => (
              <div key={chunk.id ?? i} style={styles.timeSlotRow}>
                <span style={{ fontWeight: "var(--font-weight-medium)" }}>{chunk.label ?? "—"}</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    background: "var(--color-bg-primary)",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  {chunk.start} – {chunk.end}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------ RangeSummary ------------------ */
function RangeSummary({
  cells,
  range,
  rollupByKey,
  blocksByDate,
}: {
  cells: MonthCell[];
  range: { start: string; end: string } | null;
  rollupByKey: Record<string, { count: number; items?: StructureItem[] }>;
  blocksByDate: Record<string, Block[]>;
}) {
  if (!range?.start || !range?.end) return null;
  const inRange = (c: MonthCell) => dateKeyInRange(c.dateKey, range.start, range.end);
  const list = cells.filter(inRange);
  if (list.length === 0) return null;
  const work = list.filter((c) => isWorkday(c.dateKey)).length;
  const off = list.length - work;
  const allItems = list.flatMap((c) => rollupByKey[c.dateKey]?.items ?? []);
  const priorityCounts = allItems.reduce(
    (acc, i) => {
      const band = priorityBand(typeof i.priority === "number" ? i.priority : 5);
      acc[band] = (acc[band] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const hours = list.reduce((sum, c) => sum + blockHours(blocksByDate[c.dateKey] ?? []), 0);

  return (
    <div style={styles.rangeSummary}>
      <span>
        <strong>Range:</strong> {range.start} → {range.end} ({list.length} days)
      </span>
      <span>
        <strong>Work/Off:</strong> {work}/{off}
      </span>
      <span>
        <strong>Hours:</strong> {hours.toFixed(1)}h
      </span>
      <span>
        <strong>Priority:</strong>{" "}
        <span style={{ color: "var(--color-error, #dc2626)" }}>R{priorityCounts.red ?? 0}</span>
        {" · "}
        <span style={{ color: "var(--color-warning, #ca8a04)" }}>Y{priorityCounts.yellow ?? 0}</span>
        {" · "}
        <span style={{ color: "var(--color-success, #16a34a)" }}>G{priorityCounts.green ?? 0}</span>
      </span>
    </div>
  );
}

/* ------------------ App ------------------ */
export default function JSX_MonthView() {
  const { selectedDate, year, month, cells, rollupByKey, blocksByDate } = useMonthViewModel();
  const today = toKey(new Date());

  const [overlay, setOverlay] = useState<OverlayType>("none");
  const [mode, setMode] = useState<RangeMode>("normal");
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);
  const [openDay, setOpenDay] = useState<MonthCell | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartKey, setDragStartKey] = useState<string | null>(null);

  useEffect(() => {
    runAction({ name: "calendar:setMonth" }, getState() ?? {});
  }, []);

  useEffect(() => {
    setRange(null);
    setOpenDay(null);
  }, [year, month]);

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStartKey(null);
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const goPrev = () => {
    const d = new Date(year, month - 1, 1);
    runAction({ name: "calendar:setMonth", date: d.toISOString().slice(0, 10) }, getState() ?? {});
  };
  const goNext = () => {
    const d = new Date(year, month + 1, 1);
    runAction({ name: "calendar:setMonth", date: d.toISOString().slice(0, 10) }, getState() ?? {});
  };
  const goThisMonth = () => {
    runAction({ name: "calendar:setMonth" }, getState() ?? {});
  };

  const handlePickDay = (cell: MonthCell) => {
    setOpenDay(cell);
    runAction({ name: "calendar:setDay", date: cell.dateKey }, getState() ?? {});
  };

  const handleRangeStart = (cell: MonthCell) => {
    setIsDragging(true);
    setDragStartKey(cell.dateKey);
    setRange({ start: cell.dateKey, end: cell.dateKey });
  };

  const handleRangeOver = (cell: MonthCell) => {
    if (!isDragging || mode !== "range" || !dragStartKey) return;
    const s = new Date(dragStartKey);
    const e = new Date(cell.dateKey);
    const [start, end] = s <= e ? [dragStartKey, cell.dateKey] : [cell.dateKey, dragStartKey];
    setRange({ start, end });
  };

  const monthIndex = new Date(year, month, 1).getMonth();

  return (
    <div style={styles.screen}>
      <TopBar
        monthLabel={formatMonthYear(year, month)}
        onPrev={goPrev}
        onNext={goNext}
        onTitleClick={goThisMonth}
        overlay={overlay}
        setOverlay={setOverlay}
        mode={mode}
        setMode={setMode}
      />

      {openDay && (
        <DaySummaryPanel
          dateKey={openDay.dateKey}
          blocks={blocksByDate[openDay.dateKey] ?? []}
          onClose={() => setOpenDay(null)}
        />
      )}

      <MonthGrid
        cells={cells}
        monthIndex={monthIndex}
        overlay={overlay}
        mode={mode}
        range={range}
        rollupByKey={rollupByKey}
        today={today}
        onPickDay={handlePickDay}
        onRangeStart={handleRangeStart}
        onRangeOver={handleRangeOver}
        isDragging={isDragging}
        dragStartKey={dragStartKey}
      />

      <RangeSummary cells={cells} range={range} rollupByKey={rollupByKey} blocksByDate={blocksByDate} />
    </div>
  );
}
