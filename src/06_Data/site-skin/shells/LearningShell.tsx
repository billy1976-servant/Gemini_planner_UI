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
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "16px 16px" }}>{header}</div>
      </header>

      <main style={{ maxWidth: 820, margin: "0 auto", padding: "32px 16px 40px" }}>
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
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "16px 16px" }}>{footer}</div>
      </footer>
    </div>
  );
}

