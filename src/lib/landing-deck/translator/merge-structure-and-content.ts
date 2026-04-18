import type { DeckSlideMode } from "@/lib/deck-platform/deck-slide-modes";
import { compileOutlineToLandingDeck } from "@/lib/landing-deck/outline/compile-outline-to-deck";
import type {
  DeckOutline,
  DeckOutlineMeta,
  OutlineMediaRef,
  OutlineQuizSelect,
  OutlineSlide,
} from "@/lib/landing-deck/outline/types";
import type { LandingDeckScreen, LandingDeckV1 } from "@/lib/landing-deck/schema";
import { formatValidationReport, validateLandingDeck } from "@/lib/landing-deck/validate-landing-deck";
import { KIND_MAP, type SlideKind } from "./kind-map";
import { KIND_RULES, type KindRule } from "./kind-rules";

export type StructureSlide = { id: string; kind: SlideKind };

/** Structure-only input: meta + ordered slides (`kind` is translated to `templateId`). */
export type LearnStructureInput = {
  meta: DeckOutlineMeta;
  media?: Record<string, OutlineMediaRef>;
  slides: StructureSlide[];
};

/** Content keyed by slide `id` — values are partial outline fields (no `id` / `templateId`). */
export type LearnContentMap = Record<string, Record<string, unknown>>;

const SHARED_OPTIONAL_KEYS = [
  "stepLabel",
  "mediaKeys",
  "trackerValueLabels",
  "trackerEnabled",
  "modes",
  "layoutOverride",
  "presentation",
] as const;

const ALL_KNOWN_CONTENT_KEYS = new Set<string>([
  "title",
  "subtitle",
  "paragraphs",
  "bullets",
  "badge",
  "quizSelect",
  ...SHARED_OPTIONAL_KEYS,
]);

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(`[mergeStructureAndContent] ${message}`);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function isDeckSlideModes(v: unknown): v is DeckSlideMode[] {
  if (!Array.isArray(v) || v.length === 0) return false;
  return v.every((m) => m === "short" || m === "long");
}

function isPresentationConfig(v: unknown): v is NonNullable<LandingDeckScreen["presentation"]> {
  if (v == null || typeof v !== "object" || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  if (o.reveal !== undefined && o.reveal !== "none" && o.reveal !== "byBlock" && o.reveal !== "custom") {
    return false;
  }
  if (o.revealSequence !== undefined) {
    if (!Array.isArray(o.revealSequence)) return false;
    if (!o.revealSequence.every((x) => typeof x === "string")) return false;
  }
  return true;
}

function isStringRecord(v: unknown): v is Record<string, string> {
  if (v == null || typeof v !== "object" || Array.isArray(v)) return false;
  return Object.entries(v as Record<string, unknown>).every(
    ([k, val]) => typeof k === "string" && typeof val === "string"
  );
}

function parseQuizSelect(raw: unknown, slideId: string): OutlineQuizSelect {
  assert(raw != null && typeof raw === "object" && !Array.isArray(raw), `quizSelect must be an object (slide "${slideId}")`);
  const o = raw as Record<string, unknown>;
  assert(isNonEmptyString(o.inputId), `quizSelect.inputId must be a non-empty string (slide "${slideId}")`);
  assert(Array.isArray(o.options) && o.options.length > 0, `quizSelect.options must be a non-empty array (slide "${slideId}")`);
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i < o.options.length; i++) {
    const opt = o.options[i];
    assert(opt != null && typeof opt === "object" && !Array.isArray(opt), `quizSelect.options[${i}] must be an object (slide "${slideId}")`);
    const op = opt as Record<string, unknown>;
    assert(isNonEmptyString(op.value), `quizSelect.options[${i}].value must be a non-empty string (slide "${slideId}")`);
    assert(isNonEmptyString(op.label), `quizSelect.options[${i}].label must be a non-empty string (slide "${slideId}")`);
    options.push({ value: op.value.trim(), label: op.label.trim() });
  }
  const out: OutlineQuizSelect = { inputId: (o.inputId as string).trim(), options };
  if (o.label !== undefined) {
    assert(typeof o.label === "string", `quizSelect.label must be a string (slide "${slideId}")`);
    out.label = o.label;
  }
  if (o.gateMessage !== undefined) {
    assert(typeof o.gateMessage === "string", `quizSelect.gateMessage must be a string (slide "${slideId}")`);
    out.gateMessage = o.gateMessage;
  }
  return out;
}

function permittedKeysForRule(rule: KindRule): Set<string> {
  const forbidden = new Set(rule.forbidden);
  const out = new Set<string>();
  for (const k of rule.required) out.add(k);
  for (const k of rule.optional) {
    if (!forbidden.has(k)) out.add(k);
  }
  for (const k of SHARED_OPTIONAL_KEYS) {
    if (!forbidden.has(k)) out.add(k);
  }
  for (const k of forbidden) out.delete(k);
  return out;
}

