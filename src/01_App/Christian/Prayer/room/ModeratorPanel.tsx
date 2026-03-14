"use client";

import React, { useState } from "react";
import type { RoomParticipant } from "../PrayerRoomTypes";
import type { RecordingStatus } from "./useRoomRecording";
import { StudyPagesManager, type StudyPage } from "./StudyPagesManager";

export interface ModeratorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  roomTitle?: string;
  recordingStatus: RecordingStatus;
  recordedBlob: Blob | null;
  recordDurationSec: number;
  participants: RoomParticipant[];
  currentParticipantId: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPublishRecording: (title: string) => void;
  onMuteParticipant: (participantId: string, muted: boolean) => void;
  onEndRoom: () => void;
  isPublishing?: boolean;
  publishError?: string | null;
  /** LiveKit screen share controls (host only). */
  canScreenShare?: boolean;
  isScreenSharing?: boolean;
  onStartScreenShare?: () => void;
  onStopScreenShare?: () => void;
  studyPages?: StudyPage[];
  onSaveStudyPage?: (title: string) => void;
  /** When false, recording button is disabled and reason shown (e.g. waiting for connection). */
  recordingReady?: boolean;
  /** When false, screen share button is disabled and reason shown. */
  screenShareReady?: boolean;
  /** Shown when controls are disabled (e.g. "Connecting to room…"). */
  connectionStatus?: string | null;
}

