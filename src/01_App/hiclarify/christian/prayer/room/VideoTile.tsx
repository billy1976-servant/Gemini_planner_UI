"use client";

import React, { useEffect, useRef } from "react";
import type { RoomParticipant } from "../PrayerRoomTypes";

function initials(displayName?: string, participantId?: string): string {
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
    return displayName.slice(0, 2).toUpperCase();
  }
  return participantId ? participantId.slice(0, 2).toUpperCase() : "?";
}

export interface VideoTileProps {
  participant: RoomParticipant;
  /** Video stream for this participant (local or remote). */
  stream: MediaStream | null;
  /** Whether this tile is the current user. */
  isLocal: boolean;
  /** Whether this participant is the host. */
  isHost: boolean;
}

export function VideoTile({ participant, stream, isLocal, isHost }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (stream && stream.getVideoTracks().length > 0) {
      el.srcObject = stream;
      el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [stream]);

  const hasVideo = stream != null && stream.getVideoTracks().length > 0;
  const label = participant.displayName || `Participant ${participant.participantId.slice(0, 8)}`;
  const badges: string[] = [];
  if (isHost) badges.push("Host");
  if (isLocal) badges.push("You");

  return (
    <div
      className="prayer-video-tile"
      style={{
        position: "relative",
        aspectRatio: "16/10",
        borderRadius: 12,
        overflow: "hidden",
        background: "var(--prayer-card-bg, #1e293b)",
        border: "1px solid var(--prayer-card-border, rgba(148,163,184,0.2))",
      }}
    >
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--prayer-accent, #a78bfa)",
            color: "#fff",
            fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
            fontWeight: 600,
          }}
        >
          {initials(participant.displayName, participant.participantId)}
        </div>
      )}
      {/* Overlay: label + mute/video indicators */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "0.35rem 0.5rem",
          background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
          color: "#fff",
          fontSize: "0.75rem",
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
        {badges.length > 0 && (
          <span style={{ opacity: 0.9 }}>{badges.join(" · ")}</span>
        )}
        {participant.muted && (
          <span title="Muted" aria-label="Muted" style={{ opacity: 0.9 }}>
            Muted
          </span>
        )}
        {!hasVideo && (
          <span title="Video off" aria-label="Video off" style={{ opacity: 0.9 }}>
            Video off
          </span>
        )}
      </div>
    </div>
  );
}
