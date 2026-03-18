// src/engine/core/ui-state.ts
"use client";
import { useSyncExternalStore } from "react";


// ---------------------------------------------
// INTERNAL GLOBAL STATE
// ---------------------------------------------
let state = {
  lastEvent: null,
  lastArgs: null,
};


const listeners = new Set<() => void>();


function emit() {
  listeners.forEach((l) => l());
}


// ---------------------------------------------
// PUBLIC API
// ---------------------------------------------
export const UIState = {
  set(eventName, args) {
    state.lastEvent = eventName;
    state.lastArgs = args;
    emit();
  },
  getSnapshot() {
    return state;
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};


// Hook for components
export function useUIState() {
  return useSyncExternalStore(
    UIState.subscribe,
    UIState.getSnapshot,
    UIState.getSnapshot
  );
}
