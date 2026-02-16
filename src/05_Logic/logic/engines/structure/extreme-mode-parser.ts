/**
 * Extreme mode parser — stream → split → interpret → candidates. Pure; no state, no voice UI.
 * Wire interpreter to structure-mapper.engine.
 */

import type { ParseResult, ParseSegment, ResolvedRuleset, StructureItem } from "./structure.types";
import { mapToCandidates } from "./structure-mapper.engine";

const SENTENCE_BOUNDARIES = /[.!?]+/;
const CONJUNCTION_SPLIT = /\s+(?:and|also|then)\s+/i;

/**
 * Split text into sentences (on .!? and on " and ", " also ", " then ").
 */
export function splitSentences(text: string): string[] {
  if (!text || typeof text !== "string") return [];
  let out = text.trim().split(SENTENCE_BOUNDARIES).map((s) => s.trim()).filter(Boolean);
  const withConj: string[] = [];
  for (const s of out) {
    const parts = s.split(CONJUNCTION_SPLIT).map((p) => p.trim()).filter(Boolean);
    withConj.push(...parts);
  }
  return withConj.length ? withConj : (text.trim() ? [text.trim()] : []);
}

/**
 * Classify segment intent: task | note | question | command (heuristic).
 */
export function detectIntent(text: string): "task" | "note" | "question" | "command" {
  const t = text.toLowerCase().trim();
  if (/^(what|when|show|list|get me|who)\b/.test(t) || t.endsWith("?")) return "question";
  if (/^(note|remember|journal)\b/.test(t)) return "note";
  if (/^(cancel|switch|add above|clear)\b/.test(t)) return "command";
  if (/^(add|remind|schedule|task|todo|do)\b/.test(t) || !t.includes("?")) return "task";
  return "task";
}

/**
 * From stream segments (e.g. final transcript), produce parse result (segments + sentences).
 */
export function interpretStream(segments: ParseSegment[]): ParseResult {
  const texts = segments.map((s) => s.text).filter(Boolean);
  const full = texts.join(" ");
  const sentences = splitSentences(full);
  const intent = full.trim() ? detectIntent(full) : undefined;
  return {
    segments: segments.map((s) => ({ text: s.text, isFinal: s.isFinal, timestamp: s.timestamp })),
    sentences,
    intent,
  };
}

/**
 * Parse result + rules + context → candidates (wire to structure-mapper).
 */
export function interpretToCandidates(
  parseResult: ParseResult,
  rules: ResolvedRuleset,
  context: { refDate: Date; activeCategoryId?: string }
): { candidates: StructureItem[]; trace: ReturnType<typeof mapToCandidates>["trace"] } {
  const { candidates, trace } = mapToCandidates(parseResult, rules, {
    refDate: context.refDate,
    activeCategoryId: context.activeCategoryId,
    rules,
  });
  return { candidates, trace };
}

/**
 * Full pipeline: segments → parse result → candidates.
 */
export function streamToCandidates(
  segments: ParseSegment[],
  rules: ResolvedRuleset,
  refDate: Date = new Date(),
  activeCategoryId?: string
): { candidates: StructureItem[]; trace: ReturnType<typeof mapToCandidates>["trace"] } {
  const parseResult = interpretStream(segments);
  return interpretToCandidates(parseResult, rules, { refDate, activeCategoryId });
}
