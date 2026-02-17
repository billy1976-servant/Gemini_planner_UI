/**
 * OSB V5 — Canonical base planner tree (permanent schema).
 * Life → Home, Business, Health, Relationships, Finance, Projects, Travel, Maintenance, Growth.
 * Journeys attach under these nodes; they do not create new roots.
 */

import type { StructureTreeNode } from "@/logic/engines/structure/structure.types";

export const BASE_PLANNER_TREE: StructureTreeNode[] = [
  {
    id: "life",
    name: "Life",
    order: 0,
    children: [
      { id: "home", name: "Home", order: 0 },
      { id: "business", name: "Business", order: 1 },
      { id: "health", name: "Health", order: 2 },
      { id: "relationships", name: "Relationships", order: 3 },
      { id: "finance", name: "Finance", order: 4 },
      { id: "projects", name: "Projects", order: 5 },
      { id: "travel", name: "Travel", order: 6 },
      { id: "maintenance", name: "Maintenance", order: 7 },
      { id: "growth", name: "Growth", order: 8 },
    ],
  },
];

/** Base node ids for tree merge (journey fragments attach under these). */
export const BASE_NODE_IDS = new Set([
  "life", "home", "business", "health", "relationships", "finance", "projects", "travel", "maintenance", "growth",
]);
