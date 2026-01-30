"use client";

import React from "react";

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

      <div style={{ display: "grid", gridTemplateRows: "auto 1fr auto", minHeight: "100vh" }}>
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-bg-primary)",
            padding: 12,
          }}
        >
          {header}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: sidebar ? "minmax(0, 1fr) 360px" : "minmax(0, 1fr)",
            gap: 16,
            padding: 16,
            alignItems: "start",
          }}
        >
          <section style={{ minWidth: 0 }}>{primary}</section>
          {sidebar ? (
            <aside
              style={{
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-primary)",
                borderRadius: "var(--radius-lg)",
                padding: 12,
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
            padding: 12,
          }}
        >
          {actions}
          {footer}
        </div>
      </div>
    </div>
  );
}