function normalizeContentFields(
  kind: SlideKind,
  slideId: string,
  raw: Record<string, unknown>,
  permitted: Set<string>
): Omit<OutlineSlide, "id" | "templateId"> {
  const pick: Omit<OutlineSlide, "id" | "templateId"> = {};

  if (raw.title !== undefined) {
    assert(typeof raw.title === "string", `title must be a string (slide "${slideId}")`);
    pick.title = raw.title;
  }
  if (raw.subtitle !== undefined) {
    assert(typeof raw.subtitle === "string", `subtitle must be a string (slide "${slideId}")`);
    pick.subtitle = raw.subtitle;
  }
  if (raw.badge !== undefined) {
    assert(typeof raw.badge === "string", `badge must be a string (slide "${slideId}")`);
    pick.badge = raw.badge;
  }
  if (raw.paragraphs !== undefined) {
    assert(isStringArray(raw.paragraphs), `paragraphs must be string[] (slide "${slideId}")`);
    pick.paragraphs = raw.paragraphs;
  }
  if (raw.bullets !== undefined) {
    assert(isStringArray(raw.bullets), `bullets must be string[] (slide "${slideId}")`);
    pick.bullets = raw.bullets;
  }
  if (raw.stepLabel !== undefined) {
    assert(typeof raw.stepLabel === "string", `stepLabel must be a string (slide "${slideId}")`);
    pick.stepLabel = raw.stepLabel;
  }
  if (raw.layoutOverride !== undefined) {
    assert(typeof raw.layoutOverride === "string", `layoutOverride must be a string (slide "${slideId}")`);
    pick.layoutOverride = raw.layoutOverride;
  }
  if (raw.mediaKeys !== undefined) {
    assert(isStringArray(raw.mediaKeys), `mediaKeys must be string[] (slide "${slideId}")`);
    pick.mediaKeys = raw.mediaKeys;
  }
  if (raw.trackerValueLabels !== undefined) {
    assert(isStringRecord(raw.trackerValueLabels), `trackerValueLabels must be Record<string, string> (slide "${slideId}")`);
    pick.trackerValueLabels = raw.trackerValueLabels;
  }
  if (raw.trackerEnabled !== undefined) {
    assert(typeof raw.trackerEnabled === "boolean", `trackerEnabled must be boolean (slide "${slideId}")`);
    pick.trackerEnabled = raw.trackerEnabled;
  }
  if (raw.modes !== undefined) {
    assert(isDeckSlideModes(raw.modes), `modes must be non-empty DeckSlideMode[] ("short" | "long") (slide "${slideId}")`);
    pick.modes = raw.modes;
  }
  if (raw.presentation !== undefined) {
    assert(isPresentationConfig(raw.presentation), `presentation must be a valid reveal config (slide "${slideId}")`);
    pick.presentation = raw.presentation;
  }
  if (raw.quizSelect !== undefined) {
    pick.quizSelect = parseQuizSelect(raw.quizSelect, slideId);
  }

  for (const k of Object.keys(raw)) {
    assert(permitted.has(k), `Unknown or disallowed content key "${k}" for kind "${kind}" (slide "${slideId}")`);
    assert(ALL_KNOWN_CONTENT_KEYS.has(k), `Internal error: key "${k}" is not a known content key`);
  }

  return pick;
}

/**
 * Merge ordered structure with per-id content using strict kind rules.
 * - Every structure slide must have a content entry (may be `{}` if no required fields).
 * - Every content id must match a structure slide id.
 * - No branching: order is `structure.slides[]` only.
 */
export function mergeStructureAndContent(
  structure: LearnStructureInput,
  content: LearnContentMap,
  rules: Record<SlideKind, KindRule> = KIND_RULES
): DeckOutline {
  assert(structure.slides.length > 0, "structure.slides must be non-empty");

  const structureIds = structure.slides.map((s) => s.id);
  const idSet = new Set(structureIds);
  assert(idSet.size === structureIds.length, "Duplicate structure slide id");

  for (const cid of Object.keys(content)) {
    assert(idSet.has(cid), `Unknown content id "${cid}" (no matching structure slide)`);
  }

  const slides: OutlineSlide[] = [];

  for (const row of structure.slides) {
    const rule = rules[row.kind];
    assert(rule != null, `No rules for kind "${row.kind}" (slide "${row.id}")`);

    const rawContent = content[row.id];
    assert(rawContent != null, `Missing content entry for slide id "${row.id}" (provide at least {})`);

    const permitted = permittedKeysForRule(rule);

    for (const k of Object.keys(rawContent)) {
      assert(permitted.has(k), `Unknown or disallowed content key "${k}" for kind "${row.kind}" (slide "${row.id}")`);
    }

    for (const req of rule.required) {
      assert(
        req in rawContent && rawContent[req] !== undefined && rawContent[req] !== null,
        `Missing required field "${req}" for kind "${row.kind}" (slide "${row.id}")`
      );
    }

    if (rule.required.includes("title")) {
      assert(isNonEmptyString(rawContent.title), `Required field "title" must be a non-empty string (slide "${row.id}")`);
    }

    const normalized = normalizeContentFields(row.kind, row.id, rawContent, permitted);

    if (rule.required.includes("quizSelect")) {
      assert(normalized.quizSelect != null, `quizSelect required (slide "${row.id}")`);
    }

    slides.push({
      id: row.id,
      templateId: KIND_MAP[row.kind],
      ...normalized,
    });
  }

  return {
    meta: structure.meta,
    ...(structure.media ? { media: structure.media } : {}),
    slides,
  };
}

export function compileMergedOutlineToLandingDeck(outline: DeckOutline): LandingDeckV1 {
  return compileOutlineToLandingDeck(outline);
}

export function assertLandingDeckValid(deck: unknown, pathLabel?: string): void {
  const issues = validateLandingDeck(deck, { pathLabel });
  if (issues.some((i) => i.severity === "error")) {
    throw new Error(formatValidationReport(issues));
  }
}

/** Merge → compile → validate. Throws on any structural, rule, or deck validation error. */
export function translateStructureAndContentToLandingDeck(
  structure: LearnStructureInput,
  content: LearnContentMap,
  rules: Record<SlideKind, KindRule> = KIND_RULES
): LandingDeckV1 {
  const outline = mergeStructureAndContent(structure, content, rules);
  const deck = compileMergedOutlineToLandingDeck(outline);
  assertLandingDeckValid(deck, "translated-deck");
  return deck;
}
