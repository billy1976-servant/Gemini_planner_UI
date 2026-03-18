"use client";

import React, { useEffect } from "react";

export default function AppShell({
  nav,
  header,
  primary,
  sidebar,
  actions,
  footer,
}: {
  nav?: React.ReactNode;
  header?: React.ReactNode;
  primary?: React.ReactNode;
  sidebar?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    console.log("[MOUNT]", "AppShell");
    return () => console.log("[UNMOUNT]", "AppShell");
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg-secondary)",
        display: "grid",
        gridTemplateColumns: "280px minmax(0, 1fr)",
      }}
    >
      <aside
        style={{
          borderRight: "1px solid var(--color-border)",
          background: "var(--color-bg-primary)",
          padding: 12,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "auto",
        }}
      >
        {nav}
      </aside>

      <div style={{ display: "grid", gridTemplateRows: "auto 1fr auto", minHeight: "100vh", background: "var(--color-bg-primary)" }}>
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 0 /* TEMP: neutralized to isolate nav dropdown blocker */,
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-bg-primary)",
            paddingTop: 8,
            paddingBottom: 8,
          }}
        >
          {header}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: sidebar ? "minmax(0, 1fr) 360px" : "minmax(0, 1fr)",
            gap: 16,
            paddingTop: 16,
            paddingBottom: 16,
            alignItems: "start",
            minWidth: 0,
          }}
        >
          <section style={{ minWidth: 0 }}>{primary}</section>
          {sidebar ? (
            <aside
              style={{
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-secondary)",
                borderRadius: "var(--radius-lg)",
                paddingTop: 12,
                paddingBottom: 12,
                minHeight: 120,
              }}
            >
              {sidebar}
            </aside>
          ) : null}
        </div>

        <div
          style={{
            borderTop: "1px solid var(--color-border)",
            background: "var(--color-bg-primary)",
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
          {actions}
          {footer}
        </div>
      </div>
    </div>
  );
}

