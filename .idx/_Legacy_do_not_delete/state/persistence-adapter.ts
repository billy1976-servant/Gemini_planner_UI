"use client";


import { getLog, replaceLog } from "./state-log";
import type { StateEvent } from "./state";


const KEY = "__app_state_log__";


/** Save append-only log */
export function saveState() {
  const log = getLog();
  localStorage.setItem(KEY, JSON.stringify(log));
}


/** Load append-only log (runs once on startup) */
export function loadState() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return;


  try {
    const events = JSON.parse(raw) as StateEvent[];
    replaceLog(events);
  } catch (err) {
    console.error("[persistence] failed to load", err);
  }
}

