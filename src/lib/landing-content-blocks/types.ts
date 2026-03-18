/**
 * Shared content block types for wizard/landing screens (Prayer Stream, Container Creations, Gospel).
 * Used by renderContentBlocks in this package.
 */

export type LandingContentBlock =
  | { type: "badge"; text: string }
  | { type: "paragraph"; text: string; className?: string }
  | { type: "heading"; level?: number; text: string }
  | { type: "checklist"; heading?: string; items: Array<{ title: string; sub: string } | string> }
  | { type: "audio"; src: string; label?: string };

export interface LandingContentBlocksOptions {
  /** Prayer Stream: optional display context (e.g. for future use). */
  prayerCount?: number | null;
  lastPrayed?: string | null;
  /** Editor mode: inline edit for paragraphs. */
  isEditor?: boolean;
  screenId?: string;
  onParagraphChange?: (blockIndex: number, text: string) => void;
  /** Optional class names for checklist (e.g. cc-stamped-checklist-heading, cc-stamped-checklist). */
  checklistHeadingClassName?: string;
  checklistListClassName?: string;
}
