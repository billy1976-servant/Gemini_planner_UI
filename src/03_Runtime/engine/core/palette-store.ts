// src/engine/core/palette-store.ts
"use client";

/**
 * Palette list and resolution: single source is @/palettes (palettes object and PaletteName type).
 * Palette set is derived from JSON files in the palettes folder; no manual registration in code.
 *
 * Single source of truth for active palette: state.values.paletteName (via dispatchState).
 * This module derives from state only; no mutable activePaletteName.
 */
import { palettes } from "@/palettes";
import { getState, subscribeState, dispatchState } from "@/state/state-store";

/**
 * SUBSCRIBERS (renderer-only)
 */
const listeners = new Set<() => void>();

/**
 * Notify palette subscribers when state changes (so getPaletteName() / getPalette() reflect current state).
 */
function notifyListeners() {
  listeners.forEach((fn) => fn());
}

subscribeState(notifyListeners);

/**
 * SET ACTIVE PALETTE
 * Thin wrapper: writes to state only. Validates name against palettes.
 */
export function setPalette(name: string) {
  const next = palettes[name] ? name : "default";
  dispatchState("state.update", { key: "paletteName", value: next });
}

/**
 * GET ACTIVE PALETTE OBJECT
 * Used by token resolver. Derived from state.values.paletteName.
 */
export function getPalette() {
  const name = getPaletteName();
  return (palettes as Record<string, unknown>)[name] ?? (palettes as Record<string, unknown>).default;
}

/**
 * GET ACTIVE PALETTE NAME (STRING)
 * REQUIRED by app/layout.tsx. Single source of truth: state.values.paletteName.
 */
export function getPaletteName() {
  return getState()?.values?.paletteName ?? "default";
}

/**
 * SUBSCRIBE TO PALETTE CHANGES
 * MUST ONLY BE USED AT RENDERER ROOT
 */
export function subscribePalette(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
