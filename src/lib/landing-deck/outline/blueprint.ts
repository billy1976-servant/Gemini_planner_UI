import type { LandingContentBlock } from "@/lib/landing-content-blocks";
import type { OutlineSlide, OutlineTemplateId } from "./types";

export type { SlideBlueprint } from "./types";

/** V2: deterministic region ids for blueprint activation (explicit mode). */
export type BlueprintRegionId = string;

/** Template → regions authors can toggle in explicit mode. */
export const BLUEPRINT_REGION_OPTIONS: Partial<
  Record<OutlineTemplateId | string, Array<{ id: BlueprintRegionId; label: string }>>
> = {
  introStamped: [
    { id: "badge", label: "Badge" },
    { id: "body", label: "Body" },
    { id: "keyPoints", label: "Key points" },
  ],
  teachingStamped: [
    { id: "badge", label: "Badge" },
    { id: "body", label: "Body" },
    { id: "keyPoints", label: "Key points" },
  ],
  heroHook: [
    { id: "badge", label: "Badge" },
    { id: "body", label: "Body" },
    { id: "keyPoints", label: "Key points" },
  ],
  quizSelectStamped: [
    { id: "badge", label: "Badge" },
    { id: "body", label: "Intro copy" },
    { id: "keyPoints", label: "Key points" },
  ],
  ctaStamped: [
    { id: "badge", label: "Badge" },
    { id: "body", label: "Body" },
    { id: "keyPoints", label: "Key points" },
  ],
  summaryTextOnly: [
    { id: "badge", label: "Badge" },
    { id: "body", label: "Body" },
    { id: "keyPoints", label: "Key points" },
  ],
  proofStamped: [
    { id: "badge", label: "Badge" },
    { id: "body", label: "Body" },
    { id: "keyPoints", label: "Key points" },
  ],
  comparisonTwoCol: [
    { id: "badge", label: "Badge" },
    { id: "body", label: "Body" },
    { id: "keyPoints", label: "Key points" },
    { id: "comparison", label: "Comparison blocks" },
    { id: "supporting", label: "Stats / trust / icons" },
    { id: "cta", label: "CTA bands" },
  ],
};

/** Map content block types to blueprint regions (for filtering richContent). */
export function contentRegionForBlock(block: LandingContentBlock): BlueprintRegionId {
  switch (block.type) {
    case "badge":
      return "badge";
    case "checklist":
      return "keyPoints";
    case "comparison":
      return "comparison";
    case "ctaBand":
      return "cta";
    case "trustStrip":
    case "stats":
    case "iconFeatures":
    case "rating":
    case "audio":
      return "supporting";
    case "heading":
    case "paragraph":
    case "divider":
    case "testimonial":
    case "faq":
    case "objectionAnswer":
    case "proofGrid":
    case "expandable":
    case "scripture":
    default:
      return "body";
  }
}

export function filterContentByBlueprint(slide: OutlineSlide, blocks: LandingContentBlock[]): LandingContentBlock[] {
  const bp = slide.blueprint;
  if (!bp || bp.mode !== "explicit" || !bp.activeRegions?.length) return blocks;
  const active = new Set(bp.activeRegions);
  return blocks.filter((b) => active.has(contentRegionForBlock(b)));
}

/** Build content from outline paragraphs/bullets/badge respecting blueprint activation. */
export function buildContentWithBlueprint(slide: OutlineSlide): LandingContentBlock[] {
  const blocks: LandingContentBlock[] = [];
  const bp = slide.blueprint;
  const explicit = bp?.mode === "explicit" && bp.activeRegions?.length;
  const active = explicit ? new Set(bp!.activeRegions!) : null;
  const allow = (region: BlueprintRegionId) => !active || active.has(region);

  if (slide.badge && allow("badge")) {
    blocks.push({ type: "badge", text: slide.badge });
  }
  if (allow("body")) {
    for (const text of slide.paragraphs ?? []) {
      blocks.push({ type: "paragraph", text });
    }
  }
  if (slide.bullets?.length && allow("keyPoints")) {
    blocks.push({
      type: "checklist",
      heading: "Key points",
      items: slide.bullets.map((b) => ({ title: b, sub: "" })),
    });
  }
  return blocks;
}
