"use client";

import React from "react";
import type { Prayer } from "./PrayerTypes";

export interface ReplayTimelineProps {
  prayer: Prayer;
  durationSec: number;
  onSeek?: (timestampSec: number) => void;
}

export function ReplayTimeline({ prayer, durationSec, onSeek }: ReplayTimelineProps) {
  const pages = prayer.studyPages ?? [];
  if (!durationSec || !Number.isFinite(durationSec) || pages.length === 0) return null;

  const clampedPages = pages.filter((p) => typeof p.timestampSec === "number");
  if (clampedPages.length === 0) return null;

  return (
    <div className="prayer-replay-timeline" style={{ marginTop: "0.75rem" }}>
      <div className="prayer-metrics-label" style={{ marginBottom: "0.35rem" }}>
        Replay timeline
      </div>
      <div
        style={{
          position: "relative",
          height: 24,
          borderRadius: 999,
          background: "var(--prayer-card-bg, rgba(15,23,42,0.9))",
          border: "1px solid var(--prayer-card-border)",
        }}
      >
        {clampedPages.map((page) => {
          const at = page.timestampSec ?? 0;
          const pct = Math.min(100, Math.max(0, (at / durationSec) * 100));
          const clickable = Boolean(onSeek);
          return (
            <button
              key={page.id}
              type="button"
              title={`${page.title} @ ${Math.round(at)}s`}
              onClick={clickable ? () => onSeek?.(at) : undefined}
              style={{
                position: "absolute",
                left: `${pct}%`,
                top: 2,
                width: 12,
                height: 20,
                padding: 0,
                marginLeft: -6,
                background: "transparent",
                border: "none",
                cursor: clickable ? "pointer" : "default",
              }}
            >
              <span
                style={{
                  display: "block",
                  width: 2,
                  height: 20,
                  margin: "0 auto",
                  background: "var(--prayer-accent, #38bdf8)",
                }}
              />
            </button>
          );
        })}
      </div>
      <p
        style={{
          marginTop: "0.3rem",
          fontSize: "0.8rem",
          color: "var(--prayer-text-muted)",
        }}
      >
        Markers show when study pages were captured during this live recording.
      </p>
    </div>
  );
}

