"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePalette } from "../../../components/ui/ThemeProvider";
import {
  joinRoom,
  endRoom,
  getRoom,
  setParticipantMute,
  getLiveKitToken,
  heartbeatRoom,
  leaveRoom,
} from "./room/prayer-room-api";
import { usePrayerRoomWebRTC } from "./room/usePrayerRoomWebRTC";
import { useRoomRecording } from "./room/useRoomRecording";
import { ModeratorPanel } from "./room/ModeratorPanel";
import { ScreenShareView } from "./room/ScreenShareView";
import { AnnotationOverlay, type AnnotationStroke } from "./room/AnnotationOverlay";
import type { StudyPage } from "./room/StudyPagesManager";
import { PrayerRoomParticipants } from "./PrayerRoomParticipants";
import { PrayerRoomControls } from "./PrayerRoomControls";
import { uploadPrayer } from "./api/prayer-api";
import type { PrayerRoom as PrayerRoomType, RoomRole } from "./PrayerRoomTypes";

const ROOM_STORAGE_KEY = "prayer-room";
const ROOM_POLL_MS = 3000;
const HEARTBEAT_MS = 15_000;

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

export interface PrayerRoomProps {
  roomId: string;
}

function getStored(roomId: string): { participantId: string; role: RoomRole; hostId?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${ROOM_STORAGE_KEY}-${roomId}`);
    if (!raw) return null;
    return JSON.parse(raw) as { participantId: string; role: RoomRole; hostId?: string };
  } catch {
    return null;
  }
}

function setStored(
  roomId: string,
  data: { participantId: string; role: RoomRole; hostId?: string }
): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${ROOM_STORAGE_KEY}-${roomId}`, JSON.stringify(data));
}

function getInitialStored(roomId: string) {
  if (typeof window === "undefined") return null;
  return getStored(roomId);
}

