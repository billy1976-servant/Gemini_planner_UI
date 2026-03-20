"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ModeratorPanel } from "./ModeratorPanel";
import { ScreenShareView } from "./ScreenShareView";
import { AnnotationOverlay } from "./AnnotationOverlay";
import { PrayerRoomParticipants } from "../prayer-room-participants";
import { PrayerRoomControls } from "../prayer-room-controls";
import { ParticipantVideoGrid } from "./ParticipantVideoGrid";
import { SlideViewer } from "./SlideViewer";
import { SessionSlidesView } from "./SessionSlidesView";
import { VideoContentView } from "./VideoContentView";
import { PrayerRoomProvider } from "./PrayerRoomContext";
import { usePrayerRoomEngine } from "./PrayerRoomEngine";
import { formatDuration } from "../utils/formatTime";

export interface PrayerRoomProps {
  roomId: string;
  /** Base path for prayer app (domain-agnostic: "/prayer") for back links. */
  prayerBase?: string;
}

function ListenerAudio({ stream }: { stream: MediaStream | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const el = audioRef.current;
    if (el) {
      el.srcObject = stream;
    }
    return () => {
      if (el) el.srcObject = null;
    };
  }, [stream]);
  return (
    <audio
      ref={audioRef}
      autoPlay
      playsInline
      style={{ width: "100%", marginBottom: "1rem" }}
    />
  );
}

