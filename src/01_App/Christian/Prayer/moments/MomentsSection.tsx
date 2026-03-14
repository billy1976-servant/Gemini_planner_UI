"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getPrayers } from "../api/prayer-api";
import type { Prayer } from "../PrayerTypes";

export interface MomentsSectionProps {
  prayerBase?: string;
  groupSlug?: string | null;
  groupId?: string | null;
}

function getAudioUrl(audioUrl: string): string {
  if (audioUrl.startsWith("http") || audioUrl.startsWith("/")) return audioUrl;
  return `/api/prayer/audio?path=${encodeURIComponent(audioUrl)}`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MomentsSection({ prayerBase = "/prayer", groupSlug, groupId }: MomentsSectionProps) {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "group">(groupId ? "group" : "all");

  useEffect(() => {
    setLoading(true);
    const fetchGroupId = filter === "group" && groupId ? groupId : undefined;
    getPrayers(fetchGroupId ?? null)
      .then((list) => setPrayers(list.filter((p) => p.published)))
      .catch(() => setPrayers([]))
      .finally(() => setLoading(false));
  }, [filter, groupId]);

  const base = groupSlug ? `${prayerBase}/${groupSlug}` : prayerBase;

  return (
    <div className="prayer-moments-feed" style={{ marginTop: "1rem" }}>
      <h2 className="prayer-section-title">Prayer Moments</h2>
      <p className="prayer-section-description" style={{ marginBottom: "0.75rem" }}>
        Short prayers from the community. Record and publish to appear here.
      </p>

      {groupId && (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <button
            type="button"
            onClick={() => setFilter("all")}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: 8,
              border: `1px solid ${filter === "all" ? "var(--prayer-play-bg)" : "var(--prayer-card-border)"}`,
              background: filter === "all" ? "var(--prayer-play-bg)" : "transparent",
              color: filter === "all" ? "#fff" : "var(--prayer-text)",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("group")}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: 8,
              border: `1px solid ${filter === "group" ? "var(--prayer-play-bg)" : "var(--prayer-card-border)"}`,
              background: filter === "group" ? "var(--prayer-play-bg)" : "transparent",
              color: filter === "group" ? "#fff" : "var(--prayer-text)",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            This group
          </button>
        </div>
      )}

      {loading ? (
        <p className="prayer-section-muted">Loading…</p>
      ) : prayers.length === 0 ? (
        <p className="prayer-section-muted">No prayers yet. Record one to get started.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {prayers.map((p) => (
            <li
              key={p.id}
              className="prayer-moment-card"
              style={{
                marginBottom: "1rem",
                padding: "1rem",
                borderRadius: 12,
                border: "1px solid var(--prayer-card-border, rgba(148,163,184,0.08))",
                background: "rgba(24,22,36,0.4)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", flexWrap: "wrap" }}>
                <div>
                  <div className="prayer-title" style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>{p.title}</div>
                  <div style={{ fontSize: "0.875rem", color: "var(--prayer-text-muted, #94a3b8)" }}>
                    {p.userName ?? p.userId ?? "Anonymous"}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--prayer-text-muted)", marginTop: "0.25rem" }}>
                    {formatDuration(p.duration ?? 0)}
                  </div>
                </div>
                <audio
                  src={getAudioUrl(p.audioUrl)}
                  controls
                  style={{ height: 32, minWidth: 200, flex: "1 1 200px" }}
                  preload="metadata"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: "1rem" }}>
        <Link href={base} className="prayer-share-link">
          ← Back to Prayer
        </Link>
      </div>
    </div>
  );
}
