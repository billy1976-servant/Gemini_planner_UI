"use client";

import React, { useEffect } from "react";

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
  useEffect(() => {
    console.log("[MOUNT]", "LearningShell");
    return () => console.log("[UNMOUNT]", "LearningShell");
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-surfaceVariant)" }}>
      <header
        style={{
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-bg-primary)",
          position: "sticky",
          top: 0,
          zIndex: 0 /* TEMP: neutralized to isolate nav dropdown blocker */,
        }}
      >
        <div style={{ maxWidth: 820, margin: "0 auto", paddingTop: 16, paddingBottom: 16 }}>{header}</div>
      </header>

      <main style={{ maxWidth: 820, margin: "0 auto", paddingTop: 32, paddingBottom: 40 }}>
        <div style={{ marginBottom: 32 }}>{content}</div>
        {actions ? (
          <div
            style={{
              marginTop: 32,
              paddingTop: 24,
              borderTop: "1px dashed var(--color-border)",
            }}
          >
            {actions}
          </div>
        ) : null}
      </main>

      <footer style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-bg-secondary)" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", paddingTop: 16, paddingBottom: 16 }}>{footer}</div>
      </footer>
    </div>
  );
}

