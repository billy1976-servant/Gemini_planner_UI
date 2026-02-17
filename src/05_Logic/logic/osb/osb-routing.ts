/**
 * OSB V5 — Routing and suggestion layer. Parser + keywords → route chips and optional journey.
 * No new engine; pure functions only.
 */

import { interpretStream } from "@/logic/engines/structure/extreme-mode-parser";
import type { ParseResult } from "@/logic/engines/structure/structure.types";
import { getJourneyPack, getJourneyPackIds } from "@/logic/planner/journey-registry";

export type OSBRoute = "journal" | "task" | "note" | "track" | "plan";

export type OSBSuggestion = {
  primary: OSBRoute | "journey";
  secondary: OSBRoute[];
  trackHint?: string;
  journey?: { id: string; name: string };
  phrase?: string;
};

const TRACK_KEYS = ["think", "repent", "ask", "conform", "keep"] as const;
const TRACK_KEYWORDS: Record<string, string> = {
  think: "think reflect ponder consider",
  repent: "repent confess sorry",
  ask: "ask pray question",
  conform: "conform obey",
  keep: "keep remember hold",
};

const JOURNEY_KEYWORDS: Record<string, string> = {
  travel: "vacation trip travel holiday getaway trip planning going away",
  remodel: "remodel renovation kitchen bathroom home improvement",
  recovery: "recovery sober addiction healing",
  business: "business launch start company",
  health: "health fitness diet exercise",
};

function tokenize(str: string): Set<string> {
  return new Set(str.toLowerCase().trim().split(/\s+/).filter(Boolean));
}

/**
 * Map parser intent + keywords to OSB route and optional track.
 */
export function getOSBRoute(
  text: string,
  parseResult?: ParseResult
): { type: OSBRoute; track?: string } {
  const t = text.toLowerCase().trim();
  if (!t) return { type: "task" };

  const intent = parseResult?.intent ?? interpretStream([{ text, isFinal: true }]).intent;

  if (intent === "note") return { type: "note" };
  if (intent === "question" || intent === "command") return { type: "task" };

  for (const track of TRACK_KEYS) {
    const words = tokenize(TRACK_KEYWORDS[track]);
    for (const w of tokenize(t)) {
      if (words.has(w)) return { type: "track", track };
    }
  }

  const planWords = tokenize("schedule plan plan something tomorrow meeting calendar");
  for (const w of tokenize(t)) {
    if (planWords.has(w)) return { type: "plan" };
  }

  if (intent === "task") return { type: "task" };
  return { type: "journal" };
}

/**
 * Suggest primary + secondary chips and optional journey (e.g. "Start Vacation plan").
 */
export function getOSBSuggestion(text: string): OSBSuggestion {
  const draft = text.trim();
  const parseResult = draft ? interpretStream([{ text: draft, isFinal: true }]) : null;
  const route = getOSBRoute(draft, parseResult ?? undefined);

  const secondary: OSBRoute[] = [];
  if (route.type !== "journal") secondary.push("journal");
  if (route.type !== "task") secondary.push("task");
  if (route.type !== "note") secondary.push("note");
  if (route.type !== "track") secondary.push("track");

  let journey: { id: string; name: string } | undefined;
  const tokens = tokenize(draft);
  for (const [id, phrase] of Object.entries(JOURNEY_KEYWORDS)) {
    const kw = tokenize(phrase);
    for (const w of tokens) {
      if (kw.has(w)) {
        const pack = getJourneyPack(id);
        if (pack) {
          journey = { id: pack.id, name: pack.name };
          break;
        }
      }
    }
    if (journey) break;
  }

  return {
    primary: journey ? "journey" : route.type,
    secondary: journey ? ["task", "journal", "note"] : secondary,
    trackHint: route.track,
    journey,
    phrase: draft || undefined,
  };
}

export function getJourneyPackIdsForOSB(): string[] {
  return getJourneyPackIds();
}
