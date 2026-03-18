"use client";

import type React from "react";

/**
 * Canonical 21 organ IDs. TSX-only organ system.
 */
export type OrganId =
  | "toolbar"
  | "sidebar"
  | "filterBar"
  | "paginationBar"
  | "modal"
  | "selectionBar"
  | "splitPane"
  | "listContent"
  | "columnStrip"
  | "boardColumn"
  | "gridLayout"
  | "widgetCell"
  | "editorContent"
  | "timelineRuler"
  | "timelineLaneStrip"
  | "timelineLane"
  | "detailContent"
  | "wizardStepStrip"
  | "wizardStepContent"
  | "galleryGrid"
  | "lightbox";

/**
 * Canonical slot keys per organ. Union of all slot keys.
 */
export type SlotKey =
  | "toolbar.actions"
  | "toolbar.breadcrumb"
  | "toolbar.viewToggles"
  | "sidebar.content"
  | "filterBar.controls"
  | "paginationBar.label"
  | "paginationBar.extra"
  | "modal.title"
  | "modal.content"
  | "selectionBar.label"
  | "selectionBar.actions"
  | "splitPane.primary"
  | "splitPane.secondary"
  | "listContent.header"
  | "listContent.items"
  | "listContent.emptyState"
  | "columnStrip.title"
  | "boardColumn.header"
  | "boardColumn.cards"
  | "boardColumn.footer"
  | "gridLayout.title"
  | "widgetCell.content"
  | "editorContent.toolbar"
  | "editorContent.body"
  | "timelineRuler.label"
  | "timelineLaneStrip.title"
  | "timelineLane.label"
  | "timelineLane.events"
  | "detailContent.body"
  | "detailContent.emptyState"
  | "wizardStepStrip.steps"
  | "wizardStepStrip.nav"
  | "wizardStepContent.body"
  | "galleryGrid.header"
  | "galleryGrid.items"
  | "galleryGrid.emptyState"
  | "lightbox.item"
  | "lightbox.caption";

/**
 * Props for any organ. Slots are keyed by canonical slot keys; organs render only their slots.
 * No engine logic, no store writes, no domain imports. Emit via onAction.
 * When an organ is rendered standalone (e.g. from tsx-organs menu), slots may be omitted; organs must guard (slots ?? {}).
 */
export interface OrganProps<T extends OrganId = OrganId> {
  organId: T;
  /** Optional when organ is rendered in isolation (dev menu); organisms always pass slots. */
  slots?: Record<string, React.ReactNode>;
  onAction?: (actionName: string, payload?: unknown) => void;
  className?: string;
}
