"use client";

import React from "react";

type DockSectionProps = {
  title: string;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  icon?: string;
};

export default function DockSection({
  title,
  children,
  isOpen = false,
  onToggle,
  icon,
}: DockSectionProps) {
  return (
    <div className="editor-section">
      <button
        type="button"
        onClick={onToggle}
        className="editor-text-primary"
        style={{
          width: "100%",
          padding: "var(--spacing-3)",
          background: isOpen ? "var(--editor-hover)" : "transparent",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-2)",
          fontSize: "var(--font-size-sm)",
          fontWeight: isOpen ? 600 : 400,
          transition: "background-color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = "var(--editor-hover)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        {icon && <span style={{ fontSize: "var(--font-size-lg)" }}>{icon}</span>}
        <span style={{ flex: 1, textAlign: "left" }}>{title}</span>
        <span style={{ fontSize: "var(--font-size-xs)", opacity: 0.6 }}>
          {isOpen ? "▾" : "▸"}
        </span>
      </button>
      {isOpen && (
        <div
          style={{
            padding: "var(--spacing-3)",
            background: "var(--editor-panel)",
            maxHeight: "60vh",
            overflowY: "auto",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
