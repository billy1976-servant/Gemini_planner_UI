import type { LearnSlideTypeV1 } from "@/lib/landing-deck/outline/types";

/** Short labels for outline list (Learn mode). */
export const LEARN_SLIDE_TYPE_PANEL_LABELS: Record<LearnSlideTypeV1, string> = {
  intro: "Intro",
  hero: "Hero",
  teach: "Teach",
  proof: "Proof",
  comparison: "Compare",
  quiz: "Quiz",
  summary: "Summary",
  cta: "CTA",
};

/** One-line guidance under slide type (Learn inspector). */
export const LEARN_SLIDE_TYPE_HINTS: Record<LearnSlideTypeV1, string> = {
  intro:
    "Opening stamped slide—set expectations. Uses Continue for the main path.",
  hero:
    "Story-first layout. Buttons here are usually links, not Next/Back (flow uses the header).",
  teach:
    "Core content slide. Try staged reveal (Advanced → Reveal) to present one block at a time.",
  proof:
    "Evidence and media. Pair a headline with testimonial, stats, or a strong visual.",
  comparison:
    "Two-column layout. Use the comparison block to contrast you vs. alternatives.",
  quiz:
    "Single-question checkpoint. Configure answers under Walkthrough & tracker.",
  summary:
    "Recap only—avoid Next/Back/Goto here so the layout stays text-focused.",
  cta:
    "Closing momentum. Title often powers the highlighted CTA band.",
};

/** Shown above slide type / deck filters in Learn deterministic authoring. */
export const LEARN_STRUCTURE_SECTION_INTRO =
  "Slide kind, template, reveal pacing, and path filters. These fields prefer the structure side of your saved learn split.";

/** Shown above NodeInspector copy/media controls in Learn deterministic authoring. */
export const LEARN_CONTENT_SECTION_INTRO =
  "Copy, media, buttons, and quiz wiring you see on the canvas. These fields prefer the content side of your saved learn split.";

export const LEARN_REVEAL_SECTION_INTRO =
  "Staged teaching: choose how much appears at once in the live preview. Presenter mode respects the same sequence.";

export const LEARN_MEDIA_SECTION_INTRO =
  "Images and video for this step. Slot 1 is primary (hero, proof band, or column). Add slots for galleries or second columns.";

/** Shown above walkthrough controls in Learn deterministic authoring (replaces jargon-heavy default copy). */
export const LEARN_WALKTHROUGH_SECTION_INTRO =
  "Quiz slides use one multiple-choice field and a short gate message. Options: one per line, as value or value|label. Optional tracker lines map answers to friendly labels in the sidebar.";
