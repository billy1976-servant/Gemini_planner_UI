"use client";

import React from "react";
import type { RoomParticipant } from "./PrayerRoomTypes";

export interface PrayerRoomParticipantsProps {
  participants: RoomParticipant[];
  currentParticipantId: string | null;
}

function initials(displayName?: string, participantId?: string): string {
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return displayName.slice(0, 2).toUpperCase();
  }
  return participantId ? participantId.slice(0, 2).toUpperCase() : "?";
}

export function PrayerRoomParticipants({
  participants,
  currentParticipantId,
}: PrayerRoomParticipantsProps) {
  return (
    <div className="prayer-room-participants">
      <div className="prayer-metrics-label" style={{ marginBottom: "0.5rem" }}>
        Participants ({participants.length})
      </div>
      <ul className="prayer-room-participants-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {participants.map((p) => (
          <li
            key={p.participantId}
            className="prayer-room-participant"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.35rem 0",
              borderBottom: "1px solid var(--prayer-card-border, rgba(148,163,184,0.08))",
            }}
          >
            <span
              className="prayer-room-participant-avatar"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--prayer-accent, #a78bfa)",
                color: "#fff",
                fontSize: "0.7rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {initials(p.displayName, p.participantId)}
            </span>
            <span className="prayer-subtitle" style={{ flex: 1, fontSize: "0.875rem" }}>
              {p.displayName || `Participant ${p.participantId.slice(0, 8)}`}
              {p.participantId === currentParticipantId && " (you)"}
            </span>
            <span
              className="prayer-room-role"
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                color: "var(--prayer-text-subtle, #64748b)",
              }}
            >
              {p.role}
            </span>
            {p.muted && (
              <span
                style={{ fontSize: "0.7rem", color: "var(--prayer-text-muted)" }}
                aria-label="Muted"
              >
                Muted
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
