import type { LandingDeckScreen } from "@/lib/landing-deck/schema";
import type { LearnSlideTypeV1 } from "@/lib/landing-deck/outline/types";

/** Best-effort inference when `learnSlideType` was not stored on the outline (legacy decks). */
export function inferLearnSlideTypeFromScreen(screen: LandingDeckScreen): LearnSlideTypeV1 {
  if (screen.layout === "hero") return "hero";
  if (screen.layout === "proofPanel" || screen.layout === "splitProof") return "proof";
  if (screen.layout === "textOnly") return "summary";
  if (screen.walkthrough?.inputs?.length) return "quiz";
  if (screen.content.some((b) => b.type === "ctaBand")) return "cta";
  if (screen.layout === "twoCol" || screen.layout === "twoColImageLeft") {
    return screen.content.some((b) => b.type === "comparison") ? "comparison" : "teach";
  }
  if (screen.layout === "stamped") {
    const id = screen.id.toLowerCase();
    const label = (screen.stepLabel ?? "").toLowerCase();
    if (id === "intro-tract" || id === "intro" || label === "welcome") {
      return "intro";
    }
    return "teach";
  }
  return "teach";
}
