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


  const track = params?.track ?? "default";
  const key = params?.stateKey; // "journal.test" OR just "test"


  const field =
    typeof key === "string" && key.includes(".")
      ? key.split(".")[1]
      : key;


  const value =
    field && state.journal?.[track]
      ? state.journal[track][field]
      : undefined;


  return (
    <pre style={{ padding: 12, background: "#f5f5f5" }}>
      {track}.{field}: {JSON.stringify(value, null, 2)}
    </pre>
  );
}


