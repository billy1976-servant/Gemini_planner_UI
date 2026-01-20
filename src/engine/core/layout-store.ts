"use client";


import layoutSchema from "@/layout/layout-schema.json";


/**
 * ======================================================
 * ACTIVE LAYOUT STATE (PLAIN DATA ONLY)
 * ======================================================
 */
let activeLayout: {
  type: string;
  preset: string | null;
} = {
  type: "column",
  preset: null,
};


/**
 * ======================================================
 * SUBSCRIBERS
 * ======================================================
 */
const listeners = new Set<() => void>();


/**
 * ======================================================
 * GET CURRENT LAYOUT
 * Used by JsonRenderer snapshot
 * ======================================================
 */
export function getLayout() {
  return activeLayout;
}


/**
 * ======================================================
 * SET LAYOUT
 * Merges partial updates and validates type
 * ======================================================
 */
export function setLayout(next: {
  type?: string;
  preset?: string | null;
}) {
  const resolvedType =
    next.type && layoutSchema?.types?.[next.type]
      ? next.type
      : activeLayout.type;


  activeLayout = {
    type: resolvedType,
    preset:
      next.preset !== undefined
        ? next.preset
        : activeLayout.preset,
  };


  listeners.forEach(l => l());
}


/**
 * ======================================================
 * SUBSCRIBE TO LAYOUT CHANGES
 * Required by useSyncExternalStore
 * ======================================================
 */
export function subscribeLayout(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}


