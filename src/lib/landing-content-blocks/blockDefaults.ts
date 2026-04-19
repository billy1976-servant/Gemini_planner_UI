import type { LandingContentBlock } from "./types";

/** Options for “Add block” pickers (sidebar + Learn canvas chrome). */
export const ADD_BLOCK_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "paragraph", label: "Paragraph" },
  { value: "heading", label: "Heading" },
  { value: "checklist", label: "Checklist" },
  { value: "badge", label: "Badge" },
  { value: "divider", label: "Divider" },
  { value: "ctaBand", label: "CTA band" },
  { value: "testimonial", label: "Testimonial" },
  { value: "comparison", label: "Comparison" },
  { value: "iconFeatures", label: "Icon features" },
  { value: "stats", label: "Stats" },
  { value: "trustStrip", label: "Trust strip" },
  { value: "rating", label: "Rating" },
  { value: "audio", label: "Audio" },
  { value: "scripture", label: "Scripture" },
  { value: "objectionAnswer", label: "Objection / answer" },
  { value: "faq", label: "FAQ" },
  { value: "proofGrid", label: "Proof grid" },
  { value: "expandable", label: "Expandable" },
];

export function defaultLandingContentBlock(type: string): LandingContentBlock {
  switch (type) {
    case "paragraph":
      return { type: "paragraph", text: "" };
    case "heading":
      return { type: "heading", level: 2, text: "Heading" };
    case "checklist":
      return { type: "checklist", heading: "Key points", items: ["First point", "Second point"] };
    case "badge":
      return { type: "badge", text: "Badge" };
    case "divider":
      return { type: "divider", spacing: "md" };
    case "ctaBand":
      return { type: "ctaBand", headline: "Headline", sub: "", emphasis: false };
    case "testimonial":
      return { type: "testimonial", quote: "Quote", author: "Name", role: "", location: "" };
    case "comparison":
      return {
        type: "comparison",
        heading: "Compare",
        columnLabels: { left: "Us", right: "Them" },
        rows: [
          { left: "Our approach", right: "Alternative", highlight: "left" },
          { left: "Quality", right: "Varies", highlight: "none" },
        ],
      };
    case "iconFeatures":
      return { type: "iconFeatures", items: [{ title: "Feature", sub: "Description" }] };
    case "stats":
      return { type: "stats", items: [{ label: "Metric", value: "0", hint: "" }] };
    case "trustStrip":
      return { type: "trustStrip", items: [{ label: "Trust point" }] };
    case "rating":
      return { type: "rating", value: 5, max: 5, reviewCount: 0, source: "" };
    case "audio":
      return { type: "audio", src: "", label: "Audio" };
    case "scripture":
      return { type: "scripture", text: "", reference: "" };
    case "objectionAnswer":
      return { type: "objectionAnswer", objection: "Objection", response: "Response" };
    case "faq":
      return {
        type: "faq",
        heading: "Questions",
        items: [{ question: "Question?", answer: "Answer." }],
      };
    case "proofGrid":
      return {
        type: "proofGrid",
        heading: "Why it matters",
        items: [{ title: "Point", sub: "Detail", icon: "✓" }],
      };
    case "expandable":
      return { type: "expandable", title: "More detail", body: "…" };
    default:
      return { type: "paragraph", text: "" };
  }
}
