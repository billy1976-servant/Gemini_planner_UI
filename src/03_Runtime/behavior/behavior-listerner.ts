// src/behavior/behavior-listener.ts
"use client";


/**
 * GLOBAL BEHAVIOR LISTENER — HARD DEBUG
 * Purpose:
 * - PROVE this file is loaded
 * - PROVE the listener is installed
 * - PROVE what the navigate payload contains
 * - ZERO guards, ZERO assumptions
 */


console.log("🔥🔥🔥 behavior-listener.ts FILE LOADED 🔥🔥🔥");


export function installBehaviorListener(navigate: (to: string) => void) {
  console.log("🟢 installBehaviorListener CALLED");


  if (typeof window === "undefined") {
    console.warn("❌ window undefined — aborting listener install");
    return;
  }


  /* =========================
     NAVIGATION — HARD LOG
  ========================= */
  window.addEventListener("navigate", (e: any) => {
    console.group("➡️ [navigate] EVENT FIRED");


    console.log("raw event:", e);
    console.log("event.detail:", e?.detail);
    console.log("detail keys:", e?.detail ? Object.keys(e.detail) : "NONE");


    const to = e?.detail?.to;
    const target = e?.detail?.target;


    console.log("detail.to:", to);
    console.log("detail.target:", target);


    const destination = to ?? target;


    console.log("RESOLVED destination:", destination);


    if (!destination) {
      console.error("❌ MISSING DESTINATION — navigation aborted");
      console.groupEnd();
      return;
    }


    console.log("✅ NAVIGATING TO:", destination);
    console.groupEnd();


    navigate(destination);
  });


  /* =========================
     ACTION — HARD LOG
  ========================= */
  window.addEventListener("action", (e: any) => {
    console.group("⚙️ [action] EVENT FIRED");
    console.log("raw event:", e);
    console.log("event.detail:", e?.detail);
    console.groupEnd();
  });


  /* =========================
     INTERACTION — HARD LOG
  ========================= */
  window.addEventListener("interaction", (e: any) => {
    console.group("👆 [interaction] EVENT FIRED");
    console.log("raw event:", e);
    console.log("event.detail:", e?.detail);
    console.groupEnd();
  });


  console.log("🧠 behavior-listener INSTALLED");
}


