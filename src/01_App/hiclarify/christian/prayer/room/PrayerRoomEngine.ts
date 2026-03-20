"use client";

/**
 * Prayer room engine: WebRTC, recording, session slice, annotation, replay export, API.
 * Consumed by PrayerRoom.tsx (wrapper) for layout and composition only.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSyncExternalStore } from "react";
import { useSession } from "next-auth/react";
import { getState, subscribeState } from "@/state/state-store";
import { getSlice, writeSlice, deriveActiveSlideId, getReplay, setReplay } from "./prayer-room-session.state";
import { usePalette } from "../../../../../components/ui/ThemeProvider";
import {
  joinRoom,
  endRoom,
  getRoom,
  setParticipantMute,
  getLiveKitToken,
  setParticipantRole,
} from "./prayer-room-api";
import { usePrayerRoomWebRTC } from "./usePrayerRoomWebRTC";
import { useRoomRecording } from "./useRoomRecording";
import { findCaptureSource, captureElementToDataURL } from "./capture-content";
import { uploadPrayer } from "../api/prayer-api";
import type { StudyPage } from "./StudyPagesManager";
import { initSessionTimeline, recordSlideChange, getSessionTimeline } from "./session-timeline";
import { initAnnotationTimeline, recordAnnotationEvent, getAnnotationTimeline } from "./annotation-timeline";
import { exportSession } from "./export-session";
import type { PrayerRoom as PrayerRoomType, RoomRole } from "../PrayerRoomTypes";
import { getPrayerAnonId } from "../prayerAnonId";
import type { PrayerRoomContextValue } from "./PrayerRoomContext";
import type { AnnotationStroke } from "./AnnotationOverlay";

const ROOM_STORAGE_KEY = "prayer-room";
const ROOM_POLL_MS = 5000;
const PROGRESS_FLUSH_INTERVAL_MS = 30000;

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

export function usePrayerRoomEngine(roomId: string, prayerBase: string) {
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
  const [joinChoice, setJoinChoice] = useState<RoomRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  const [liveKitUrl, setLiveKitUrl] = useState<string | null>(null);
  const lastProgressFlushRef = useRef<number>(0);

  useSyncExternalStore(subscribeState, getState, getState);
  const sessionSlice = getSlice(roomId);

  useEffect(() => {
    const stored = getStored(roomId);
    if (stored) {
      setParticipantId(stored.participantId);
      setRole(stored.role);
      setHostId(stored.hostId ?? null);
    }
  }, [roomId]);

  const fetchRoom = useCallback(async () => {
    const r = await getRoom(roomId);
    if (r) setRoom(r);
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
      return;
    }
    let cancelled = false;
    const displayName = session?.user?.name ?? "Guest";
    const anonOptions = session?.user ? undefined : { anonId: getPrayerAnonId() };
    getLiveKitToken(roomId, role, displayName, anonOptions)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setLiveKitToken(result.token);
          setLiveKitUrl(result.url);
        } else {
          setLiveKitToken(null);
          setLiveKitUrl(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLiveKitToken(null);
          setLiveKitUrl(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [roomId, participantId, role, session?.user?.name]);

  const handleJoin = useCallback(
    async (asRole: RoomRole) => {
      const uid = (session?.user as { id?: string } | undefined)?.id ?? getPrayerAnonId();
      setJoining(true);
      setError(null);
      const displayName = session?.user?.name ?? "Guest";
      try {
        const res = await joinRoom(
          {
            roomId,
            role: asRole,
            displayName,
          },
          session?.user ? undefined : { anonId: uid }
        );
        if (!res) {
          setError("Join failed");
          return;
        }
        setRoom(res.room);
        setParticipantId(uid);
        setRole(res.role);
        setHostId(res.room.hostId);
        setStored(roomId, {
          participantId: uid,
          role: res.role,
          hostId: res.room.hostId,
        });
        setJoinChoice(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Join failed");
      } finally {
        setJoining(false);
      }
    },
    [roomId, session]
  );

  const recordingStopRef = useRef<() => void>(() => {});
  const handleRemoteStroke = useCallback(
    (stroke: AnnotationStroke) => {
      writeSlice(roomId, { annotationStrokes: [...getSlice(roomId).annotationStrokes, stroke] });
    },
    [roomId]
  );
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

  // Track listening time while connected to a room (host/speaker/listener).
  useEffect(() => {
    if (!participantId || !roomId) return;
    let intervalId: number | null = null;
    const tick = () => {
      // Treat any connected participant as \"listening\" time.
      const nowSec = Date.now() / 1000;
      const last = lastProgressFlushRef.current || nowSec;
      const delta = nowSec - last;
      if (delta <= 0) {
        lastProgressFlushRef.current = nowSec;
        return;
      }
      lastProgressFlushRef.current = nowSec;
      const seconds = Math.round(delta);
      if (!Number.isFinite(seconds) || seconds <= 0) return;
      const anonId = (session?.user as { id?: string } | undefined)?.id
        ? undefined
        : getPrayerAnonId();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (anonId) headers["X-Prayer-Anon-Id"] = anonId;
      fetch("/api/prayer/progress", {
        method: "POST",
        headers,
        body: JSON.stringify({ seconds }),
        cache: "no-store",
      }).catch(() => {});
    };
    // Flush first chunk on join
    lastProgressFlushRef.current = Date.now() / 1000;
    intervalId = window.setInterval(tick, PROGRESS_FLUSH_INTERVAL_MS);
    return () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      // Final flush on unmount/leave
      tick();
    };
  }, [participantId, roomId, session]);

  const handleEndRoom = useCallback(async () => {
    if (!hostId || !participantId || participantId !== hostId) return;
    try {
      const anonOptions = session?.user ? undefined : { anonId: getPrayerAnonId() };
      await endRoom(roomId, anonOptions);
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
  }, [roomId, hostId, participantId, session?.user]);

  const handleMuteParticipant = useCallback(
    async (pid: string, muted: boolean) => {
      if (!hostId) return;
      try {
        const anonOptions = session?.user ? undefined : { anonId: getPrayerAnonId() };
        await setParticipantMute(roomId, pid, muted, anonOptions);
        await fetchRoom();
      } catch {
        // ignore
      }
    },
    [roomId, hostId, fetchRoom, session?.user]
  );

  const handlePromoteToSpeaker = useCallback(
    async (pid: string) => {
      if (!hostId) return;
      try {
        const anonOptions = session?.user ? undefined : { anonId: getPrayerAnonId() };
        const result = await setParticipantRole(roomId, pid, "speaker", anonOptions);
        if (!result.ok) return;
        await fetchRoom();
        if (pid === participantId) {
          setRole("speaker");
          setStored(roomId, {
            participantId: pid,
            role: "speaker",
            hostId,
          });
        }
      } catch {
        // ignore
      }
    },
    [roomId, hostId, participantId, fetchRoom, session?.user]
  );

  const isHost = participantId === hostId;
  const recording = useRoomRecording(
    isHost ? webrtc.mixedStream : null,
    isHost ? webrtc.screenShareStream : null
  );
  useEffect(() => {
    recordingStopRef.current = recording.stop;
  }, [recording.stop]);
  const [moderatorPanelOpen, setModeratorPanelOpen] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const annotationStrokesPrevLenRef = useRef(0);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  const { studyPages, annotationStrokes, annotationVisible, activeDeck, currentSlideIndex, currentSessionSlideIndex } = sessionSlice;

  useEffect(() => {
    if (recording.recordingStatus === "stopped") {
      setReplay(roomId, {
        sessionTimeline: getSessionTimeline(),
        annotationTimeline: getAnnotationTimeline(),
      });
    }
  }, [recording.recordingStatus, roomId]);

  const sessionSlidesWithImages = studyPages.filter((p) => p.imageUrl);
  useEffect(() => {
    if (currentSessionSlideIndex >= sessionSlidesWithImages.length && sessionSlidesWithImages.length > 0) {
      writeSlice(roomId, { currentSessionSlideIndex: Math.max(0, sessionSlidesWithImages.length - 1) });
    }
  }, [roomId, currentSessionSlideIndex, sessionSlidesWithImages.length]);

  const handleStartRecording = useCallback(() => {
    const startSec = typeof window !== "undefined" ? Date.now() / 1000 : 0;
    initSessionTimeline(startSec);
    initAnnotationTimeline(startSec);
    recording.start();
  }, [recording.start]);

  const handleAnnotationChange = useCallback(
    (newStrokes: AnnotationStroke[]) => {
      const prevLen = annotationStrokesPrevLenRef.current;
      writeSlice(roomId, { annotationStrokes: newStrokes });
      if (isHost && webrtc.publishAnnotationStroke && newStrokes.length > prevLen) {
        webrtc.publishAnnotationStroke(newStrokes[newStrokes.length - 1]!);
        const newStroke = newStrokes[newStrokes.length - 1]!;
        const slideId = deriveActiveSlideId(sessionSlice, !!webrtc.screenShareStream);
        recordAnnotationEvent({
          slideId,
          timestampSec: recording.recordDurationSec,
          type: (newStroke.mode === "erase" ? "erase" : newStroke.mode === "highlight" ? "highlight" : "draw") as "draw" | "highlight" | "erase",
          path: newStroke.points.map((p) => ({ x: p.x, y: p.y })),
          color: palette.accent ?? "#f97316",
          width: newStroke.mode === "highlight" ? 16 : newStroke.mode === "erase" ? 24 : 3,
        });
      }
      annotationStrokesPrevLenRef.current = newStrokes.length;
    },
    [roomId, isHost, webrtc.publishAnnotationStroke, webrtc.screenShareStream, sessionSlice, recording.recordDurationSec, palette.accent]
  );

  const lastRecordedSlideIndexRef = useRef<number | null>(null);
  useEffect(() => {
    if (recording.recordingStatus !== "recording") {
      lastRecordedSlideIndexRef.current = null;
      return;
    }
    if (!activeDeck || currentSlideIndex >= activeDeck.slides.length) return;
    if (lastRecordedSlideIndexRef.current === currentSlideIndex) return;
    lastRecordedSlideIndexRef.current = currentSlideIndex;
    const slide = activeDeck.slides[currentSlideIndex];
    if (slide) recordSlideChange(slide.id, currentSlideIndex);
  }, [currentSlideIndex, activeDeck, recording.recordingStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (recording.recordingStatus !== "recording") return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
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
        const published = await uploadPrayer(formData, room?.groupId ?? undefined);
        if (!published) {
          setPublishError("Publish failed");
        } else {
          recording.clear();
        }
      } catch (e) {
        setPublishError(e instanceof Error ? e.message : "Publish failed");
      } finally {
        setIsPublishing(false);
      }
    },
    [recording.recordedBlob, recording.recordDurationSec, recording.clear, room?.groupId, session?.user?.email, session?.user?.name, roomId, webrtc.participants, sessionSlice.studyPages]
  );

  const handleSaveStudyPage = useCallback(
    (title: string) => {
      let imageUrl: string | undefined;
      try {
        const source = findCaptureSource(contentWrapperRef.current);
        if (source) {
          imageUrl = captureElementToDataURL(source) ?? undefined;
        }
      } catch (e) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn("Capture failed", e);
        }
      }
      try {
        const slice = getSlice(roomId);
        const page: StudyPage = {
          id: crypto.randomUUID(),
          title: title.trim() || "Study page",
          createdAt: new Date().toISOString(),
          timestampSec: recording.recordDurationSec || undefined,
          imageUrl,
          annotations: slice.annotationStrokes.length > 0 ? [...slice.annotationStrokes] : undefined,
        };
        const nextPages = [...slice.studyPages, page];
        writeSlice(roomId, {
          studyPages: nextPages,
          currentSessionSlideIndex: imageUrl ? nextPages.length - 1 : slice.currentSessionSlideIndex,
        });
      } catch (e) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn("Save page failed", e);
        }
      }
    },
    [roomId, recording.recordDurationSec]
  );

  const handleAnnotateScreen = useCallback(() => {
    try {
      const source = findCaptureSource(contentWrapperRef.current);
      const imageUrl = source ? captureElementToDataURL(source) ?? undefined : undefined;
      const slice = getSlice(roomId);
      const page: StudyPage = {
        id: crypto.randomUUID(),
        title: "Screen capture",
        createdAt: new Date().toISOString(),
        timestampSec: recording.recordDurationSec || undefined,
        imageUrl,
        annotations: slice.annotationStrokes.length > 0 ? [...slice.annotationStrokes] : undefined,
      };
      const nextPages = [...slice.studyPages, page];
      writeSlice(roomId, {
        studyPages: nextPages,
        currentSessionSlideIndex: imageUrl ? nextPages.length - 1 : slice.currentSessionSlideIndex,
        annotationVisible: true,
      });
    } catch (e) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("Annotate screen capture failed", e);
      }
    }
  }, [roomId, recording.recordDurationSec]);

  const handleExportSession = useCallback(() => {
    exportSession(
      recording.recordedBlob,
      sessionSlice.activeDeck,
      getSessionTimeline(),
      getAnnotationTimeline(),
      recording.recordDurationSec,
      { downloadRecording: true, downloadManifest: true, filenameBase: `prayer-${roomId}-${Date.now()}` }
    );
  }, [recording.recordedBlob, recording.recordDurationSec, sessionSlice.activeDeck, roomId]);

  const hasParticipantVideo = !!(
    (webrtc.localVideoTrack && webrtc.videoEnabled) ||
    (webrtc.participantVideoTracks && webrtc.participantVideoTracks.size > 0)
  );
  const firstRemoteStream =
    webrtc.participantVideoTracks && webrtc.participantVideoTracks.size > 0
      ? webrtc.participantVideoTracks.values().next().value ?? null
      : null;
  const hasVisibleContent = !!(
    activeDeck ||
    webrtc.screenShareStream ||
    studyPages.length > 0 ||
    hasParticipantVideo ||
    (isHost && annotationVisible)
  );
  const hasAnnotatableContent = !!(
    (activeDeck && activeDeck.slides.length > 0) ||
    webrtc.screenShareStream ||
    studyPages.some((p) => p.imageUrl)
  );

  const roomContextValue = useMemo<PrayerRoomContextValue>(
    () => ({
      roomId,
      room,
      hostId,
      participantId,
      role,
      recording: {
        recordingStatus: recording.recordingStatus,
        recordedBlob: recording.recordedBlob,
        recordDurationSec: recording.recordDurationSec,
        onStartRecording: handleStartRecording,
        onStopRecording: recording.stop,
        onPublishRecording: handlePublishRecording,
      },
      webrtc: {
        participants: webrtc.participants,
        isScreenSharing: !!webrtc.screenShareStream,
        onStartScreenShare: webrtc.startScreenShare,
        onStopScreenShare: webrtc.stopScreenShare,
        videoEnabled: webrtc.videoEnabled,
        setVideoEnabled: webrtc.setVideoEnabled,
        cameraAvailable: webrtc.cameraAvailable,
        myMuted: webrtc.myMuted,
        onMuteSelf: webrtc.setMyMuted,
        onMuteAll: () => {
          webrtc.participants.forEach((p) => {
            if (p.participantId !== hostId) handleMuteParticipant(p.participantId, true);
          });
        },
        onMuteParticipant: handleMuteParticipant,
        connectionStatus: webrtc.error
          ? webrtc.error
          : !webrtc.mixedStream
            ? "Connecting to room… Use your mic to enable recording."
            : null,
        recordingReady: !!webrtc.mixedStream,
        screenShareReady: !webrtc.error,
        error: webrtc.error,
      },
      exportReplay: {
        sessionTimeline: getReplay(roomId).sessionTimeline,
        annotationTimeline: getReplay(roomId).annotationTimeline,
        canExportSession: recording.recordingStatus === "stopped" && !!recording.recordedBlob,
        onExportSession: handleExportSession,
      },
      inviteUrl:
        typeof window !== "undefined"
          ? `${window.location.origin}${prayerBase}/room/${roomId}`
          : undefined,
      onEndRoom: handleEndRoom,
      onSaveStudyPage: handleSaveStudyPage,
      onAnnotateScreen: handleAnnotateScreen,
      onCopyInviteLink: () => {
        const url =
          typeof window !== "undefined"
            ? `${window.location.origin}${prayerBase}/room/${roomId}`
            : "";
        navigator.clipboard?.writeText(url).catch(() => {});
      },
      hasAnnotatableContent,
      isPublishing,
      publishError,
      // host can promote listeners to speakers
      // exposed via context for room UI
      // (e.g., per-participant \"Invite to Speak\" controls)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(isHost ? { /* marker for host role in context */ } : {}),
    }),
    [
      roomId,
      room,
      hostId,
      participantId,
      role,
      prayerBase,
      recording.recordingStatus,
      recording.recordedBlob,
      recording.recordDurationSec,
      recording.stop,
      webrtc.participants,
      webrtc.screenShareStream,
      webrtc.videoEnabled,
      webrtc.setVideoEnabled,
      webrtc.cameraAvailable,
      webrtc.myMuted,
      webrtc.setMyMuted,
      webrtc.mixedStream,
      webrtc.error,
      hasAnnotatableContent,
      isPublishing,
      publishError,
      handleStartRecording,
      handlePublishRecording,
      handleMuteParticipant,
      handleEndRoom,
      handleSaveStudyPage,
      handleAnnotateScreen,
      handleExportSession,
    ]
  );

  return {
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
    publishError,
    isPublishing,
    handleAnnotationChange,
    contentWrapperRef,
    handleSaveStudyPage,
    handleAnnotateScreen,
    roomContextValue,
    hasVisibleContent,
    hasAnnotatableContent,
    hasParticipantVideo,
    firstRemoteStream,
    palette,
    prayerBase,
    handleEndRoom,
    handleMuteParticipant,
    handleExportSession,
    getReplay,
    studyPages,
    activeDeck,
    currentSlideIndex,
    currentSessionSlideIndex,
    annotationVisible,
    isHost,
    handlePromoteToSpeaker,
  };
}
