/**
 * OSB V5 — Vacation/travel journey pack. Attaches under base tree "travel".
 */
import type { JourneyPack } from "../journey-types";

export const travelJourneyPack: JourneyPack = {
  id: "travel",
  name: "Vacation",
  version: "1.0",
  tree: [
    {
      id: "travel",
      name: "Travel",
      order: 0,
      children: [
        { id: "travel-packing", name: "Packing", order: 0 },
        { id: "travel-budget", name: "Budget", order: 1 },
        { id: "travel-docs", name: "Documents", order: 2 },
      ],
    },
  ],
  items: [
    { title: "Book transport", categoryId: "travel", priority: 7, dueOffset: -14, relativeTo: "targetDate" },
    { title: "Set budget", categoryId: "travel-budget", priority: 7, dueOffset: -21, relativeTo: "targetDate" },
    { title: "Check documents (ID, tickets)", categoryId: "travel-docs", priority: 8, dueOffset: -7, relativeTo: "targetDate" },
    { title: "Pack bags", categoryId: "travel-packing", priority: 6, dueOffset: -1, relativeTo: "targetDate" },
    { title: "Depart", categoryId: "travel", priority: 9, dueOffset: 0, relativeTo: "targetDate" },
  ],
  subJourneys: { dog: "dog_travel", kids: "kids_travel" },
  suggestedDomains: ["Dog", "Kids", "Budget", "Packing", "Food", "Travel"],
};
