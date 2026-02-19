"use client";


import { useState } from "react";


export default function GuidedStory() {
  const [step, setStep] = useState(0);


  const steps = [
    "Every decision carries weight.",
    "Most systems ask too much too early.",
    "Clarity comes from sequence, not pressure.",
  ];


  return (
    <div
      style={{
        height: "100vh",
        background: "linear-gradient(180deg, #020617, #0f172a)",
        color: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 32,
      }}
    >
      <div>
        <p style={{ fontSize: 24, maxWidth: 520 }}>{steps[step]}</p>


        {step < steps.length - 1 && (
          <button
            onClick={() => setStep(step + 1)}
            style={{
              marginTop: 24,
              padding: "10px 18px",
              background: "#2563eb",
              color: "white",
              borderRadius: 6,
            }}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
