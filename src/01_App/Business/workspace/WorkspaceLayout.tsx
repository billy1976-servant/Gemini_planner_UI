"use client";

import React, { useState } from "react";
import { useDashboardConfig } from "@/lib/tsx-structure/engines/dashboard";
import { useBusinesses } from "./useBusinesses";
import { CommandCenterTab } from "./CommandCenterTab";
import { CompareTab } from "./CompareTab";
import { TimelineTab } from "./TimelineTab";
import { DataTab } from "./DataTab";
import { ReportsTab } from "./ReportsTab";
import { AdsTab } from "./AdsTab";
import { DecisionConsoleTab } from "./DecisionConsoleTab";
import { sendDebugIngest } from "@/lib/debug-ingest";
import styles from "./WorkspaceLayout.module.css";

export type ViewId = "command" | "compare" | "timeline" | "data" | "reports" | "ads" | "decision";

const NAV_ITEMS: { id: ViewId; label: string; icon: string }[] = [
  { id: "command", label: "Command", icon: "▣" },
  { id: "compare", label: "Compare", icon: "◈" },
  { id: "timeline", label: "Timeline", icon: "▲" },
  { id: "data", label: "Data", icon: "◫" },
  { id: "reports", label: "Reports", icon: "▤" },
  { id: "ads", label: "Ads", icon: "◆" },
  { id: "decision", label: "Decision", icon: "◇" },
];

export default function WorkspaceLayout() {
  const dashboardConfig = useDashboardConfig();
  const { businesses, getBusiness } = useBusinesses();
  const [businessId, setBusinessId] = useState<string>(() => businesses[0]?.id ?? "");
  const [dateRange, setDateRange] = useState<string>("last-30");
  const [activeView, setActiveView] = useState<ViewId>("command");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const currentBusiness = businessId ? getBusiness(businessId) ?? businesses[0] : businesses[0];

  // #region agent log
  React.useEffect(() => {
    sendDebugIngest({
      sessionId: "df01c7",
      location: "WorkspaceLayout.tsx:headerBusinesses",
      message: "Header business dropdown source (Data tab uses this)",
      data: { businesses: businesses.map((b) => ({ id: b.id, name: b.name })), selectedBusinessId: businessId },
      timestamp: Date.now(),
      hypothesisId: "B",
    });
  }, [businesses, businessId]);
  // #endregion

  const refreshKey = `${businessId}-${activeView}`;

  return (
    <div
      className={styles.root}
      data-structure-type="dashboard"
      data-dashboard-grid-columns={dashboardConfig?.grid.columns ?? 12}
      data-dashboard-grid-gap={dashboardConfig?.grid.gap ?? 16}
      data-dashboard-widgets-resizable={dashboardConfig?.widgets.resizable ?? true}
      data-dashboard-widgets-draggable={dashboardConfig?.widgets.draggable ?? true}
    >
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>Workspace</span>
          <select
            className={styles.businessSelect}
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            aria-label="Select business"
          >
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            className={styles.dateRangeSelect}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            aria-label="Date range"
          >
            <option value="last-7">Last 7 days</option>
            <option value="last-30">Last 30 days</option>
            <option value="last-90">Last 90 days</option>
          </select>
        </div>
        <div className={styles.headerRight} />
      </header>

      <div className={styles.body}>
        <aside
          className={`${styles.sidebar} ${sidebarExpanded ? styles.sidebarExpanded : ""}`}
          aria-label="Navigation"
        >
          <button
            type="button"
            className={styles.sidebarToggle}
            onClick={() => setSidebarExpanded((e) => !e)}
            aria-expanded={sidebarExpanded}
            aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarExpanded ? "◀" : "▶"}
          </button>
          <nav className={styles.sidebarNav}>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.sidebarItem} ${activeView === item.id ? styles.sidebarItemActive : ""}`}
                onClick={() => setActiveView(item.id)}
                title={item.label}
              >
                <span className={styles.sidebarIcon} aria-hidden>
                  {item.icon}
                </span>
                {sidebarExpanded && (
                  <span className={styles.sidebarLabel}>{item.label}</span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        <main className={styles.main}>
          {activeView === "command" && (
            <CommandCenterTab
              key={refreshKey}
              businessId={businessId}
              onNavigateToData={() => setActiveView("data")}
            />
          )}
          {activeView === "compare" && currentBusiness && (
            <CompareTab
              key={refreshKey}
              businessId={currentBusiness.id}
              business={currentBusiness}
              onNavigateToData={() => setActiveView("data")}
            />
          )}
          {activeView === "timeline" && (
            <TimelineTab
              key={refreshKey}
              businessId={businessId}
              onNavigateToData={() => setActiveView("data")}
            />
          )}
          {activeView === "data" && currentBusiness && (
            <DataTab
              key={refreshKey}
              businessId={currentBusiness.id}
              business={currentBusiness}
              onRefresh={() => setActiveView("command")}
            />
          )}
          {activeView === "reports" && <ReportsTab businessId={businessId} />}
          {activeView === "ads" && currentBusiness && (
            <AdsTab
              key={refreshKey}
              businessId={currentBusiness.id}
              onNavigateToData={() => setActiveView("data")}
            />
          )}
          {activeView === "decision" && (
            <DecisionConsoleTab key={refreshKey} businessId={businessId} />
          )}
        </main>
      </div>
    </div>
  );
}
