"use client";

import React, { useState } from "react";
import { useSyncExternalStore } from "react";
import { subscribeState, getState } from "@/state/state-store";
import { getSlice, writeSlice } from "./prayer-room-session.state";
import { usePrayerRoomContext } from "./PrayerRoomContext";
import { StudyPagesManager, type StudyPage } from "./StudyPagesManager";
import type { StudyDeck } from "../study/StudySlide";
import { StudyDeckManager } from "../study/StudyDeckManager";
import { SessionReplayViewer } from "./SessionReplayViewer";
import { formatDuration } from "../utils/formatTime";

export interface ModeratorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  roomTitle?: string;
}

export function ModeratorPanel({ isOpen, onClose, roomTitle }: ModeratorPanelProps) {
  useSyncExternalStore(subscribeState, getState, getState);
  const ctx = usePrayerRoomContext();
  const {
    roomId,
    recording,
    webrtc,
    exportReplay,
    onEndRoom,
    onSaveStudyPage,
    onAnnotateScreen,
    onCopyInviteLink,
    hasAnnotatableContent,
    isPublishing,
    publishError,
  } = ctx;

  const sessionSlice = getSlice(roomId);
  const { studyPages, annotationVisible, activeDeck, currentSlideIndex } = sessionSlice;

  const [publishTitle, setPublishTitle] = useState(roomTitle ?? "Live room recording");
  const [showDeckManager, setShowDeckManager] = useState(false);

  if (!isOpen) return null;

  const slideCount = activeDeck?.slides.length ?? 0;

  const speakersAndListeners = webrtc.participants.filter(
    (p) => p.role !== "host" && p.participantId !== ctx.participantId
  );

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
          zIndex: 102,
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

        {/* MEDIA: Camera, Mic */}
        <section>
          <div className="prayer-metrics-label" style={{ marginBottom: "0.5rem" }}>
            Media
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {webrtc.setVideoEnabled && (
              <button
                type="button"
                onClick={() => webrtc.setVideoEnabled(!webrtc.videoEnabled)}
                disabled={!webrtc.cameraAvailable}
                title={!webrtc.cameraAvailable ? "Camera unavailable" : webrtc.videoEnabled ? "Turn off camera" : "Turn on camera"}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 12,
                  border: "1px solid var(--prayer-card-border)",
                  background: webrtc.videoEnabled ? "var(--prayer-play-bg)" : "transparent",
                  color: "var(--prayer-text)",
                  cursor: webrtc.cameraAvailable ? "pointer" : "not-allowed",
                  fontSize: "0.875rem",
                  opacity: webrtc.cameraAvailable ? 1 : 0.7,
                }}
              >
                {webrtc.videoEnabled ? "Camera on" : "Camera off"}
              </button>
            )}
            {webrtc.onMuteSelf && (
              <button
                type="button"
                onClick={() => webrtc.onMuteSelf(!webrtc.myMuted)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 12,
                  border: "1px solid var(--prayer-card-border)",
                  background: webrtc.myMuted ? "var(--prayer-play-bg)" : "transparent",
                  color: "var(--prayer-text)",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                {webrtc.myMuted ? "Unmute mic" : "Mute mic"}
              </button>
            )}
          </div>
        </section>

        {/* Recording */}
        <section>
          <div className="prayer-metrics-label" style={{ marginBottom: "0.5rem" }}>
            Recording
          </div>
          {webrtc.connectionStatus && (
            <p style={{ fontSize: "0.8125rem", color: "var(--prayer-text-muted)", margin: "0 0 0.5rem 0" }}>
              {webrtc.connectionStatus}
            </p>
          )}
          {recording.recordingStatus === "idle" && (
            <>
              <button
                type="button"
                onClick={recording.onStartRecording}
                disabled={!webrtc.recordingReady}
                title={!webrtc.recordingReady ? "Connect your microphone first (join the room with audio)" : undefined}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 12,
                  border: "1px solid var(--prayer-card-border)",
                  background: webrtc.recordingReady ? "var(--prayer-play-bg)" : "var(--prayer-card-border)",
                  color: "#fff",
                  cursor: webrtc.recordingReady ? "pointer" : "not-allowed",
                  fontSize: "0.875rem",
                  opacity: webrtc.recordingReady ? 1 : 0.8,
                }}
              >
                Start recording
              </button>
              {!webrtc.recordingReady && (
                <p style={{ fontSize: "0.75rem", color: "var(--prayer-text-muted)", margin: "0.35rem 0 0 0" }}>
                  Use your mic in this room to enable recording.
                </p>
              )}
            </>
          )}
          {recording.recordingStatus === "recording" && (
            <>
              <div style={{ fontSize: "0.875rem", color: "var(--prayer-text-muted)", marginBottom: "0.5rem" }}>
                Recording… {formatDuration(recording.recordDurationSec)}
              </div>
              <button
                type="button"
                onClick={recording.onStopRecording}
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
          {recording.recordingStatus === "stopped" && recording.recordedBlob && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ fontSize: "0.875rem", color: "var(--prayer-text-muted)" }}>
                Recorded {formatDuration(recording.recordDurationSec)}
              </div>
              {exportReplay.onExportSession && exportReplay.canExportSession && (
                <button
                  type="button"
                  onClick={exportReplay.onExportSession}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: 12,
                    border: "1px solid var(--prayer-card-border)",
                    background: "transparent",
                    color: "var(--prayer-text)",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Export session (recording + JSON)
                </button>
              )}
              {exportReplay.canExportSession && recording.recordedBlob && (
                <SessionReplayViewer
                  recordedBlob={recording.recordedBlob}
                  sessionTimeline={exportReplay.sessionTimeline}
                  annotationTimeline={exportReplay.annotationTimeline}
                  deck={activeDeck}
                  sessionStudyPages={studyPages}
                  accentColor="var(--prayer-play-bg)"
                />
              )}
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
                onClick={() => recording.onPublishRecording(publishTitle.trim() || roomTitle || "Live room recording")}
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
        {(
          <section>
            <div className="prayer-metrics-label" style={{ marginBottom: "0.5rem" }}>
              Screen share
            </div>
            {!webrtc.isScreenSharing && webrtc.onStartScreenShare && (
              <>
                <button
                  type="button"
                  onClick={webrtc.onStartScreenShare}
                  disabled={!webrtc.screenShareReady}
                  title={!webrtc.screenShareReady ? "Connect to the room first" : undefined}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: 12,
                    border: "1px solid var(--prayer-card-border)",
                    background: "transparent",
                    color: "var(--prayer-text)",
                    cursor: webrtc.screenShareReady ? "pointer" : "not-allowed",
                    fontSize: "0.875rem",
                    opacity: webrtc.screenShareReady ? 1 : 0.7,
                  }}
                >
                  Start screen share
                </button>
                {!webrtc.screenShareReady && (
                  <p style={{ fontSize: "0.75rem", color: "var(--prayer-text-muted)", margin: "0.35rem 0 0 0" }}>
                    Connect to the room to share your screen.
                  </p>
                )}
              </>
            )}
            {webrtc.isScreenSharing && webrtc.onStopScreenShare && (
              <button
                type="button"
                onClick={webrtc.onStopScreenShare}
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

        {/* ROOM: Copy invite, Mute all */}
        {(onCopyInviteLink || webrtc.onMuteAll) && (
          <section>
            <div className="prayer-metrics-label" style={{ marginBottom: "0.5rem" }}>
              Room
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {onCopyInviteLink && (
                <button
                  type="button"
                  onClick={onCopyInviteLink}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: 12,
                    border: "1px solid var(--prayer-card-border)",
                    background: "transparent",
                    color: "var(--prayer-text)",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Copy invite link
                </button>
              )}
              {webrtc.onMuteAll && speakersAndListeners.length > 0 && (
                <button
                  type="button"
                  onClick={webrtc.onMuteAll}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: 12,
                    border: "1px solid var(--prayer-card-border)",
                    background: "transparent",
                    color: "var(--prayer-text)",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Mute all participants
                </button>
              )}
            </div>
          </section>
        )}

        {/* Study pages */}
        {onSaveStudyPage && (
          <StudyPagesManager pages={studyPages} onSavePage={onSaveStudyPage} />
        )}

        {/* STUDY SLIDES */}
        <section>
          <div className="prayer-metrics-label" style={{ marginBottom: "0.5rem" }}>
            Study slides
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <button
              type="button"
              onClick={() => setShowDeckManager((v) => !v)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 12,
                border: "1px solid var(--prayer-card-border)",
                background: showDeckManager ? "var(--prayer-play-bg)" : "transparent",
                color: "var(--prayer-text)",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              {showDeckManager ? "Close deck manager" : "Open deck"}
            </button>
            {showDeckManager && (
              <StudyDeckManager
                onSelectDeck={(deck) => writeSlice(roomId, { activeDeck: deck })}
                selectedDeckId={activeDeck?.id ?? null}
              />
            )}
            {activeDeck && slideCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => writeSlice(roomId, { currentSlideIndex: Math.max(0, currentSlideIndex - 1) })}
                  disabled={currentSlideIndex <= 0}
                  style={{
                    padding: "0.35rem 0.6rem",
                    borderRadius: 8,
                    border: "1px solid var(--prayer-card-border)",
                    background: "transparent",
                    color: "var(--prayer-text)",
                    cursor: currentSlideIndex <= 0 ? "not-allowed" : "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Previous
                </button>
                <span style={{ fontSize: "0.8125rem", color: "var(--prayer-text-muted)" }}>
                  Slide {currentSlideIndex + 1} / {slideCount}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    writeSlice(roomId, {
                      currentSlideIndex: Math.min(currentSlideIndex + 1, slideCount - 1),
                    })
                  }
                  disabled={currentSlideIndex >= slideCount - 1}
                  style={{
                    padding: "0.35rem 0.6rem",
                    borderRadius: 8,
                    border: "1px solid var(--prayer-card-border)",
                    background: "transparent",
                    color: "var(--prayer-text)",
                    cursor: currentSlideIndex >= slideCount - 1 ? "not-allowed" : "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Next
                </button>
                {slideCount > 1 && (
                  <select
                    value={currentSlideIndex}
                    onChange={(e) => writeSlice(roomId, { currentSlideIndex: Number(e.target.value) })}
                    style={{
                      padding: "0.25rem 0.5rem",
                      borderRadius: 8,
                      border: "1px solid var(--prayer-card-border)",
                      background: "var(--prayer-bg)",
                      color: "var(--prayer-text)",
                      fontSize: "0.8rem",
                    }}
                  >
                    {activeDeck.slides.map((_, i) => (
                      <option key={i} value={i}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Annotation tools */}
        <section>
          <div className="prayer-metrics-label" style={{ marginBottom: "0.5rem" }}>
            Annotation
          </div>
          {!hasAnnotatableContent && (
            <p style={{ fontSize: "0.8125rem", color: "var(--prayer-text-muted)", margin: "0 0 0.5rem 0" }}>
              Upload a slide, take a snapshot, or annotate the screen.
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {onAnnotateScreen && (
              <button
                type="button"
                onClick={onAnnotateScreen}
                title="Capture current room view as a slide and show annotation canvas"
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
                Annotate screen
              </button>
            )}
            {hasAnnotatableContent && (
              <button
                type="button"
                onClick={() => writeSlice(roomId, { annotationVisible: !annotationVisible })}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 12,
                  border: "1px solid var(--prayer-card-border)",
                  background: annotationVisible ? "var(--prayer-play-bg)" : "transparent",
                  color: "var(--prayer-text)",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                {annotationVisible ? "Hide annotations" : "Show annotations"}
              </button>
            )}
            {hasAnnotatableContent && (
              <button
                type="button"
                onClick={() => writeSlice(roomId, { annotationStrokes: [] })}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 12,
                  border: "1px solid var(--prayer-card-border)",
                  background: "transparent",
                  color: "var(--prayer-text)",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                Clear annotations
              </button>
            )}
          </div>
        </section>

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
                    onClick={() => webrtc.onMuteParticipant(p.participantId, !p.muted)}
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
