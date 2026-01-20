// screens/tsx-screens/flows-cleanup-CO/Education.tsx
"use client";
import React from "react";


type Props = {
  session: any;
  setSession: (fn: any) => void;
  track: (event: string, payload?: any) => void;
  goCalculator: () => void;
};


export default function Education({
  session,
  setSession,
  track,
  goCalculator,
}: Props) {
  /* =========================
     EDITABLE CONTENT SECTION
  ========================= */
  const LEARNED = [
    "Cleanup time quietly drains profit daily.",
    "Clean sites reduce safety risk and improve trust.",
    "Appearance influences bids, referrals, and closeouts.",
  ];


  /* =========================
     LOGIC (DO NOT EDIT)
  ========================= */
  function complete() {
    track("education.complete");
    setSession((s: any) => ({
      ...s,
      education: {
        completed: true,
        learned: LEARNED,
      },
    }));
    goCalculator();
  }


  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <h1>Education</h1>
      <ul>
        {LEARNED.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
      <button onClick={complete}>Continue to Calculator</button>
    </div>
  );
}


