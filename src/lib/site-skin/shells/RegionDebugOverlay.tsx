"use client";

import React from "react";

export type RegionDebugItem = {
  id?: string;
  role?: string;
  childrenCount?: number;
};

export default function RegionDebugOverlay({
  enabled,
  experience,
  items,
}: {
  enabled: boolean;
  experience: string;
  items: RegionDebugItem[];
}) {
  if (!enabled) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        zIndex: 9999,
        background: "rgba(0,0,0,0.85)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 10,
        padding: 12,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: 12,
        maxWidth: 420,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Composed regions</div>
      <div style={{ opacity: 0.85, marginBottom: 8 }}>experience: {experience}</div>
      <div style={{ display: "grid", gap: 6 }}>
        {items.map((it, idx) => (
          <div key={`${it.id ?? it.role ?? "region"}-${idx}`} style={{ display: "flex", gap: 8 }}>
            <span style={{ minWidth: 140, opacity: 0.9 }}>{it.id ?? "(no id)"}</span>
            <span style={{ minWidth: 90, opacity: 0.9 }}>{it.role ?? "(no role)"}</span>
            <span style={{ opacity: 0.7 }}>kids:{it.childrenCount ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

