"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getActiveRooms } from "../room/prayer-room-api";
import type { ActiveRoomSummary } from "../room/prayer-room-api";
import { LivePrayerCta } from "../LivePrayerCta";

export interface LiveSectionProps {
  groupSlug?: string | null;
  groupId?: string | null;
  isAdmin?: boolean;
}

const ACTIVE_POLL_MS = 10000;

export function LiveSection({ groupSlug, groupId, isAdmin }: LiveSectionProps) {
  const [rooms, setRooms] = useState<ActiveRoomSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      getActiveRooms(groupId ?? null)
        .then((list) => {
          if (!cancelled) setRooms(list);
        })
        .catch(() => {
          if (!cancelled) setRooms([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    load();
    const id = setInterval(load, ACTIVE_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [groupId]);

  const base = groupSlug ? `/prayer/${groupSlug}` : "/prayer";

  return (
    <div className="prayer-live-section" style={{ marginTop: "1rem" }}>
      <h2 className="prayer-section-title">Live Prayer Rooms</h2>
      <p className="prayer-section-description" style={{ marginBottom: "1rem" }}>
        Join or host live audio prayer rooms. Invite others by link; multiple participants can pray together.
      </p>

      {loading ? (
        <p className="prayer-section-muted">Loading rooms…</p>
      ) : rooms.length === 0 ? (
        <>
          <p className="prayer-section-muted" style={{ marginBottom: "1rem" }}>No live rooms right now. Start one below.</p>
          <LivePrayerCta groupId={groupId ?? null} isAdmin={isAdmin} />
        </>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {rooms.map((r) => (
            <li
              key={r.roomId}
              style={{
                marginBottom: "1rem",
                padding: "1rem",
                borderRadius: 12,
                border: "1px solid var(--prayer-card-border, rgba(148,163,184,0.08))",
                background: "rgba(24,22,36,0.4)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <div>
                <div className="prayer-title" style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>
                  {r.title || "Prayer Room"}
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--prayer-text-muted, #94a3b8)" }}>
                  {r.participantCount} {r.participantCount === 1 ? "person" : "people"} praying
                </div>
              </div>
              <Link
                href={`/prayer/room/${r.roomId}`}
                className="prayer-room-join-link"
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 12,
                  border: "1px solid var(--prayer-play-bg)",
                  background: "var(--prayer-play-bg)",
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                }}
              >
                Enter Room
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: "1rem" }}>
        <LivePrayerCta groupId={groupId ?? null} isAdmin={isAdmin} />
      </div>

      <div style={{ marginTop: "1rem" }}>
        <Link href={base} className="prayer-share-link">
          ← Back to Prayer
        </Link>
      </div>
    </div>
  );
}
