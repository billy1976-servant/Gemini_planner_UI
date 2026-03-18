"use client";
import { useSyncExternalStore } from "react";
import { UIState } from "./ui-state";


export function useUIState(key?: string) {
  return useSyncExternalStore(
    UIState.subscribe,
    () => {
      const s = UIState.getSnapshot();
      return key ? (s as Record<string, unknown>)[key] : s;
    },
    () => {
      const s = UIState.getSnapshot();
      return key ? (s as Record<string, unknown>)[key] : s;
    }
  );
}