export function PrayerRoom({ roomId, prayerBase = "/prayer" }: PrayerRoomProps) {
  const engine = usePrayerRoomEngine(roomId, prayerBase);
  const {
    room,
    participantId,
    role,
    hostId,
    joining,
    joinChoice,
    error,
    sessionSlice,
    handleJoin,
    webrtc,
    recording,
    moderatorPanelOpen,
    setModeratorPanelOpen,
    handleAnnotationChange,
    contentWrapperRef,
    roomContextValue,
    hasVisibleContent,
    hasAnnotatableContent,
    hasParticipantVideo,
    firstRemoteStream,
    palette,
    prayerBase: basePath,
    isHost,
    activeDeck,
    studyPages,
    annotationVisible,
  } = engine;

  if (!room && !joinChoice && !participantId) {
    return (
      <div className="prayer-platform" style={{ padding: "2rem 1rem 4rem" }}>
        <section className="prayer-hero-card">
          <div className="prayer-brand">Live Prayer Room</div>
          <p className="prayer-subtitle">Loading room…</p>
          <div style={{ marginTop: "1rem" }}>
            <Link href={basePath} className="prayer-share-link">
              ← Back to prayer
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (!participantId || !role) {
    return (
      <div className="prayer-platform" style={{ padding: "2rem 1rem 4rem" }}>
        <section className="prayer-hero-card">
          <div className="prayer-brand">Live Prayer Room</div>
          <h1 className="prayer-title">{room?.title || "Prayer Room"}</h1>
          <p className="prayer-subtitle">
            {room ? `${room.participants.length} participant${room.participants.length !== 1 ? "s" : ""}` : "Join to listen or speak."}
          </p>
          {error && (
            <p style={{ color: "#f87171", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
            <button
              type="button"
              className="prayer-room-join-btn"
              disabled={joining || room?.status !== "active"}
              onClick={() => handleJoin("speaker")}
              style={{
                padding: "0.75rem 1.25rem",
                borderRadius: 12,
                border: "1px solid var(--prayer-card-border)",
                background: "var(--prayer-play-bg)",
                color: "#fff",
                cursor: joining ? "not-allowed" : "pointer",
                fontSize: "0.9375rem",
              }}
            >
              {joining ? "Joining…" : "Join as speaker"}
            </button>
            <button
              type="button"
              className="prayer-room-join-btn"
              disabled={joining || room?.status !== "active"}
              onClick={() => handleJoin("listener")}
              style={{
                padding: "0.75rem 1.25rem",
                borderRadius: 12,
                border: "1px solid var(--prayer-card-border)",
                background: "transparent",
                color: "var(--prayer-text)",
                cursor: joining ? "not-allowed" : "pointer",
                fontSize: "0.9375rem",
              }}
            >
              {joining ? "Joining…" : "Join as listener"}
            </button>
          </div>
          <div style={{ marginTop: "1.5rem" }}>
            <Link href={basePath} className="prayer-share-link">
              ← Back to prayer
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <PrayerRoomProvider value={roomContextValue}>
      <div className="prayer-platform" style={{ padding: "2rem 1rem 4rem" }}>
        {isHost && (
          <ModeratorPanel
            isOpen={moderatorPanelOpen}
            onClose={() => setModeratorPanelOpen(false)}
            roomTitle={room?.title}
          />
        )}
        <section className="prayer-hero-card">
          <div className="prayer-brand">Live Prayer Room</div>
          <h1 className="prayer-title">{room?.title || "Prayer Room"}</h1>
          <p className="prayer-subtitle">
            {webrtc.participants.length} participant{webrtc.participants.length !== 1 ? "s" : ""}
          </p>

          {recording.recordingStatus === "recording" && (
            <div
              style={{
                marginTop: "0.5rem",
                padding: "0.35rem 0.75rem",
                borderRadius: 999,
                background: "rgba(239,68,68,0.2)",
                color: "#f87171",
                fontSize: "0.8125rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171" }} />
              Recording {formatDuration(recording.recordDurationSec)}
            </div>
          )}

          {webrtc.error && (
            <p style={{ color: "#f87171", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
              {webrtc.error}
            </p>
          )}

          <ParticipantVideoGrid
            participants={webrtc.participants}
            currentParticipantId={participantId}
            hostId={hostId}
            localVideoTrack={webrtc.localVideoTrack}
            videoEnabled={webrtc.videoEnabled}
            participantVideoTracks={webrtc.participantVideoTracks}
          />

          {hasVisibleContent && (
            <div
              ref={contentWrapperRef}
              className="prayer-content-stage"
              style={{
                position: "relative",
                width: "100%",
                marginTop: "1rem",
              }}
            >
              {webrtc.screenShareStream ? (
                <ScreenShareView stream={webrtc.screenShareStream} />
              ) : activeDeck ? (
                <SlideViewer roomId={roomId} canNavigate={isHost} />
              ) : studyPages.length > 0 ? (
                <SessionSlidesView roomId={roomId} canNavigate={isHost} />
              ) : hasParticipantVideo ? (
                <VideoContentView
                  localVideoTrack={webrtc.localVideoTrack}
                  videoEnabled={webrtc.videoEnabled}
                  firstRemoteStream={firstRemoteStream ?? undefined}
                />
              ) : isHost && annotationVisible ? (
                <div
                  className="prayer-blank-slide"
                  style={{
                    minHeight: 280,
                    aspectRatio: "16/10",
                    background: "var(--prayer-card-bg, rgba(30,41,59,0.6))",
                    borderRadius: 12,
                    border: "1px dashed var(--prayer-card-border, rgba(148,163,184,0.3))",
                  }}
                />
              ) : null}
              {annotationVisible && (
                <AnnotationOverlay
                  roomId={roomId}
                  onChange={handleAnnotationChange}
                  editable={isHost && annotationVisible}
                  accentColor={palette.accent}
                  showToolbar={isHost}
                />
              )}
            </div>
          )}

          {role === "listener" && <ListenerAudio stream={webrtc.remoteStream} />}

          <PrayerRoomParticipants
            participants={webrtc.participants}
            currentParticipantId={participantId}
            onInviteToSpeak={isHost ? engine.handlePromoteToSpeaker : undefined}
            canInviteToSpeak={isHost}
          />

          <PrayerRoomControls
            role={role}
            isHost={isHost}
            participantId={participantId}
            hostId={hostId ?? ""}
            roomId={roomId}
            participants={webrtc.participants}
            myMuted={webrtc.myMuted}
            onMuteSelf={webrtc.setMyMuted}
            onMuteParticipant={engine.handleMuteParticipant}
            onEndRoom={isHost ? engine.handleEndRoom : undefined}
            onOpenModeratorPanel={isHost ? () => setModeratorPanelOpen(true) : undefined}
          />

          <div style={{ marginTop: "1.5rem" }}>
            <Link href={basePath} className="prayer-share-link">
              ← Back to prayer
            </Link>
          </div>
        </section>
      </div>
    </PrayerRoomProvider>
  );
}
