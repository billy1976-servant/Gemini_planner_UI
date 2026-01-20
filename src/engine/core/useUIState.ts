"use client";
import { useSyncExternalStore } from "react";
import { UIState } from "./ui-state";


export function useUIState(key?: string) {
  return useSyncExternalStore(
    UIState.subscribe,
    () => (key ? UIState.get(key) : UIState.getAll())
  );
}


