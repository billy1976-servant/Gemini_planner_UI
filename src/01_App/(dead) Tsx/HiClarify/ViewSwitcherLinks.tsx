"use client";

import React from "react";
import { getState } from "@/state/state-store";
import { runAction } from "@/logic/runtime/action-runner";

export type CalendarView = "day" | "week" | "month";

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    alignItems: "center",
    gap: "var(--spacing-sm)",
    fontSize: "var(--font-size-sm)",
  },
  link: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    color: "var(--color-text-muted)",
    textDecoration: "none",
    font: "inherit",
  },
  linkActive: {
    color: "var(--color-primary)",
    fontWeight: "var(--font-weight-semibold)",
  },
  sep: {
    color: "var(--color-text-muted)",
    userSelect: "none",
  },
};

type Props = { currentView: CalendarView };

export function ViewSwitcherLinks({ currentView }: Props) {
  const go = (view: CalendarView) => {
    const state = getState() ?? {};
    if (view === "day") runAction({ name: "calendar:setDay" }, state);
    else if (view === "week") runAction({ name: "calendar:setWeek" }, state);
    else runAction({ name: "calendar:setMonth" }, state);
  };

  return (
    <div style={styles.wrap} role="navigation" aria-label="Calendar view">
      <button
        type="button"
        style={{ ...styles.link, ...(currentView === "day" ? styles.linkActive : {}) }}
        onClick={() => go("day")}
        aria-current={currentView === "day" ? "page" : undefined}
      >
        Day
      </button>
      <span style={styles.sep}>|</span>
      <button
        type="button"
        style={{ ...styles.link, ...(currentView === "week" ? styles.linkActive : {}) }}
        onClick={() => go("week")}
        aria-current={currentView === "week" ? "page" : undefined}
      >
        Week
      </button>
      <span style={styles.sep}>|</span>
      <button
        type="button"
        style={{ ...styles.link, ...(currentView === "month" ? styles.linkActive : {}) }}
        onClick={() => go("month")}
        aria-current={currentView === "month" ? "page" : undefined}
      >
        Month
      </button>
    </div>
  );
}
