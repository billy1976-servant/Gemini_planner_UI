"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createRoom } from "./room/prayer-room-api";
import { useActiveRooms } from "./room/ActiveRoomsContext";
import { getPrayerAnonId } from "./prayerAnonId";

const ROOM_STORAGE_KEY = "prayer-room";

function setStored(
  roomId: string,
  data: { participantId: string; role: "host" | "speaker" | "listener"; hostId?: string }
): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${ROOM_STORAGE_KEY}-${roomId}`, JSON.stringify(data));
}

export interface LivePrayerCtaProps {
  prayerBase?: string;
  groupId?: string | null;
  isAdmin?: boolean;
}

export function LivePrayerCta({ prayerBase = "/prayer", groupId, isAdmin }: LivePrayerCtaProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { rooms: activeRooms } = useActiveRooms();
  const [starting, setStarting] = useState(false);

  const handleStartRoom = async () => {
    const uid = (session?.user as { id?: string } | undefined)?.id ?? getPrayerAnonId();
    setStarting(true);
    try {
      const res = await createRoom(
        {
          title: "Prayer Room",
          groupId: groupId ?? undefined,
        },
        session?.user ? undefined : { anonId: uid }
      );
      if (!res.ok) {
        setStarting(false);
        return;
      }
      const hostId = res.room.hostId;
      setStored(res.roomId, {
        participantId: hostId,
        role: "host",
        hostId,
      });
      router.push(`${prayerBase}/room/${res.roomId}`);
    } catch {
      setStarting(false);
    }
  };

  const firstRoom = activeRooms[0];
  const totalParticipants = activeRooms.reduce((s, r) => s + r.participantCount, 0);

  return (
    <div
      className="prayer-room-cta"
      style={{
        marginTop: "1rem",
        padding: "1rem",
        borderRadius: 12,
        border: "1px solid var(--prayer-card-border, rgba(148,163,184,0.08))",
        background: "rgba(24,22,36,0.4)",
      }}
    >
      <div className="prayer-metrics-label" style={{ marginBottom: "0.5rem" }}>
        LIVE PRAYER
      </div>
      {activeRooms.length > 0 ? (
        <p className="prayer-subtitle" style={{ marginBottom: "0.75rem", fontSize: "0.875rem" }}>
          {totalParticipants} people praying
        </p>
      ) : (
        <p className="prayer-subtitle" style={{ marginBottom: "0.75rem", fontSize: "0.875rem" }}>
          No live room right now
        </p>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {firstRoom && (
          <Link
            href={`${prayerBase}/room/${firstRoom.roomId}`}
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
            Join Room
          </Link>
        )}
        {(isAdmin ?? true) && (
          <button
            type="button"
            onClick={handleStartRoom}
            disabled={starting}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: 12,
              border: "1px solid var(--prayer-card-border)",
              background: "transparent",
              color: "var(--prayer-text)",
              cursor: starting ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
            }}
          >
            {starting ? "StartingΓÇª" : "Start Prayer Room"}
          </button>
        )}
      </div>
    </div>
  );
}
