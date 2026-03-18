"use client";
import React from "react";
import { useSyncExternalStore } from "react";
import { getState, subscribeState } from "@/state/state-store";


export default function UserInputViewer({ params }: any) {
  const state = useSyncExternalStore(
    subscribeState,
    getState,
    getState
  );


  const rawTrack = params?.track ?? "default";
  const rawKey = params?.stateKey; // supports: "journal.track.key", "journal.key", or raw fieldKey

  // 1) Prefer the generic values surface (Phase B: Field typing → state.update writes here)
  if (typeof rawKey === "string" && rawKey.length > 0) {
    const v = state?.values?.[rawKey];
    if (v !== undefined) {
      return (
        <pre style={{ padding: 12, background: "#f5f5f5" }}>
          values.{rawKey}: {JSON.stringify(v, null, 2)}
        </pre>
      );
    }
  }

  // 2) Fallback: journal surface
  let track = rawTrack;
  let key = rawKey;

  if (typeof rawKey === "string" && rawKey.startsWith("journal.")) {
    const rest = rawKey.slice("journal.".length);
    // journal.track.key (preferred)
    if (rest.includes(".")) {
      const [t, ...kParts] = rest.split(".");
      if (t) track = t;
      key = kParts.join(".");
    } else {
      // journal.key
      key = rest;
    }
  }

  const value =
    typeof key === "string" && key.length > 0 && state.journal?.[track]
      ? state.journal[track][key]
      : undefined;


  return (
    <pre style={{ padding: 12, background: "#f5f5f5" }}>
      {track}.{typeof key === "string" ? key : ""}: {JSON.stringify(value, null, 2)}
    </pre>
  );
}


