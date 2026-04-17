"use client";

import React, { useId, useState } from "react";

export type InspectorCollapsibleProps = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

/**
 * Lightweight disclosure for dock inspectors — keeps keyboard focus on the toggle
 * and avoids pulling in a full accordion library.
 */
export default function InspectorCollapsible({
  title,
  defaultOpen = true,
  children,
}: InspectorCollapsibleProps) {
  const id = useId();
  const panelId = `${id}-panel`;
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        border: "1px solid var(--color-border, #dadce0)",
        borderRadius: 8,
        background: "var(--color-bg-primary, #fff)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        id={`${id}-btn`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          fontSize: 12,
          fontWeight: 700,
          color: "var(--color-text-secondary, #5f6368)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          border: "none",
          background: open ? "var(--color-surface-1, #f1f3f4)" : "var(--color-bg-primary, #fff)",
          cursor: "pointer",
          textAlign: "left",
          boxSizing: "border-box",
        }}
      >
        <span aria-hidden style={{ fontSize: 10, width: 14, opacity: 0.75 }}>
          {open ? "▼" : "▶"}
        </span>
        {title}
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={`${id}-btn`}
          style={{ padding: "0 10px 10px", display: "flex", flexDirection: "column", gap: 12 }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
