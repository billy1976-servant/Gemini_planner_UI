// src/state/state.ts


export type StateEvent = {
  id: string;
  time: number;
  intent: string;
  payload?: any;
};


/**
 * 🔑 CRITICAL:
 * `journal` MUST be an object, not an array.
 * - Fields bind by key (two-way typing)
 * - Saves are semantic events, not storage
 * - This keeps the system reusable across 1,000 apps
 */
export type DerivedState = {
  journal: Record<string, string>;
  tasks: {
    id: string;
    title: string;
  }[];
  rawCount: number;
};