export function ModeratorPanel({
  isOpen,
  onClose,
  roomTitle,
  recordingStatus,
  recordedBlob,
  recordDurationSec,
  participants,
  currentParticipantId,
  onStartRecording,
  onStopRecording,
  onPublishRecording,
  onMuteParticipant,
  onEndRoom,
  isPublishing = false,
  publishError = null,
  canScreenShare = false,
  isScreenSharing = false,
  onStartScreenShare,
  onStopScreenShare,
  studyPages = [],
  onSaveStudyPage,
  recordingReady = true,
  screenShareReady = true,
  connectionStatus = null,
}: ModeratorPanelProps) {
  const [publishTitle, setPublishTitle] = useState(roomTitle ?? "Live room recording");

  if (!isOpen) return null;

  const speakersAndListeners = participants.filter(
    (p) => p.role !== "host" && p.participantId !== currentParticipantId
  );

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <>
      <div
        role="presentation"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          zIndex: 100,
        }}
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />
      <aside
        className="prayer-moderator-panel"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "min(360px, 100vw)",
          height: "100vh",
          background: "var(--prayer-card-bg, #1e293b)",
          borderLeft: "1px solid var(--prayer-card-border, #334155)",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.2)",
          zIndex: 101,
          overflowY: "auto",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="prayer-title" style={{ margin: 0, fontSize: "1.1rem" }}>
            Host controls
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            style={{
              padding: "0.35rem 0.5rem",
              border: "1px solid var(--prayer-card-border)",
              borderRadius: 8,
              background: "transparent",
              color: "var(--prayer-text)",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Close
          </button>
        </div>

        {/* Recording */}
        <section>
          <div className="prayer-metrics-label" style={{ marginBottom: "0.5rem" }}>
            Recording
          </div>
          {connectionStatus && (
            <p style={{ fontSize: "0.8125rem", color: "var(--prayer-text-muted)", margin: "0 0 0.5rem 0" }}>
              {connectionStatus}
            </p>
          )}
          {recordingStatus === "idle" && (
            <>
              <button
                type="button"
                onClick={onStartRecording}
                disabled={!recordingReady}
                title={!recordingReady ? "Connect your microphone first (join the room with audio)" : undefined}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 12,
                  border: "1px solid var(--prayer-card-border)",
                  background: recordingReady ? "var(--prayer-play-bg)" : "var(--prayer-card-border)",
                  color: "#fff",
                  cursor: recordingReady ? "pointer" : "not-allowed",
                  fontSize: "0.875rem",
                  opacity: recordingReady ? 1 : 0.8,
                }}
              >
                Start recording
              </button>
              {!recordingReady && (
                <p style={{ fontSize: "0.75rem", color: "var(--prayer-text-muted)", margin: "0.35rem 0 0 0" }}>
                  Use your mic in this room to enable recording.
                </p>
              )}
            </>
          )}
          {recordingStatus === "recording" && (
            <>
              <div style={{ fontSize: "0.875rem", color: "var(--prayer-text-muted)", marginBottom: "0.5rem" }}>
                Recording… {formatDuration(recordDurationSec)}
              </div>
              <button
                type="button"
                onClick={onStopRecording}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 12,
                  border: "1px solid rgba(239,68,68,0.5)",
                  background: "transparent",
                  color: "#f87171",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                Stop recording
              </button>
            </>
          )}
          {recordingStatus === "stopped" && recordedBlob && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ fontSize: "0.875rem", color: "var(--prayer-text-muted)" }}>
                Recorded {formatDuration(recordDurationSec)}
              </div>
              <input
                type="text"
                value={publishTitle}
                onChange={(e) => setPublishTitle(e.target.value)}
                placeholder="Recording title"
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: 8,
                  border: "1px solid var(--prayer-card-border)",
                  background: "var(--prayer-bg)",
                  color: "var(--prayer-text)",
                  fontSize: "0.875rem",
                }}
              />
              <button
                type="button"
                onClick={() => onPublishRecording(publishTitle.trim() || roomTitle || "Live room recording")}
                disabled={isPublishing}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 12,
                  border: "1px solid var(--prayer-card-border)",
                  background: "var(--prayer-play-bg)",
                  color: "#fff",
                  cursor: isPublishing ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                }}
              >
                {isPublishing ? "Publishing…" : "Publish as prayer"}
              </button>
              {publishError && (
                <p style={{ fontSize: "0.8rem", color: "#f87171", margin: 0 }}>{publishError}</p>
              )}
            </div>
          )}
        </section>

        {/* Screen sharing */}
        {canScreenShare && (
          <section>
            <div className="prayer-metrics-label" style={{ marginBottom: "0.5rem" }}>
              Screen share
            </div>
            {!isScreenSharing && onStartScreenShare && (
              <>
                <button
                  type="button"
                  onClick={onStartScreenShare}
                  disabled={!screenShareReady}
                  title={!screenShareReady ? "Connect to the room first" : undefined}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: 12,
                    border: "1px solid var(--prayer-card-border)",
                    background: "transparent",
                    color: "var(--prayer-text)",
                    cursor: screenShareReady ? "pointer" : "not-allowed",
                    fontSize: "0.875rem",
                    opacity: screenShareReady ? 1 : 0.7,
                  }}
                >
                  Start screen share
                </button>
                {!screenShareReady && (
                  <p style={{ fontSize: "0.75rem", color: "var(--prayer-text-muted)", margin: "0.35rem 0 0 0" }}>
                    Connect to the room to share your screen.
                  </p>
                )}
              </>
            )}
            {isScreenSharing && onStopScreenShare && (
              <button
                type="button"
                onClick={onStopScreenShare}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 12,
                  border: "1px solid rgba(239,68,68,0.5)",
                  background: "transparent",
                  color: "#f87171",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                Stop screen share
              </button>
            )}
          </section>
        )}

        {/* Study pages */}
        {onSaveStudyPage && (
          <StudyPagesManager pages={studyPages} onSavePage={onSaveStudyPage} />
        )}

        {/* Participants */}
        {speakersAndListeners.length > 0 && (
          <section>
            <div className="prayer-metrics-label" style={{ marginBottom: "0.5rem" }}>
              Mute participants
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
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
                    onClick={() => onMuteParticipant(p.participantId, !p.muted)}
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
          </section>
        )}

        {/* End room */}
        <section style={{ marginTop: "auto", paddingTop: "1rem" }}>
          <button
            type="button"
            onClick={onEndRoom}
            style={{
              width: "100%",
              padding: "0.5rem 1rem",
              borderRadius: 12,
              border: "1px solid rgba(239,68,68,0.5)",
              background: "transparent",
              color: "#f87171",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            End prayer room
          </button>
        </section>
      </aside>
    </>
  );
}
