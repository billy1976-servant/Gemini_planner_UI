"use client";
import React, { useState } from "react";
import JsonRenderer from "@/engine/core/json-renderer";


import onboardingJson from "@/apps-offline/apps/Onboarding/trial.json";
import calculatorJson from "@/apps-offline/apps/behavior-tests/A-to-D-Test.json";
import educationJson from "@/apps-offline/apps/new-blueprint-test/app-1.json";


type ScreenKey = "onboarding" | "calculator" | "education";


const SCREENS: Record<ScreenKey, any> = {
  onboarding: onboardingJson,
  calculator: calculatorJson,
  education: educationJson,
};


export default function MultiJsonScreen() {
  const [active, setActive] = useState<ScreenKey>("onboarding");


  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 20% 0%, #1e293b 0%, #020617 60%)",
        color: "#e5e7eb",
        padding: 24,
      }}
    >
      {/* TEMP CONTROL BAR — proves switching works */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <button onClick={() => setActive("onboarding")}>Onboarding</button>
        <button onClick={() => setActive("calculator")}>Calculator</button>
        <button onClick={() => setActive("education")}>Education</button>
      </div>


      {/* JSON RENDER */}
      <JsonRenderer node={SCREENS[active]} />
    </div>
  );
}


