"use client";

import React, { useState } from "react";
import type { AnnotationStroke } from "./AnnotationOverlay";
import { formatTime } from "../utils/formatTime";

/** Single study page (metadata); may include captured image and annotations when saved during a session. */
export interface StudyPage {
  id: string;
  title: string;
  createdAt: string;
  /** Seconds from start of recording when this page was captured (optional). */
  timestampSec?: number;
  /** Data URL of captured slide/screen/video frame (when "Save page" was used with capture). */
  imageUrl?: string;
  /** Annotation strokes on this slide at save time (for replay). */
  annotations?: AnnotationStroke[];
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

  const formatTimeOptional = (sec?: number) =>
    typeof sec === "number" && Number.isFinite(sec) && sec >= 0 ? formatTime(sec) : "";

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
            <li key={page.id} style={{ fontSize: "0.8rem", color: "var(--prayer-text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {page.imageUrl && (
                <img
                  src={page.imageUrl}
                  alt=""
                  style={{ width: 40, height: 28, objectFit: "cover", borderRadius: 4 }}
                />
              )}
              <span style={{ fontWeight: 500 }}>{page.title}</span>
              {typeof page.timestampSec === "number" && (
                <span style={{ marginLeft: "0.4rem", opacity: 0.8 }}>
                  at {formatTimeOptional(page.timestampSec)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

