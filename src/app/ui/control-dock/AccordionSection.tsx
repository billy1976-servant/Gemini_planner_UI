"use client";

import React from "react";

export type AccordionSectionProps = {
  id: string;
  title: string;
  icon?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

/**
 * Reusable accordion/dropdown section for the Control Dock.
 * Click section header to expand/collapse. Parent controls which section is open (single-open accordion).
 */
export default function AccordionSection({
  id,
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: AccordionSectionProps) {
  return (
    <div className="editor-section" data-accordion-section={id}>
      <button
        type="button"
        onClick={onToggle}
        className="editor-text-primary"
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${id}`}
        id={`accordion-heading-${id}`}
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
        {icon != null && <span style={{ fontSize: "var(--font-size-lg)" }}>{icon}</span>}
        <span style={{ flex: 1, textAlign: "left" }}>{title}</span>
        <span style={{ fontSize: "var(--font-size-xs)", opacity: 0.6 }}>
          {isOpen ? "▾" : "▸"}
        </span>
      </button>
      {isOpen && (
        <div
          id={`accordion-content-${id}`}
          role="region"
          aria-labelledby={`accordion-heading-${id}`}
          style={{
            padding: "var(--spacing-3)",
            background: "var(--editor-panel)",
            overflowY: "auto",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
