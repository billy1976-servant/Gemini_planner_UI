"use client";


import { useEffect } from "react";


export default function AmbientAssistant() {
  useEffect(() => {
    console.log("Ambient assistant active");
  }, []);


  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(circle at center, #0f172a, #020617)",
        color: "#c7d2fe",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        letterSpacing: 0.4,
      }}
    >
      Listening quietly.
    </div>
  );
}
