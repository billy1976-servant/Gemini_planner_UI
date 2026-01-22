/**
 * Presentation Model - Output contract for all presentation engines
 * Defines how a flow should be presented (ordering, grouping, emphasis)
 * without changing the underlying flow content or logic
 */

export type PresentationGroup = {
  id: string;
  title: string;
  stepIds: string[];
};

export type PresentationModel = {
  engineId: string;
  title: string;
  stepOrder: string[]; // Array of step IDs in render order
  groups?: PresentationGroup[]; // Optional grouping of steps
  badges?: Record<string, string[]>; // stepId -> array of badge labels
  notes?: string[]; // Short engine notes (1-2 lines)
};
