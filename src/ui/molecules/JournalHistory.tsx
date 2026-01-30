"use client";

import React from "react";

type JournalHistoryProps = {
  params?: {
    entries?: unknown;
  };
};

export default function JournalHistory({ params }: JournalHistoryProps) {
  const raw = params?.entries;

  const entries: string[] = Array.isArray(raw)
    ? raw.filter((x): x is string => typeof x === "string" && x.length > 0)
    : typeof raw === "string" && raw.length > 0
    ? [raw]
    : [];

  if (entries.length === 0) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
        Saved entries
      </div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {entries.map((e, i) => (
          <li key={i} style={{ marginBottom: 6 }}>
            {e}
          </li>
        ))}
      </ul>
    </div>
  );
}

