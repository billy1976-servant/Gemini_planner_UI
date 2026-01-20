// src/engine/core/palette-store.ts
"use client";


import { palettes } from "@/palettes";


/**
 * ACTIVE PALETTE (STRING ONLY — CRITICAL)
 */
let activePaletteName = "default";


/**
 * SUBSCRIBERS (renderer-only)
 */
const listeners = new Set<() => void>();


/**
 * SET ACTIVE PALETTE
 * - Validates name
 * - Notifies subscribers
 */
export function setPalette(name: string) {
  const next = palettes[name] ? name : "default";
  if (next === activePaletteName) return;


  activePaletteName = next;
  listeners.forEach(fn => fn());
}


/**
 * GET ACTIVE PALETTE OBJECT
 * Used by token resolver
 */
export function getPalette() {
  return palettes[activePaletteName];
}


/**
 * GET ACTIVE PALETTE NAME (STRING)
 * REQUIRED by app/layout.tsx
 */
export function getPaletteName() {
  return activePaletteName;
}


/**
 * SUBSCRIBE TO PALETTE CHANGES
 * ⚠️ MUST ONLY BE USED AT RENDERER ROOT
 */
export function subscribePalette(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}


