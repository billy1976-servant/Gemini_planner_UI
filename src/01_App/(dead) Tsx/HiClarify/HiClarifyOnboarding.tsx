"use client";

import React from "react";

/**
 * Google-style onboarding: single view, 5 clean lines, centered stack.
 * No icons, no tabs, no play button, minimal style.
 */
export default function HiClarifyOnboarding() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        color: "#f1f5f9",
      }}
    >
      <div
        style={{
          maxWidth: "420px",
          width: "100%",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
          HiClarify
        </h1>
        <p style={{ fontSize: "1rem", color: "#94a3b8", margin: 0 }}>
          Life Operating System
        </p>
        <p
          style={{
            fontSize: "1.125rem",
            lineHeight: 1.6,
            whiteSpace: "pre-line",
            margin: 0,
          }}
        >
          Clarity for your mind, your time, your relationships, your direction.
        </p>
        <p style={{ fontSize: "1.125rem", lineHeight: 1.6, margin: 0 }}>
          Track. Build. Protect. Grow.
        </p>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem("hiclarify_entered_once", "1");
            } catch {
              /* ignore */
            }
            window.dispatchEvent(
              new CustomEvent("navigate", { detail: { to: "HiClarify/home/home_screen" } })
            );
          }}
          style={{
            marginTop: "0.5rem",
            padding: "0.75rem 2rem",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#0f172a",
            background: "#f1f5f9",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Enter System
        </button>
      </div>
    </div>
  );
}
