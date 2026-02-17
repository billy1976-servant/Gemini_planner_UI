/**
 * OSB V5 — Journey pack registry. Load by id for structure:addJourney.
 */
import type { JourneyPack } from "./journey-types";
import { travelJourneyPack } from "./journey-packs/travel";

const packs: Record<string, JourneyPack> = {
  travel: travelJourneyPack,
};

export function getJourneyPack(id: string): JourneyPack | undefined {
  return packs[id];
}

export function getJourneyPackIds(): string[] {
  return Object.keys(packs);
}
