"use client";

import React from "react";
import { getState } from "@/state/state-store";
import { runAction } from "@/logic/runtime/action-runner";
import { addDays, toKey } from "@/logic/planner/date-helpers";
import { useDayViewModel } from "./usePlannerViewModels";
import { ViewSwitcherLinks } from "./ViewSwitcherLinks";
import { TimelineAxis, TIMELINE_GRID_HEIGHT } from "./TimelineAxis";
import JSX_DayView from "./JSX_DayView";
import { ChunkPlannerLayer } from "./ChunkPlannerLayer";

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
  body: {
    display: "flex",
    flexDirection: "row",
    height: TIMELINE_GRID_HEIGHT,
    minHeight: TIMELINE_GRID_HEIGHT,
    overflow: "hidden",
  },
  timeAxisWrap: {
    position: "sticky",
    left: 0,
    flexShrink: 0,
    width: 48,
    height: TIMELINE_GRID_HEIGHT,
    zIndex: 2,
  },
  swipeWrap: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    height: TIMELINE_GRID_HEIGHT,
  },
  swipeContainer: {
    display: "flex",
    flexDirection: "row",
    height: TIMELINE_GRID_HEIGHT,
    width: "100%",
    overflowX: "auto",
    overflowY: "hidden",
    scrollSnapType: "x mandatory",
    scrollBehavior: "smooth",
    WebkitOverflowScrolling: "touch",
  },
  pane: {
    flex: "0 0 100%",
    width: "100%",
    minWidth: "100%",
    height: "100%",
    overflowY: "auto",
    overflowX: "hidden",
    scrollSnapAlign: "start",
    scrollSnapStop: "always",
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

/**
 * Horizontal pager: Time column stays fixed; only content swipes.
 * Each child is a full-width pane with same height as timeline axis.
 */
export function SwipeContainer({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.swipeWrap}>
      <div style={styles.swipeContainer} role="tablist" aria-label="Planner views">
        {children}
      </div>
    </div>
  );
}

/**
 * One pane in the swipe container. Height matches timeline grid; content can scroll vertically inside.
 */
export function SwipePane({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <div style={styles.pane} role="tabpanel" id={id}>
      {children}
    </div>
  );
}

/**
 * Unified planner root: fixed time axis + swipeable content (Day | Chunk | Week placeholder).
 */
export function PlannerRoot() {
  const { selectedDate, treeFolders, scheduledSection } = useDayViewModel();

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

      <div style={styles.body}>
        <div style={styles.timeAxisWrap}>
          <TimelineAxis />
        </div>
        <SwipeContainer>
          <SwipePane id="day-pane">
            <JSX_DayView embedded />
          </SwipePane>
          <SwipePane id="chunk-pane">
            <ChunkPlannerLayer />
          </SwipePane>
          <SwipePane id="week-pane">
            <div
              style={{
                padding: "var(--spacing-lg)",
                color: "var(--color-text-muted)",
                fontSize: "var(--font-size-sm)",
                minHeight: TIMELINE_GRID_HEIGHT,
              }}
            >
              Week view (coming soon)
            </div>
          </SwipePane>
        </SwipeContainer>
      </div>
    </div>
  );
}
