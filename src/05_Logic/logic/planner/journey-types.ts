/**
 * OSB V5 — Journey pack and loader types.
 * Packs produce tree fragments + StructureItem[]; loader resolves relative-time and injects via structureAddItems + tree merge.
 */

import type { StructureTreeNode, StructureItem } from "@/logic/engines/structure/structure.types";

/** Item in journey JSON may use dueOffset instead of dueDate; resolved at load time. */
export type JourneyItemTemplate = Omit<Partial<StructureItem>, "dueDate"> & {
  dueDate?: string | null;
  /** Offset in days from targetDate (e.g. -7 = 1 week before). Resolved to dueDate at load. */
  dueOffset?: number;
  /** Which reference date to use: targetDate (e.g. trip) or startDate (e.g. program start). */
  relativeTo?: "targetDate" | "startDate";
};

export type JourneyPack = {
  id: string;
  name: string;
  version?: string;
  /** Optional tree fragments to merge under base tree (e.g. under "travel"). */
  tree?: StructureTreeNode[];
  /** Task/habit items; dueOffset resolved to dueDate using targetDate/startDate. */
  items?: JourneyItemTemplate[];
  /** Chip key → sub-pack id for expansion. */
  subJourneys?: Record<string, string>;
  /** Expansion chip labels (e.g. Dog, Kids, Budget). */
  suggestedDomains?: string[];
};

export type JourneyLoadPayload = {
  tree?: StructureTreeNode[];
  items?: JourneyItemTemplate[];
  targetDate?: string;
  startDate?: string;
};
