import type { DeckOutline, LearnSlideTypeV1, OutlineSlide } from "@/lib/landing-deck/outline/types";
import { learnSlideTypeToTemplateId } from "./learn-slide-type-map";

function uniqueSlideId(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

const DEFAULT_QUIZ_SELECT: NonNullable<OutlineSlide["quizSelect"]> = {
  inputId: "quiz-answer",
  label: "Your answer",
  options: [
    { value: "a", label: "Option A" },
    { value: "b", label: "Option B" },
  ],
};

/** Blank outline slide for `kind` (IDs must be unique — use `addOutlineSlideWithKind`). */
export function seedOutlineSlideForKind(id: string, kind: LearnSlideTypeV1): OutlineSlide {
  const base = (title: string, stepLabel: string, rest: Partial<OutlineSlide> = {}): OutlineSlide => ({
    id,
    learnSlideType: kind,
    templateId: learnSlideTypeToTemplateId(kind),
    title,
    stepLabel,
    inlineMedia: [],
    ...rest,
  });

  switch (kind) {
    case "intro":
      return base("Welcome", "Intro", {
        presentation: { reveal: "byBlock" },
        richContent: [
          {
            type: "paragraph",
            text: "Set expectations for what they will learn on the next steps.",
          },
        ],
      });
    case "hero":
      return base("Your story starts here", "Hero", {
        subtitle: "A short hook under the headline",
        richContent: [
          {
            type: "paragraph",
            text: "Hero layouts spotlight one idea—tune the headline, hook, and media in the inspector.",
          },
        ],
      });
    case "teach":
      return base("New slide", "New slide", {
        presentation: { reveal: "byBlock" },
        richContent: [
          {
            type: "paragraph",
            text: "Add your main point here. Staged reveal is on by default—open Advanced → Reveal to adjust.",
          },
        ],
      });
    case "proof":
      return base("Evidence", "Proof", {
        presentation: { reveal: "byBlock" },
        richContent: [
          {
            type: "paragraph",
            text: "Add evidence: testimonial, stats, or a strong visual in the media slots.",
          },
        ],
      });
    case "comparison":
      return base("Compare options", "Compare", {
        presentation: { reveal: "byBlock" },
        richContent: [
          {
            type: "paragraph",
            text: "Use a comparison block (Advanced) to contrast two paths side by side.",
          },
        ],
      });
    case "quiz":
      return base("Quick check", "Quiz", {
        presentation: { reveal: "byBlock" },
        quizSelect: { ...DEFAULT_QUIZ_SELECT },
        richContent: [
          {
            type: "paragraph",
            text: "Ask one focused question—set choices under Walkthrough & tracker.",
          },
        ],
      });
    case "summary":
      return base("Recap", "Summary", {
        paragraphs: ["Summarize the main takeaways in a few short lines."],
      });
    case "cta":
      return base("Ready for the next step?", "CTA", {
        subtitle: "Short supporting line",
        paragraphs: ["Close with one clear action—the highlighted band uses your title and subtitle."],
      });
  }
}

export function addOutlineSlideWithKind(
  outline: DeckOutline,
  kind: LearnSlideTypeV1
): { outline: DeckOutline; newId: string } {
  const ids = new Set(outline.slides.map((s) => s.id));
  const newId = uniqueSlideId("new-slide", ids);
  const slide = seedOutlineSlideForKind(newId, kind);
  return { outline: { ...outline, slides: [...outline.slides, slide] }, newId };
}

export function addOutlineSlideAtEnd(outline: DeckOutline): { outline: DeckOutline; newId: string } {
  return addOutlineSlideWithKind(outline, "teach");
}

export function duplicateOutlineSlideById(outline: DeckOutline, slideId: string): { outline: DeckOutline; newId: string } | null {
  const idx = outline.slides.findIndex((s) => s.id === slideId);
  if (idx < 0) return null;
  const orig = outline.slides[idx];
  const ids = new Set(outline.slides.map((s) => s.id));
  const newId = uniqueSlideId(`${orig.id}-copy`, ids);
  const clone = JSON.parse(JSON.stringify(orig)) as OutlineSlide;
  clone.id = newId;
  const slides = [...outline.slides.slice(0, idx + 1), clone, ...outline.slides.slice(idx + 1)];
  return { outline: { ...outline, slides }, newId };
}

export function deleteOutlineSlideById(outline: DeckOutline, slideId: string): DeckOutline | null {
  if (outline.slides.length <= 1) return null;
  return { ...outline, slides: outline.slides.filter((s) => s.id !== slideId) };
}

export function reorderOutlineSlides(outline: DeckOutline, orderedIds: string[]): DeckOutline {
  const map = new Map(outline.slides.map((s) => [s.id, s]));
  const slides = orderedIds.map((id) => map.get(id)).filter((s): s is OutlineSlide => s != null);
  const rest = outline.slides.filter((s) => !orderedIds.includes(s.id));
  return { ...outline, slides: [...slides, ...rest] };
}
