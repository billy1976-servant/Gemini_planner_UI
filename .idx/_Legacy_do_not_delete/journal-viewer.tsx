"use client";
import { useSyncExternalStore } from "react";
import { subscribeState, getState } from "@/state/state-store";


export default function JournalViewer() {
  const state = useSyncExternalStore(subscribeState, getState, getState);
  const entries = state.journal
    ? Object.entries(state.journal)
    : [];


  return (
    <div style={{ padding: 12 }}>
      <h3>Journal</h3>


      {entries.length === 0 && (
        <div>No journal entries</div>
      )}


      <ul>
        {entries.map(([key, value]) => (
          <li key={key}>
            <strong>{key}:</strong> {String(value)}
          </li>
        ))}
      </ul>
    </div>
  );
}


