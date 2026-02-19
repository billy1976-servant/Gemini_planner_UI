"use client";

import React, { useState, useSyncExternalStore } from "react";
import { getState, subscribeState } from "@/state/state-store";
import { runAction } from "@/logic/runtime/action-runner";
import { PlannerRoot } from "./UnifiedPlannerLayout";
import JSX_WeekView from "./JSX_WeekView";
import JSX_MonthView from "./JSX_MonthView";
import JSX_AddTasks from "./JSX_AddTasks";

const styles: Record<string, React.CSSProperties> = {
  screen: {
    minHeight: "100vh",
    background: "var(--color-bg-primary)",
    color: "var(--color-text-primary)",
    fontFamily: "var(--font-family-base, system-ui, sans-serif)",
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid var(--color-border)",
    background: "var(--color-surface-1)",
    padding: "0 var(--spacing-lg)",
    gap: 4,
  },
  tab: {
    padding: "var(--spacing-md) var(--spacing-lg)",
    fontSize: "var(--font-size-sm)",
    fontWeight: 500,
    border: "none",
    background: "transparent",
    color: "var(--color-text-muted)",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    marginBottom: -1,
  },
  tabActive: {
    color: "var(--color-text-primary)",
    borderBottomColor: "var(--color-primary, #2563eb)",
  },
  content: {
    flex: 1,
  },
};

type CalendarView = "day" | "week" | "month";
type TabId = CalendarView | "add";

export default function JSX_PlannerShell() {
  const state = useSyncExternalStore(subscribeState, getState, getState);
  const calendarView = (state?.values?.structure as { calendarView?: CalendarView } | undefined)?.calendarView ?? "day";
  const [showAdd, setShowAdd] = useState(false);

  const activeTab: TabId = showAdd ? "add" : calendarView;

  const goTo = (tab: TabId) => {
    if (tab === "add") {
      setShowAdd(true);
      return;
    }
    setShowAdd(false);
    const s = getState() ?? {};
    if (tab === "day") runAction({ name: "calendar:setDay" }, s);
    else if (tab === "week") runAction({ name: "calendar:setWeek" }, s);
    else runAction({ name: "calendar:setMonth" }, s);
  };

  return (
    <div style={styles.screen}>
      <nav style={styles.tabs} aria-label="Planner views">
        <button
          type="button"
          style={{ ...styles.tab, ...(activeTab === "day" ? styles.tabActive : {}) }}
          onClick={() => goTo("day")}
          aria-current={activeTab === "day" ? "page" : undefined}
        >
          Day
        </button>
        <button
          type="button"
          style={{ ...styles.tab, ...(activeTab === "week" ? styles.tabActive : {}) }}
          onClick={() => goTo("week")}
          aria-current={activeTab === "week" ? "page" : undefined}
        >
          Week
        </button>
        <button
          type="button"
          style={{ ...styles.tab, ...(activeTab === "month" ? styles.tabActive : {}) }}
          onClick={() => goTo("month")}
          aria-current={activeTab === "month" ? "page" : undefined}
        >
          Month
        </button>
        <button
          type="button"
          style={{ ...styles.tab, ...(activeTab === "add" ? styles.tabActive : {}) }}
          onClick={() => goTo("add")}
          aria-current={activeTab === "add" ? "page" : undefined}
        >
          Add tasks
        </button>
      </nav>
      {/* Day tab = unified planner (PlannerRoot). JSX_DayView / JSX_planner_test are not used as standalone screens in the main planner flow. */}
      <div style={styles.content}>
        {/* Day: unified layout (TimeAxis + swipe panes) */}
        {activeTab === "day" && <PlannerRoot />}
        {activeTab === "week" && <JSX_WeekView />}
        {activeTab === "month" && <JSX_MonthView />}
        {activeTab === "add" && <JSX_AddTasks />}
      </div>
    </div>
  );
}
