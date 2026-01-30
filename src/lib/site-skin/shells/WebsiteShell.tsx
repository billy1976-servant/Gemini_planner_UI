"use client";

import React from "react";

export default function WebsiteShell({
  header,
  hero,
  content,
  products,
  footer,
}: {
  header?: React.ReactNode;
  hero?: React.ReactNode;
  content?: React.ReactNode;
  products?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg-primary) 40%)",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "var(--color-bg-primary)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 16px" }}>{header}</div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ marginBottom: 32, padding: "32px 0", borderBottom: "1px solid var(--color-border)" }}>{hero}</div>
        <div style={{ marginBottom: 32 }}>{content}</div>
        <div>{products}</div>
      </main>

      <footer style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-bg-primary)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>{footer}</div>
      </footer>
    </div>
  );
}

