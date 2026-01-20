// src/state/state-store.ts
"use client";

import { appendEvent, getLog, replaceLog } from "./state-log";
import { deriveState } from "./state-resolver";
import type { DerivedState } from "./state";
import { saveState, loadState } from "./persistence-adapter";

/* =========================
   INTERNAL STORE
========================= */
let derived: DerivedState = deriveState(getLog());
const listeners = new Set<() => void>();

/* =========================
   PUBLIC API
========================= */
export function getState(): DerivedState {
  return derived;
}

export function subscribeState(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* =========================
   SINGLE MUTATION ENTRY
========================= */
export function dispatchState(intent: string, payload?: any) {
  // 1️⃣ append event
  appendEvent(intent, payload);

  // 2️⃣ derive immediately (critical for controlled inputs)
  derived = deriveState(getLog());

  // 3️⃣ notify subscribers synchronously
  listeners.forEach(l => l());

  // 4️⃣ persist (client only)
  if (typeof window !== "undefined") {
    saveState();
  }
}

/* =========================
   RUNTIME INSTALL (CLIENT ONLY)
========================= */
if (typeof window !== "undefined") {
  // 🔑 Restore persisted event log ONCE
  const loadedLog = loadState() as unknown;

  if (Array.isArray(loadedLog)) {
    replaceLog(loadedLog);
    derived = deriveState(getLog());
  }

  window.addEventListener("state-mutate", (e: any) => {
    const { name, ...payload } = e.detail || {};
    if (!name) return;
    dispatchState(name, payload);
  });

  // 🔑 DEV / BOOTSTRAP INIT (runs once per client session)
  dispatchState("system.init");
}