export function PrayerRoom({ roomId }: PrayerRoomProps) {
  const { data: session } = useSession();
  const palette = usePalette();
  const [room, setRoom] = useState<PrayerRoomType | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(() =>
    getInitialStored(roomId)?.participantId ?? null
  );
  const [role, setRole] = useState<RoomRole | null>(() =>
    getInitialStored(roomId)?.role ?? null
  );
  const [hostId, setHostId] = useState<string | null>(() =>
    getInitialStored(roomId)?.hostId ?? null
  );
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [roomMissing, setRoomMissing] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  const [liveKitUrl, setLiveKitUrl] = useState<string | null>(null);
  const [annotationStrokes, setAnnotationStrokes] = useState<AnnotationStroke[]>([]);

  useEffect(() => {
    const stored = getStored(roomId);
    if (stored) {
      setParticipantId(stored.participantId);
      setRole(stored.role);
      setHostId(stored.hostId ?? null);
    }
  }, [roomId]);

  const fetchRoom = useCallback(async () => {
    setRoomLoading(true);
    const r = await getRoom(roomId);
    if (r) {
      setRoom(r);
      setRoomMissing(false);
      setError(null);
    } else {
      setRoom(null);
      setRoomMissing(true);
    }
    setRoomLoading(false);
    return r;
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    fetchRoom();
    const id = setInterval(fetchRoom, ROOM_POLL_MS);
    return () => clearInterval(id);
  }, [roomId, fetchRoom]);

  useEffect(() => {
    if (room?.status === "ended") {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`${ROOM_STORAGE_KEY}-${roomId}`);
      }
      setRoom(null);
      setParticipantId(null);
      setRole(null);
      setHostId(null);
    }
  }, [room?.status, roomId]);

  useEffect(() => {
    if (!participantId || !role || !roomId) {
      setLiveKitToken(null);
      setLiveKitUrl(null);
      setTokenError(null);
      return;
    }
    let cancelled = false;
    const displayName = session?.user?.name ?? undefined;
    setTokenError(null);
    getLiveKitToken(roomId, role, displayName)
      .then(({ token, url }) => {
        if (!cancelled) {
          setLiveKitToken(token);
          setLiveKitUrl(url);
          setTokenError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setLiveKitToken(null);
          setLiveKitUrl(null);
          setTokenError(e instanceof Error ? e.message : "Room token failed");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [roomId, participantId, role, session?.user?.name]);

  useEffect(() => {
    if (!participantId || !roomId) return;
    let stopped = false;
    const beat = () => {
      heartbeatRoom(roomId).catch(() => {
        // keep UI stable; token/connect panels surface actionable errors
      });
    };
    beat();
    const intervalId = setInterval(beat, HEARTBEAT_MS);

    const sendLeave = () => {
      if (stopped) return;
      leaveRoom(roomId).catch(() => {
        // keep navigation smooth; room cleanup is best-effort
      });
    };
    const onUnload = () => sendLeave();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") sendLeave();
    };
    window.addEventListener("beforeunload", onUnload);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopped = true;
      clearInterval(intervalId);
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("visibilitychange", onVisibility);
      leaveRoom(roomId).catch(() => {
        // no-op
      });
    };
  }, [roomId, participantId]);

  const handleJoin = useCallback(
    async (asRole: RoomRole) => {
      const uid = (session?.user as { id?: string } | undefined)?.id;
      if (!uid) {
        setError("Sign in to join this room");
        return;
      }
      setJoining(true);
      setError(null);
      setTokenError(null);
      const displayName = session?.user?.name ?? undefined;
      try {
        const res = await joinRoom({
          roomId,
          role: asRole,
          displayName,
        });
        setRoom(res.room);
        setParticipantId(uid);
        setRole(res.role);
        setHostId(res.room.hostId);
        setStored(roomId, {
          participantId: uid,
          role: res.role,
          hostId: res.room.hostId,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Join failed");
      } finally {
        setJoining(false);
      }
    },
    [roomId, session]
  );

  const recordingStopRef = useRef<() => void>(() => {});
  const handleRemoteStroke = useCallback((stroke: AnnotationStroke) => {
    setAnnotationStrokes((prev) => [...prev, stroke]);
  }, []);
  const handleDisconnected = useCallback(() => {
    recordingStopRef.current?.();
  }, []);
  const webrtc = usePrayerRoomWebRTC({
    roomId: participantId ? roomId : null,
    participantId,
    role: role ?? "listener",
    hostId,
    participants: room?.participants ?? [],
    token: liveKitToken,
    liveKitUrl,
    onMuteRequest: (muted) => {
      webrtc.setMyMuted(muted);
    },
    onRemoteStroke: handleRemoteStroke,
    onDisconnected: handleDisconnected,
  });

  const handleEndRoom = useCallback(async () => {
    if (!hostId || !participantId || participantId !== hostId) return;
    try {
      await endRoom(roomId);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`${ROOM_STORAGE_KEY}-${roomId}`);
      }
      setRoom(null);
      setParticipantId(null);
      setRole(null);
      setHostId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "End room failed");
    }
  }, [roomId, hostId, participantId]);

  const handleMuteParticipant = useCallback(
    async (pid: string, muted: boolean) => {
      if (!hostId) return;
      try {
        await setParticipantMute(roomId, pid, muted);
        await fetchRoom();
      } catch {
        // ignore
      }
    },
    [roomId, hostId, fetchRoom]
  );

  const isHost = participantId === hostId;
  const recording = useRoomRecording(isHost ? webrtc.mixedStream : null);
  useEffect(() => {
    recordingStopRef.current = recording.stop;
  }, [recording.stop]);
  const [moderatorPanelOpen, setModeratorPanelOpen] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [studyPages, setStudyPages] = useState<StudyPage[]>([]);
  const annotationStrokesPrevLenRef = useRef(0);
  const handleAnnotationChange = useCallback(
    (newStrokes: AnnotationStroke[]) => {
      setAnnotationStrokes(newStrokes);
      if (isHost && webrtc.publishAnnotationStroke && newStrokes.length > annotationStrokesPrevLenRef.current) {
        webrtc.publishAnnotationStroke(newStrokes[newStrokes.length - 1]!);
      }
      annotationStrokesPrevLenRef.current = newStrokes.length;
    },
    [isHost, webrtc.publishAnnotationStroke]
  );

  // Warn host if they try to close the tab while recording is in progress.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (recording.recordingStatus !== "recording") return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Chrome requires returnValue to be set.
      event.returnValue = "A recording is in progress. Are you sure you want to leave?";
      return event.returnValue;
    };
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, [recording.recordingStatus]);

  const handlePublishRecording = useCallback(
    async (title: string) => {
      if (!recording.recordedBlob || !title.trim()) return;
      setPublishError(null);
      setIsPublishing(true);
      try {
        const formData = new FormData();
        formData.append("audio", recording.recordedBlob, "recording.webm");
        formData.append("title", title.trim());
        formData.append("description", "");
        formData.append("prayerText", "");
        formData.append("published", "true");
        formData.append("duration", String(recording.recordDurationSec));
        formData.append("source", "live_room");
        formData.append("roomId", roomId);
        const currentParticipants =
          webrtc.participants?.map((p) => p.displayName || p.participantId) ?? [];
        formData.append("participants", JSON.stringify(currentParticipants));
        if (studyPages.length > 0) {
          formData.append("studyPages", JSON.stringify(studyPages));
        }
        if (session?.user?.email) formData.append("userId", session.user.email);
        if (session?.user?.name) formData.append("userName", session.user.name);
        await uploadPrayer(formData, room?.groupId ?? undefined);
        recording.clear();
      } catch (e) {
        setPublishError(e instanceof Error ? e.message : "Publish failed");
      } finally {
        setIsPublishing(false);
      }
    },
    [recording.recordedBlob, recording.recordDurationSec, recording.clear, room?.groupId, session?.user?.email, session?.user?.name, roomId, webrtc.participants, studyPages]
  );

  const handleSaveStudyPage = useCallback(
    (title: string) => {
      const page: StudyPage = {
        id: crypto.randomUUID(),
        title,
        createdAt: new Date().toISOString(),
        timestampSec: recording.recordDurationSec || undefined,
      };
      setStudyPages((prev) => [...prev, page]);
    },
    [recording.recordDurationSec]
  );

  if (roomLoading && !participantId) {
    return (
      <div className="prayer-platform" style={{ padding: "2rem 1rem 4rem" }}>
        <section className="prayer-hero-card">
          <div className="prayer-brand">Live Prayer Room</div>
          <p className="prayer-subtitle">Loading room…</p>
          <div style={{ marginTop: "1rem" }}>
            <Link href="/prayer" className="prayer-share-link">
              ← Back to prayer
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (roomMissing && !participantId) {
    return (
      <div className="prayer-platform" style={{ padding: "2rem 1rem 4rem" }}>
        <section className="prayer-hero-card">
          <div className="prayer-brand">Live Prayer Room</div>
          <h1 className="prayer-title">Room unavailable</h1>
          <p className="prayer-subtitle">This room does not exist or has already ended.</p>
          <div style={{ marginTop: "1.5rem" }}>
            <Link href="/prayer/live" className="prayer-share-link">
              ← Back to live rooms
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
          {tokenError && (
            <p style={{ color: "#f87171", fontSize: "0.8125rem", marginBottom: "1rem" }}>{tokenError}</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
            <button
              type="button"
              className="prayer-room-join-btn"
              disabled={joining || roomLoading || room?.status !== "active"}
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
              disabled={joining || roomLoading || room?.status !== "active"}
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
            <Link href="/prayer" className="prayer-share-link">
              ← Back to prayer
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="prayer-platform" style={{ padding: "2rem 1rem 4rem" }}>
      {isHost && (
        <ModeratorPanel
          isOpen={moderatorPanelOpen}
          onClose={() => setModeratorPanelOpen(false)}
          roomTitle={room?.title}
          recordingStatus={recording.recordingStatus}
          recordedBlob={recording.recordedBlob}
          recordDurationSec={recording.recordDurationSec}
          participants={webrtc.participants}
          currentParticipantId={participantId}
          onStartRecording={recording.start}
          onStopRecording={recording.stop}
          onPublishRecording={handlePublishRecording}
          onMuteParticipant={handleMuteParticipant}
          onEndRoom={handleEndRoom}
          isPublishing={isPublishing}
          publishError={publishError}
          canScreenShare={true}
          isScreenSharing={!!webrtc.screenShareStream}
          onStartScreenShare={webrtc.startScreenShare}
          onStopScreenShare={webrtc.stopScreenShare}
          studyPages={studyPages}
          onSaveStudyPage={handleSaveStudyPage}
        />
      )}
      <section className="prayer-hero-card">
        <div className="prayer-brand">Live Prayer Room</div>
        <h1 className="prayer-title">{room?.title || "Prayer Room"}</h1>
        <p className="prayer-subtitle">
          {webrtc.participants.length} participant{webrtc.participants.length !== 1 ? "s" : ""}
        </p>

        {webrtc.error && (
          <p style={{ color: "#f87171", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
            {webrtc.error}
          </p>
        )}
        {tokenError && (
          <p style={{ color: "#f87171", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
            {tokenError}
          </p>
        )}

        {/* Shared screen preview for all participants when active, with host annotations on top */}
        {webrtc.screenShareStream && (
          <div style={{ position: "relative", marginTop: "1rem" }}>
            <ScreenShareView stream={webrtc.screenShareStream} />
            <AnnotationOverlay
              strokes={annotationStrokes}
              onChange={handleAnnotationChange}
              editable={isHost}
              accentColor={palette.accent}
            />
          </div>
        )}

        {role === "listener" && <ListenerAudio stream={webrtc.remoteStream} />}

        <PrayerRoomParticipants
          participants={webrtc.participants}
          currentParticipantId={participantId}
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
          onMuteParticipant={handleMuteParticipant}
          onEndRoom={isHost ? handleEndRoom : undefined}
          onOpenModeratorPanel={isHost ? () => setModeratorPanelOpen(true) : undefined}
        />

        <div style={{ marginTop: "1.5rem" }}>
          <Link href="/prayer" className="prayer-share-link">
            ← Back to prayer
          </Link>
        </div>
      </section>
    </div>
  );
}
