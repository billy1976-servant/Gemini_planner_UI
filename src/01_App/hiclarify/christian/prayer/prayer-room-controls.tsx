"use client";

import React from "react";
import type { RoomParticipant, RoomRole } from "./PrayerRoomTypes";

export interface PrayerRoomControlsProps {
  role: RoomRole;
  isHost: boolean;
  participantId: string;
  hostId: string;
  roomId: string;
  participants: RoomParticipant[];
  myMuted: boolean;
  onMuteSelf: (muted: boolean) => void;
  onMuteParticipant?: (participantId: string, muted: boolean) => void;
  onEndRoom?: () => void;
  /** When set, host sees "Moderator" button to open panel; mute list and end room live in panel. */
  onOpenModeratorPanel?: () => void;
}

export function PrayerRoomControls({
  role,
  isHost,
  participantId,
  hostId,
  roomId,
  participants,
  myMuted,
  onMuteSelf,
  onMuteParticipant,
  onEndRoom,
  onOpenModeratorPanel,
}: PrayerRoomControlsProps) {
  const speakersAndListeners = participants.filter((p) => p.role !== "host" && p.participantId !== participantId);
  const showHostControlsInline = isHost && !onOpenModeratorPanel;

  return (
    <div className="prayer-room-controls" style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Audio: always show a clear section so mic/listen mode is visible */}
      <div>
        <div className="prayer-metrics-label" style={{ marginBottom: "0.35rem" }}>
          Audio
        </div>
        {(role === "host" || role === "speaker") ? (
          <button
            type="button"
            className="prayer-room-mute-self"
            onClick={() => onMuteSelf(!myMuted)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: 12,
              border: "1px solid var(--prayer-card-border)",
              background: myMuted ? "var(--prayer-play-bg)" : "transparent",
              color: "var(--prayer-text)",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            {myMuted ? "Unmute microphone" : "Mute microphone"}
          </button>
        ) : (
          <p className="prayer-subtitle" style={{ fontSize: "0.875rem", color: "var(--prayer-text-muted)", margin: 0 }}>
            Listen-only — you’ll hear speakers when they join.
          </p>
        )}
      </div>

      {isHost && onOpenModeratorPanel && (
        <button
          type="button"
          className="prayer-room-moderator-btn"
          onClick={onOpenModeratorPanel}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 12,
            border: "1px solid var(--prayer-card-border)",
            background: "var(--prayer-play-bg)",
            color: "#fff",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Host controls
        </button>
      )}

      {showHostControlsInline && speakersAndListeners.length > 0 && (
        <div className="prayer-room-host-controls">
          <div className="prayer-metrics-label" style={{ marginBottom: "0.35rem" }}>
            Mute participants
          </div>
          {speakersAndListeners.map((p) => (
            <div
              key={p.participantId}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.25rem 0",
              }}
            >
              <span className="prayer-subtitle" style={{ fontSize: "0.8rem" }}>
                {p.displayName || p.participantId.slice(0, 8)} ({p.role})
              </span>
              <button
                type="button"
                onClick={() => onMuteParticipant?.(p.participantId, !p.muted)}
                style={{
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.75rem",
                  borderRadius: 8,
                  border: "1px solid var(--prayer-card-border)",
                  background: p.muted ? "var(--prayer-play-bg)" : "transparent",
                  color: "var(--prayer-text)",
                  cursor: "pointer",
                }}
              >
                {p.muted ? "Unmute" : "Mute"}
              </button>
            </div>
          ))}
        </div>
      )}

      {showHostControlsInline && onEndRoom && (
        <button
          type="button"
          className="prayer-room-end"
          onClick={onEndRoom}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 12,
            border: "1px solid rgba(239,68,68,0.5)",
            background: "transparent",
            color: "#f87171",
            cursor: "pointer",
            fontSize: "0.875rem",
            marginTop: "0.5rem",
          }}
        >
          End prayer room
        </button>
      )}
    </div>
  );
}
