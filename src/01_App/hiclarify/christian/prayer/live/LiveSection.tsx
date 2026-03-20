"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createRoom } from "../room/prayer-room-api";
import { useActiveRooms } from "../room/ActiveRoomsContext";
import { LivePrayerCta } from "../LivePrayerCta";
import { getPrayerAnonId } from "../prayerAnonId";

export interface LiveSectionProps {
  prayerBase?: string;
  groupSlug?: string | null;
  groupId?: string | null;
  isAdmin?: boolean;
}

export function LiveSection({ prayerBase = "/prayer", groupSlug, groupId, isAdmin }: LiveSectionProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { rooms, loading } = useActiveRooms();
  const [creating, setCreating] = useState<"room" | "1on1" | "link" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const roomOptions = useMemo(
    () => (session?.user ? undefined : { anonId: getPrayerAnonId() }),
    [session?.user]
  );

  const handleStartLiveRoom = useCallback(async () => {
    setError(null);
    setCreating("room");
    try {
      const res = await createRoom(
        { title: "Live Room", groupId: groupId ?? undefined },
        roomOptions
      );
      if (res.ok === false) {
        setError(res.error);
        return;
      }
      router.push(`${prayerBase}/room/${res.roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create room");
    } finally {
      setCreating(null);
    }
  }, [prayerBase, groupId, router, roomOptions]);

  const handleStart1on1 = useCallback(async () => {
    setError(null);
    setCreating("1on1");
    try {
      const res = await createRoom(
        { title: "1-on-1 Prayer", groupId: groupId ?? undefined },
        roomOptions
      );
      if (res.ok === false) {
        setError(res.error);
        return;
      }
      router.push(`${prayerBase}/room/${res.roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create room");
    } finally {
      setCreating(null);
    }
  }, [prayerBase, groupId, router, roomOptions]);

  const handleShareMessage = useCallback(() => {
    router.push(`${prayerBase}/admin`);
  }, [prayerBase, router]);

  const handleCreatePrivateLink = useCallback(async () => {
    setError(null);
    setLinkCopied(false);
    setCreating("link");
    try {
      const res = await createRoom(
        { title: "Private Prayer Room", groupId: groupId ?? undefined },
        roomOptions
      );
      if (res.ok === false) {
        setError(res.error);
        return;
      }
      const url =
        typeof window !== "undefined" && !res.inviteLink.startsWith("http")
          ? `${window.location.origin}${res.inviteLink}`
          : res.inviteLink;
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create link");
    } finally {
      setCreating(null);
    }
  }, [groupId, roomOptions]);

  const base = groupSlug ? `${prayerBase}/${groupSlug}` : prayerBase;
  const isCreating = creating !== null;

  return (
    <div className="prayer-live-section" style={{ marginTop: "1rem" }}>
      <h2 className="prayer-section-title">Live Prayer Rooms</h2>
      <p className="prayer-section-description" style={{ marginBottom: "1rem" }}>
        Join or host live audio prayer rooms. Invite others by link; multiple participants can pray together.
      </p>

      {/* Zoom-style action panel: Start or Share Prayer */}
      <section
        className="prayer-live-action-panel"
        style={{
          marginBottom: "1.5rem",
          padding: "1.25rem",
          borderRadius: 16,
          border: "1px solid var(--prayer-card-border, rgba(148,163,184,0.08))",
          background: "var(--prayer-card-bg, rgba(24,22,36,0.72))",
        }}
      >
        <h3 className="prayer-section-title" style={{ fontSize: "1rem", marginBottom: "1rem", marginTop: 0 }}>
          Start or Share Prayer
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "0.75rem",
          }}
        >
          <button
            type="button"
            disabled={isCreating}
            onClick={handleStartLiveRoom}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: 12,
              border: "1px solid var(--prayer-card-border)",
              background: "var(--prayer-play-bg)",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: isCreating ? "not-allowed" : "pointer",
            }}
          >
            {creating === "room" ? "Creating…" : "Start Live Room"}
          </button>
          <button
            type="button"
            disabled={isCreating}
            onClick={handleStart1on1}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: 12,
              border: "1px solid var(--prayer-card-border)",
              background: "var(--prayer-play-bg)",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: isCreating ? "not-allowed" : "pointer",
            }}
          >
            {creating === "1on1" ? "Creating…" : "Start 1-on-1 Prayer"}
          </button>
          <button
            type="button"
            disabled={isCreating}
            onClick={handleShareMessage}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: 12,
              border: "1px solid var(--prayer-card-border)",
              background: "transparent",
              color: "var(--prayer-text)",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: isCreating ? "not-allowed" : "pointer",
            }}
          >
            Share Message / Testimony
          </button>
          <button
            type="button"
            disabled={isCreating}
            onClick={handleCreatePrivateLink}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: 12,
              border: "1px solid var(--prayer-card-border)",
              background: "transparent",
              color: "var(--prayer-text)",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: isCreating ? "not-allowed" : "pointer",
            }}
          >
            {linkCopied ? "Link copied" : creating === "link" ? "Creating…" : "Create Private Link"}
          </button>
        </div>
        {error && (
          <p style={{ marginTop: "0.75rem", marginBottom: 0, fontSize: "0.8125rem", color: "#f87171" }}>
            {error}
          </p>
        )}
      </section>

      {loading ? (
        <p className="prayer-section-muted">Loading rooms…</p>
      ) : !Array.isArray(rooms) || rooms.length === 0 ? (
        <>
          <p className="prayer-section-muted" style={{ marginBottom: "1rem" }}>No live rooms right now. Start one below.</p>
          <LivePrayerCta prayerBase={prayerBase} groupId={groupId ?? null} isAdmin={isAdmin} />
        </>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {(rooms ?? []).map((r) => (
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
                href={`${prayerBase}/room/${r.roomId}`}
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
        <LivePrayerCta prayerBase={prayerBase} groupId={groupId ?? null} isAdmin={isAdmin} />
      </div>

      <div style={{ marginTop: "1rem" }}>
        <Link href={base} className="prayer-share-link">
          ← Back to Prayer
        </Link>
      </div>
    </div>
  );
}
