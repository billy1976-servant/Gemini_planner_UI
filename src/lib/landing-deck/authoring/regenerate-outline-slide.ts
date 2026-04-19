import type { DeckOutline } from "@/lib/landing-deck/outline/types";

/** Drop `richContent` so the compiler uses paragraphs / bullets / badge + blueprint again. Slide `id` unchanged. */
export function clearOutlineSlideRichContent(outline: DeckOutline, slideId: string): DeckOutline {
  return {
    ...outline,
    slides: outline.slides.map((s) => (s.id === slideId ? { ...s, richContent: undefined } : s)),
  };
}

/** Clear rich content and reset structured copy to a single paragraph from the slide title (or placeholder). */
export function resetOutlineSlideStructuredBody(outline: DeckOutline, slideId: string): DeckOutline {
  return {
    ...outline,
    slides: outline.slides.map((s) =>
      s.id === slideId
        ? {
            ...s,
            richContent: undefined,
            paragraphs: [s.title?.trim() || "Slide"],
            bullets: undefined,
            badge: undefined,
          }
        : s
    ),
  };
}
