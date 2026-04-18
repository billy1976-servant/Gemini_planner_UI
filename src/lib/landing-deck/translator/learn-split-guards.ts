import { LEARN_SLIDE_TYPES_V1 } from "@/lib/landing-deck/outline/types";
import type { LearnContentMap, LearnStructureInput, StructureSlide } from "./merge-structure-and-content";

const KIND_SET = new Set<string>(LEARN_SLIDE_TYPES_V1);

function isStructureSlideRow(v: unknown): v is StructureSlide {
  if (v == null || typeof v !== "object" || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id.trim()) return false;
  if (typeof o.kind !== "string" || !KIND_SET.has(o.kind)) return false;
  return true;
}

export function isLearnStructureInput(v: unknown): v is LearnStructureInput {
  if (v == null || typeof v !== "object" || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  const meta = o.meta;
  if (meta == null || typeof meta !== "object" || Array.isArray(meta)) return false;
  const m = meta as Record<string, unknown>;
  if (typeof m.title !== "string" || typeof m.shopUrl !== "string") return false;
  if (!Array.isArray(o.slides) || o.slides.length === 0) return false;
  if (!o.slides.every(isStructureSlideRow)) return false;
  return true;
}

export function isLearnContentMap(v: unknown): v is LearnContentMap {
  if (v == null || typeof v !== "object" || Array.isArray(v)) return false;
  for (const val of Object.values(v as Record<string, unknown>)) {
    if (val == null || typeof val !== "object" || Array.isArray(val)) return false;
  }
  return true;
}
