"use client";

import React from "react";
import styles from "./Accordion.module.css";

export type SectionId =
  | "business-health"
  | "performance-flow"
  | "market-insights"
  | "growth-capacity"
  | "recommendations"
  | "projections"
  | "reports";

export interface AccordionSectionProps {
  id: SectionId;
  summary: React.ReactNode;
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  className?: string;
  summaryClassName?: string;
}

export function AccordionSection({
  id,
  summary,
  children,
  expanded,
  onToggle,
  className = "",
  summaryClassName = "",
}: AccordionSectionProps) {
  return (
    <section
      className={`${styles.section} ${className}`}
      aria-expanded={expanded}
      data-section-id={id}
    >
      <button
        type="button"
        className={`${styles.trigger} ${summaryClassName}`}
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`${id}-panel`}
        id={`${id}-trigger`}
      >
        <span className={styles.triggerContent}>{summary}</span>
        <span className={styles.chevron} aria-hidden>
          {expanded ? "▼" : "▶"}
        </span>
      </button>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        className={`${styles.panel} ${expanded ? styles.panelOpen : ""}`}
      >
        <div className={styles.panelInner}>{children}</div>
      </div>
    </section>
  );
}

export interface AccordionProps {
  sectionIds: SectionId[];
  expanded: Set<SectionId>;
  onToggle: (id: SectionId) => void;
  expandAll: () => void;
  collapseAll: () => void;
  children: (id: SectionId) => React.ReactNode;
  className?: string;
}

export function AccordionControls({
  expanded,
  sectionIds,
  onExpandAll,
  onCollapseAll,
}: {
  expanded: Set<SectionId>;
  sectionIds: SectionId[];
  onExpandAll: () => void;
  onCollapseAll: () => void;
}) {
  const allOpen = sectionIds.length > 0 && sectionIds.every((id) => expanded.has(id));
  const noneOpen = sectionIds.every((id) => !expanded.has(id));
  return (
    <div className={styles.controls}>
      <button
        type="button"
        className={styles.controlBtn}
        onClick={onExpandAll}
        disabled={allOpen}
      >
        Expand All
      </button>
      <button
        type="button"
        className={styles.controlBtn}
        onClick={onCollapseAll}
        disabled={noneOpen}
      >
        Collapse All
      </button>
    </div>
  );
}
