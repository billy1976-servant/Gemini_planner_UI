/**
 * Learn target profile v1: universal TXT authoring → DeckOutline (→ compile to LandingDeckV1).
 * See ./README.md for supported subset.
 */
import { compileLearnAuthoringToDeck } from "@/lib/landing-deck/authoring/compile-learn-authoring";
import type { DeckOutline, OutlineSlide } from "@/lib/landing-deck/outline/types";
import type { LandingDeckV1 } from "@/lib/landing-deck/schema";
import { parseBlueprint, parseContent, type RawNode } from "@/lib/txt-authoring/parse-blueprint-content";

export type TxtProfileLearnV1Options = {
  shopUrl?: string;
  logoSrc?: string;
  logoAlt?: string;
  shopNowLabel?: string;
  stepTrackerTitle?: string;
  stepTrackerDescription?: string;
};

function findNextOfType(
  nodes: RawNode[],
  start: number,
  sectionIndent: number,
  typeName: string
): number {
  const t = typeName.toLowerCase();
  for (let i = start; i < nodes.length; i++) {
    if (nodes[i].indent <= sectionIndent) return -1;
    if (nodes[i].type.toLowerCase() === t) return i;
  }
  return -1;
}

function sectionRawIdEligibleForTeachSlide(rawId: string): boolean {
  const parts = rawId.split(".");
  if (parts.length !== 2) return false;
  const a = parts[0];
  const b = parts[1];
  if (!/^\d+$/.test(a) || !/^\d+$/.test(b)) return false;
  const n2 = Number(b);
  return n2 >= 2;
}

/**
 * Build DeckOutline from TXT using journal-style “panel” sections (1.2, 1.3, …).
 */
export function txtAuthoringToDeckOutlineLearnProfileV1(
  blueprintText: string,
  contentText: string,
  options: TxtProfileLearnV1Options = {}
): DeckOutline {
  const { nodes } = parseBlueprint(blueprintText);
  const contentMap = parseContent(contentText) as Record<string, Record<string, string>>;

  for (const n of nodes) {
    if (n.type === "organ") {
      throw new Error(
        `[txt-profile/learn-v1] Blueprint has organ node "${n.name}" (${n.rawId}); not supported in v1.`
      );
    }
  }

  const slides: OutlineSlide[] = [];
  const deckTitle = contentMap["1.0"]?.title?.trim() || "Deck";

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.type.toLowerCase() !== "section") continue;
    if (!sectionRawIdEligibleForTeachSlide(n.rawId)) continue;

    const cardIdx = findNextOfType(nodes, i + 1, n.indent, "Card");
    if (cardIdx < 0) continue;
    const card = nodes[cardIdx];
    const fieldIdx = findNextOfType(nodes, cardIdx + 1, n.indent, "Field");

    const secContent = contentMap[n.rawId] ?? {};
    const cardContent = contentMap[card.rawId] ?? {};
    const fieldContent = fieldIdx >= 0 ? (contentMap[nodes[fieldIdx].rawId] ?? {}) : {};

    const title = (secContent.title || n.name || "Slide").trim();
    const body = (cardContent.body || "").trim();
    const label = (fieldContent.label || "").trim();

    const richContent: OutlineSlide["richContent"] = [];
    if (body) richContent.push({ type: "paragraph", text: body });
    if (label) richContent.push({ type: "paragraph", text: label });

    const slideId = `slide-${n.rawId.replace(/\./g, "-")}`;
    slides.push({
      id: slideId,
      learnSlideType: "teach",
      templateId: "teachingStamped",
      title,
      stepLabel: title,
      presentation: { reveal: "byBlock" },
      richContent:
        richContent.length > 0
          ? richContent
          : [{ type: "paragraph", text: `—` }],
      inlineMedia: [],
    });
  }

  if (slides.length === 0) {
    throw new Error(
      "[txt-profile/learn-v1] No teach slides produced. Check blueprint matches supported subset (see profiles/learn/README.md)."
    );
  }

  const outline: DeckOutline = {
    meta: {
      title: deckTitle,
      shopUrl: options.shopUrl ?? "https://example.com",
      logoSrc: options.logoSrc ?? "/favicon.ico",
      logoAlt: options.logoAlt ?? deckTitle,
      shopNowLabel: options.shopNowLabel ?? "Continue",
      stepTrackerTitle: options.stepTrackerTitle ?? deckTitle,
      stepTrackerDescription: options.stepTrackerDescription ?? "",
      showResponses: false,
      responsePlaceholder: "",
    },
    slides,
  };

  return outline;
}

export function compileTxtAuthoringToLandingDeckLearnProfileV1(
  blueprintText: string,
  contentText: string,
  options?: TxtProfileLearnV1Options
): { ok: true; deck: LandingDeckV1 } | { ok: false; errors: string[]; report?: string } {
  const outline = txtAuthoringToDeckOutlineLearnProfileV1(blueprintText, contentText, options);
  return compileLearnAuthoringToDeck(outline);
}
