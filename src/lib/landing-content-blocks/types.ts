/**
 * Shared content block types for wizard/landing screens (Prayer Stream, Container Creations, Gospel).
 * Used by renderContentBlocks in this package.
 */

/** Optional tuning for image/video/beforeAfter; omitted in existing JSON = backward compatible. */
export type LandingMediaTuning = {
  poster?: string;
  /** CSS `aspect-ratio` value, e.g. `"16/9"` or `"4 / 3"` */
  aspectRatio?: string;
  objectFit?: "cover" | "contain";
  loading?: "lazy" | "eager";
  /** When true, `alt` may be empty (decorative). */
  decorative?: boolean;
  /** Expand media to viewport width inside padded sections. */
  fullBleed?: boolean;
  maxHeight?: string;
};

export type MediaBlock =
  | ({ type: "video"; src: string; caption?: string } & LandingMediaTuning)
  | ({ type: "image"; src: string; alt: string } & LandingMediaTuning)
  | ({
      type: "beforeAfter";
      before: string;
      after: string;
      altBefore: string;
      altAfter: string;
    } & Pick<LandingMediaTuning, "aspectRatio" | "objectFit" | "fullBleed">)
  | {
      type: "imageGrid";
      images: Array<{ src: string; alt: string }>;
      columns?: 2 | 3;
      gap?: string;
    };

export type LandingContentBlock =
  | { type: "badge"; text: string }
  | { type: "paragraph"; text: string; className?: string }
  | { type: "heading"; level?: number; text: string }
  | { type: "checklist"; heading?: string; items: Array<{ title: string; sub: string } | string> }
  | { type: "audio"; src: string; label?: string }
  | {
      type: "rating";
      value: number;
      max?: number;
      reviewCount?: number;
      source?: string;
    }
  | {
      type: "testimonial";
      quote: string;
      author: string;
      location?: string;
      role?: string;
      rating?: number;
    }
  | {
      type: "trustStrip";
      items: Array<{ icon?: string; label: string }>;
    }
  | {
      type: "stats";
      items: Array<{ label: string; value: string; hint?: string }>;
    }
  | {
      type: "iconFeatures";
      items: Array<{ icon?: string; title: string; sub?: string }>;
    }
  | {
      type: "comparison";
      heading?: string;
      /** Optional column titles (e.g. "Us" / "Typical"). Omitted in existing JSON = no header row. */
      columnLabels?: { left?: string; right?: string };
      rows: Array<{ left: string; right: string; highlight?: "left" | "right" | "none" }>;
    }
  | {
      type: "ctaBand";
      headline: string;
      sub?: string;
      emphasis?: boolean;
    }
  | { type: "divider"; spacing?: "sm" | "md" | "lg" };

export interface LandingContentBlocksOptions {
  /** Prayer Stream: optional display context (e.g. for future use). */
  prayerCount?: number | null;
  lastPrayed?: string | null;
  /** Editor mode: inline edit for paragraphs. */
  isEditor?: boolean;
  screenId?: string;
  onParagraphChange?: (blockIndex: number, text: string) => void;
  onHeadingBlockChange?: (blockIndex: number, text: string) => void;
  onBadgeChange?: (blockIndex: number, text: string) => void;
  onTrustStripItemChange?: (blockIndex: number, itemIndex: number, label: string) => void;
  onComparisonHeadingChange?: (blockIndex: number, heading: string) => void;
  onComparisonColumnLabelChange?: (blockIndex: number, side: "left" | "right", text: string) => void;
  onComparisonRowCellChange?: (
    blockIndex: number,
    rowIndex: number,
    side: "left" | "right",
    text: string
  ) => void;
  onStatsItemChange?: (
    blockIndex: number,
    itemIndex: number,
    field: "label" | "value" | "hint",
    text: string
  ) => void;
  onIconFeaturesItemChange?: (
    blockIndex: number,
    itemIndex: number,
    field: "title" | "sub",
    text: string
  ) => void;
  onTestimonialFieldChange?: (
    blockIndex: number,
    field: "quote" | "author" | "role" | "location",
    text: string
  ) => void;
  onCtaBandFieldChange?: (blockIndex: number, field: "headline" | "sub", text: string) => void;
  /** Optional class names for checklist (e.g. cc-stamped-checklist-heading, cc-stamped-checklist). */
  checklistHeadingClassName?: string;
  checklistListClassName?: string;
}
