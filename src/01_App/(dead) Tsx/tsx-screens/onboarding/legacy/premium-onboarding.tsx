"use client";

import React, { useState, useEffect } from "react";
import JsonRenderer from "@/engine/core/json-renderer";
import { loadScreen } from "@/engine/core/screen-loader";

const SCREEN_PATH = "Onboarding/trial.json";

export default function PremiumOnboarding() {
  const [screenTree, setScreenTree] = useState<any>(null);

  useEffect(() => {
    loadScreen(SCREEN_PATH).then(setScreenTree);
  }, []);

  if (screenTree === null) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(1200px 600px at 20% 0%, #1e293b 0%, #020617 60%)",
          color: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 20% 0%, #1e293b 0%, #020617 60%)",
        color: "#e5e7eb",
        display: "grid",
        gridTemplateColumns: "1.1fr 1fr",
        gap: 80,
        padding: "96px 96px",
      }}
    >
      {/* LEFT — HERO */}
      <div style={{ maxWidth: 560 }}>
        <h1
          style={{
            fontSize: 56,
            lineHeight: 1.05,
            fontWeight: 700,
            marginBottom: 24,
            letterSpacing: "-0.02em",
          }}
        >
          Smarter decisions.
          <br />
          Less guessing.
        </h1>


        <p
          style={{
            fontSize: 18,
            lineHeight: 1.6,
            color: "#cbd5f5",
            marginBottom: 40,
          }}
        >
          Answer a few focused questions and we’ll show you exactly what fits —
          no sales pressure, no wasted clicks.
        </p>


        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gap: 12,
            fontSize: 16,
            color: "#e2e8f0",
          }}
        >
          <li>✓ Personalized outcome</li>
          <li>✓ Clear pricing logic</li>
          <li>✓ Skip what doesn’t matter</li>
        </ul>
      </div>


      {/* RIGHT — YOUR EXISTING UI */}
      <div
        style={{
          background: "#020617",
          borderRadius: 16,
          padding: 32,
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.06), 0 40px 120px rgba(0,0,0,0.6)",
        }}
      >
        <JsonRenderer node={screenTree} />
      </div>
    </div>
  );
}


