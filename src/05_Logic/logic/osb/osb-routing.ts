/**
 * OSB V5 — Routing and suggestion layer. Parser + keywords → route chips and optional journey.
 * No new engine; pure functions only. Track keys, keywords, and labels from journal-modes.json.
 */

import { interpretStream } from "@/logic/engines/structure/extreme-mode-parser";
import type { ParseResult } from "@/logic/engines/structure/structure.types";
import { getJourneyPack, getJourneyPackIds } from "@/logic/planner/journey-registry";
import journalModesConfig from "@/config/journal-modes.json";

export type OSBRoute = "journal" | "task" | "note" | "track" | "plan";

export type OSBSuggestion = {
  primary: OSBRoute | "journey";
  secondary: OSBRoute[];
  trackHint?: string;
  journey?: { id: string; name: string };
  phrase?: string;
};

type JournalModesConfig = {
  routes: string[];
  defaultTrack: string;
  routeLabels?: Record<string, string>;
  tracks: Array<{ id: string; keywords: string }>;
  journeyKeywords?: Record<string, string>;
  planKeywords?: string;
};

const config = journalModesConfig as JournalModesConfig;

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

  const tracks = config.tracks ?? [];
  for (const track of tracks) {
    const words = tokenize(track.keywords ?? "");
    for (const w of tokenize(t)) {
      if (words.has(w)) return { type: "track", track: track.id };
    }
  }

  const planKeywords = config.planKeywords ?? "schedule plan plan something tomorrow meeting calendar";
  const planWords = tokenize(planKeywords);
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

  const routeIds = config.routes ?? ["journal", "task", "note", "track", "plan"];
  const secondary: OSBRoute[] = [];
  for (const r of routeIds) {
    if (r !== route.type && (r === "journal" || r === "task" || r === "note" || r === "track" || r === "plan")) {
      secondary.push(r as OSBRoute);
    }
  }

  let journey: { id: string; name: string } | undefined;
  const journeyKeywords = config.journeyKeywords ?? {};
  const tokens = tokenize(draft);
  for (const [id, phrase] of Object.entries(journeyKeywords)) {
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
    secondary: journey ? (["task", "journal", "note"] as OSBRoute[]) : secondary,
    trackHint: route.track,
    journey,
    phrase: draft || undefined,
  };
}

export function getJourneyPackIdsForOSB(): string[] {
  return getJourneyPackIds();
}

/** Route id → display label from config. */
export function getRouteLabel(route: string): string {
  return config.routeLabels?.[route] ?? route;
}

/** Default track id when route is track and no hint. */
export function getDefaultTrack(): string {
  return config.defaultTrack ?? "default";
}
