"use client";

import React from "react";
import type { RoomParticipant } from "../PrayerRoomTypes";
import { VideoTile } from "./VideoTile";

export interface ParticipantVideoGridProps {
  participants: RoomParticipant[];
  currentParticipantId: string | null;
  hostId: string | null;
  /** Local user's video track (when enabled). */
  localVideoTrack: MediaStreamTrack | null;
  /** Whether local camera is currently published. */
  videoEnabled: boolean;
  /** Per-participant video streams (identity -> stream). */
  participantVideoTracks: Map<string, MediaStream>;
}

export function ParticipantVideoGrid({
  participants,
  currentParticipantId,
  hostId,
  localVideoTrack,
  videoEnabled,
  participantVideoTracks,
}: ParticipantVideoGridProps) {
  const ordered = [...participants].sort((a, b) => {
    if (a.participantId === hostId) return -1;
    if (b.participantId === hostId) return 1;
    if (a.participantId === currentParticipantId) return -1;
    if (b.participantId === currentParticipantId) return 1;
    return 0;
  });

  const getStreamFor = (p: RoomParticipant): MediaStream | null => {
    if (p.participantId === currentParticipantId && videoEnabled && localVideoTrack) {
      return new MediaStream([localVideoTrack]);
    }
    return participantVideoTracks.get(p.participantId) ?? null;
  };

  if (ordered.length === 0) return null;

  return (
    <div
      className="prayer-participant-video-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(180px, 100%), 1fr))",
        gap: "0.75rem",
        marginTop: "1rem",
      }}
    >
      {ordered.map((p) => (
        <VideoTile
          key={p.participantId}
          participant={p}
          stream={getStreamFor(p)}
          isLocal={p.participantId === currentParticipantId}
          isHost={p.participantId === hostId}
        />
      ))}
    </div>
  );
}
