"use client";


import React from "react";
import Cleanup25xDemo from "@/apps-tsx/tsx-screens/calculators/calculator-1";


export default function PremiumOnboarding() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 20% 0%, #1e293b 0%, #020617 60%)",
        color: "#e5e7eb",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "40px 16px",
      }}
    >
      <Cleanup25xDemo />
    </div>
  );
}


