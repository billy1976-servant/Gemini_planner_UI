"use client";

/**
 * Minimal store for nav debug visibility: last save and last click.
 * Used so Navigation panel can show runtime evidence without console.
 */

export type NavDebugSave = {
  type: "save";
  screenKey: string;
  selectedElementId: string;
  toScreenId?: string;
  toAnchor?: string;
  updatedKeys: string[];
};

export type NavDebugClick = {
  type: "click";
  id: string;
  screenKey: string;
  navFound: boolean;
  toScreenId?: string;
  toAnchor?: string;
  allKeys: string[];
};

export type NavDebugEvent = NavDebugSave | NavDebugClick;

let last: NavDebugEvent | null = null;
const listeners = new Set<() => void>();

export function setNavDebug(event: NavDebugEvent): void {
  last = event;
  listeners.forEach((fn) => fn());
}

export function getNavDebug(): NavDebugEvent | null {
  return last;
}

export function subscribeNavDebug(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
