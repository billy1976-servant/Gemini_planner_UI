"use client";

import React, { useState } from "react";

export interface StudyPage {
  id: string;
  title: string;
  createdAt: string;
  /** Seconds from start of recording when this page was captured (optional). */
  timestampSec?: number;
}

export interface StudyPagesManagerProps {
  pages: StudyPage[];
  onSavePage: (title: string) => void;
}

export function StudyPagesManager({ pages, onSavePage }: StudyPagesManagerProps) {
  const [title, setTitle] = useState("");

  const handleSave = () => {
    const trimmed = title.trim();
    onSavePage(trimmed || "Study page");
    setTitle("");
  };

  const formatTime = (sec?: number) => {
    if (typeof sec !== "number" || !Number.isFinite(sec) || sec < 0) return "";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <section>
      <div className="prayer-metrics-label" style={{ marginBottom: "0.5rem" }}>
        Study pages
      </div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Page title"
          style={{
            flex: 1,
            padding: "0.45rem 0.6rem",
            borderRadius: 8,
            border: "1px solid var(--prayer-card-border)",
            background: "var(--prayer-bg)",
            color: "var(--prayer-text)",
            fontSize: "0.85rem",
          }}
        />
        <button
          type="button"
          onClick={handleSave}
          style={{
            padding: "0.45rem 0.9rem",
            borderRadius: 8,
            border: "1px solid var(--prayer-card-border)",
            background: "var(--prayer-play-bg)",
            color: "#fff",
            cursor: "pointer",
            fontSize: "0.85rem",
            whiteSpace: "nowrap",
          }}
        >
          Save page
        </button>
      </div>

      {pages.length === 0 ? (
        <p style={{ fontSize: "0.8rem", color: "var(--prayer-text-muted)", margin: 0 }}>
          Capture key boards or scriptures while you teach. They will be attached to the replay.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {pages.map((page) => (
            <li key={page.id} style={{ fontSize: "0.8rem", color: "var(--prayer-text-muted)" }}>
              <span style={{ fontWeight: 500 }}>{page.title}</span>
              {typeof page.timestampSec === "number" && (
                <span style={{ marginLeft: "0.4rem", opacity: 0.8 }}>
                  at {formatTime(page.timestampSec)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

