"use client";


import { useSyncExternalStore } from "react";
import {
  subscribeState,
  getState,
  dispatchState,
} from "@/state/state-store";


export default function TsxProofScreen() {
  const state = useSyncExternalStore(
    subscribeState,
    getState,
    getState
  );


  const currentView = state?.currentView ?? "(unset)";


  return (
    <div style={{ padding: 24 }}>
      <h1>TSX Proof Screen</h1>


      <p>
        <b>currentView:</b> {String(currentView)}
      </p>


      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() =>
            dispatchState("state:currentView", { value: "A" })
          }
        >
          Go A
        </button>


        <button
          onClick={() =>
            dispatchState("state:currentView", { value: "B" })
          }
        >
          Go B
        </button>


        <button
          onClick={() =>
            dispatchState("state:currentView", { value: "C" })
          }
        >
          Go C
        </button>


        <button
          onClick={() =>
            dispatchState("state:currentView", { value: "D" })
          }
        >
          Go D
        </button>
      </div>
    </div>
  );
}


