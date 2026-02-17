"use client";

import React, { useState } from "react";

const SLIDES = [
  {
    title: "HiClarify",
    subtitle: "Life Operating System",
  },
  {
    text: "Clarity for your mind,\nyour time,\nyour relationships,\nyour direction.",
  },
  {
    text: "Track.\nBuild.\nProtect.\nGrow.",
  },
  {
    cta: "Enter System",
  },
];

export default function HiClarifyOnboarding() {
  const [slide, setSlide] = useState(0);
  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

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
        }}
      >
        {current.title != null && (
          <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            {current.title}
          </h1>
        )}
        {current.subtitle != null && (
          <p style={{ fontSize: "1.125rem", color: "#94a3b8", marginBottom: "2rem" }}>
            {current.subtitle}
          </p>
        )}
        {current.text != null && (
          <p
            style={{
              fontSize: "1.25rem",
              lineHeight: 1.6,
              whiteSpace: "pre-line",
              marginBottom: "2rem",
            }}
          >
            {current.text}
          </p>
        )}
        {current.cta != null && (
          <button
            type="button"
            onClick={() => {
              if (isLast) {
                try {
                  localStorage.setItem("hiclarify_entered_once", "1");
                } catch {
                  /* ignore */
                }
                window.dispatchEvent(
                  new CustomEvent("navigate", { detail: { to: "HiClarify/home/home_screen" } })
                );
              }
            }}
            style={{
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
            {current.cta}
          </button>
        )}
        {!current.cta && (
          <button
            type="button"
            onClick={() => setSlide((s) => Math.min(s + 1, SLIDES.length - 1))}
            style={{
              padding: "0.5rem 1.5rem",
              fontSize: "0.875rem",
              color: "#94a3b8",
              background: "transparent",
              border: "1px solid #475569",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Next
          </button>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "2rem",
          display: "flex",
          gap: "0.5rem",
        }}
      >
        {SLIDES.map((_, i) => (
          <span
            key={i}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: i === slide ? "#f1f5f9" : "#475569",
            }}
          />
        ))}
      </div>
    </div>
  );
}
