"use client";

import React from "react";

export default function LearningShell({
  header,
  content,
  actions,
  footer,
}: {
  header?: React.ReactNode;
  content?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-primary)" }}>
      <div
        style={{
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-bg-primary)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "16px 16px" }}>{header}</div>
      </div>

      <main style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ marginBottom: 18 }}>{content}</div>
        {actions ? (
          <div
            style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: "1px dashed var(--color-border)",
            }}
          >
            {actions}
          </div>
        ) : null}
      </main>

      <footer style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-bg-secondary)" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "16px 16px" }}>{footer}</div>
      </footer>
    </div>
  );
}

