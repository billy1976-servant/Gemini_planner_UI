"use client";

import React from "react";

const LINKS: { label: string; to: string }[] = [
  { label: "Me", to: "HiClarify/me/me_home" },
  { label: "Plans", to: "HiClarify/play/play_home" },
  { label: "Build", to: "HiClarify/build/build_home" },
  { label: "People", to: "HiClarify/others/others_home" },
  { label: "Apps", to: "HiClarify/tools/tools_home" },
];

export default function TopTextNav() {
  const navigate = (to: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("navigate", { detail: { to } }));
    }
  };

  return (
    <nav
      role="navigation"
      aria-label="Main"
      style={{
        position: "sticky",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        padding: "12px 16px",
        background: "var(--app-bg, #fff)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        fontWeight: 300,
        fontSize: "14px",
        letterSpacing: "0.02em",
      }}
    >
      {LINKS.map(({ label, to }) => (
        <button
          key={to}
          type="button"
          onClick={() => navigate(to)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            color: "var(--color-text, #1a1a1a)",
            font: "inherit",
          }}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
