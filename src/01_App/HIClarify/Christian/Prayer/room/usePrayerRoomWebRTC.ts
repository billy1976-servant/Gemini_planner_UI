"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track, createLocalAudioTrack } from "livekit-client";
import type { RoomParticipant, RoomRole } from "../PrayerRoomTypes";
import type { RoomSignalingEvent } from "../PrayerRoomTypes";
import type { AnnotationStroke } from "./AnnotationOverlay";

export interface UsePrayerRoomWebRTCOptions {
  roomId: string | null;
  participantId: string | null;
  role: RoomRole;
  hostId: string | null;
  /** From room API; merged with LiveKit presence for returned participants. */
  participants: RoomParticipant[];
  token: string | null;
  liveKitUrl: string | null;
  onMuteRequest?: (muted: boolean) => void;
  /** When a remote annotation stroke is received (e.g. from host). */
  onRemoteStroke?: (stroke: AnnotationStroke) => void;
  /** Called when room disconnects (e.g. to stop recording). */
  onDisconnected?: () => void;
}

export interface UsePrayerRoomWebRTCResult {
  localStream: MediaStream | null;
  /** For listener: mixed stream of all remote speakers. For host/speaker: null. */
  remoteStream: MediaStream | null;
  /** For host: mixed stream (local + remote speakers) for recording. For others: null. */
  mixedStream: MediaStream | null;
  /** When someone is sharing their screen, composed screen stream (video) for display. */
  screenShareStream: MediaStream | null;
  /** Host/speakers can toggle screen share; listeners get only screenShareStream. */
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  /** Host only: broadcast an annotation stroke to all participants. */
  publishAnnotationStroke: (stroke: AnnotationStroke) => void;
  handleSignalingEvent: (event: RoomSignalingEvent) => void;
  myMuted: boolean;
  setMyMuted: (muted: boolean) => void;
  error: string | null;
  /** Participants merged from room API + LiveKit presence and mute state. */
  participants: RoomParticipant[];
  /** Local camera track (when video enabled); null if camera unavailable or off. */
  localVideoTrack: MediaStreamTrack | null;
  /** Whether camera is currently published. */
  videoEnabled: boolean;
  /** Toggle camera on/off (publish/unpublish). No-op if camera unavailable. */
  setVideoEnabled: (enabled: boolean) => void;
  /** Per-participant video streams for camera (identity -> stream). */
  participantVideoTracks: Map<string, MediaStream>;
  /** True if camera was available at join (getUserMedia succeeded). */
  cameraAvailable: boolean;
  /** True if microphone was available at join. */
  audioAvailable: boolean;
}

function mergeParticipants(
  fromRoom: RoomParticipant[],
  liveKitIdentities: Set<string>,
  muteByIdentity: Map<string, boolean>
): RoomParticipant[] {
  const byId = new Map<string, RoomParticipant>();
  for (const p of fromRoom) {
    byId.set(p.participantId, { ...p });
  }
  for (const identity of liveKitIdentities) {
    const existing = byId.get(identity);
    const muted = muteByIdentity.get(identity);
    if (existing) {
      existing.muted = muted ?? existing.muted;
    } else {
      byId.set(identity, {
        participantId: identity,
        role: "listener",
        joinedAt: new Date().toISOString(),
        muted: muted ?? false,
      });
    }
  }
  return Array.from(byId.values());
}

export function usePrayerRoomWebRTC({
  roomId,
  participantId,
  role,
  hostId,
  participants: participantsFromRoom,
  token,
  liveKitUrl,
  onMuteRequest,
  onRemoteStroke,
  onDisconnected,
}: UsePrayerRoomWebRTCOptions): UsePrayerRoomWebRTCResult {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [mixedStream, setMixedStream] = useState<MediaStream | null>(null);
  const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null);
  const [myMuted, setMyMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveParticipants, setLiveParticipants] = useState<Set<string>>(new Set());
  const [muteByIdentity, setMuteByIdentity] = useState<Map<string, boolean>>(new Map());
  const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [videoEnabled, setVideoEnabledState] = useState(false);
  const [participantVideoTracks, setParticipantVideoTracks] = useState<Map<string, MediaStream>>(new Map());
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(true);

  const roomRef = useRef<Room | null>(null);
  const mixContextRef = useRef<AudioContext | null>(null);
  const mixDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const remoteTracksRef = useRef<Map<string, MediaStreamTrack>>(new Map());
  const localVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const onMuteRequestRef = useRef(onMuteRequest);
  onMuteRequestRef.current = onMuteRequest;
  const onRemoteStrokeRef = useRef(onRemoteStroke);
  onRemoteStrokeRef.current = onRemoteStroke;
  const onDisconnectedRef = useRef(onDisconnected);
  onDisconnectedRef.current = onDisconnected;

  const participants = mergeParticipants(
    participantsFromRoom,
    liveParticipants,
    muteByIdentity
  );

  const handleSignalingEvent = useCallback((_event: RoomSignalingEvent) => {
    // No-op: LiveKit path uses server mute and track events only.
  }, []);

  useEffect(() => {
    if (!token || !liveKitUrl || !roomId || !participantId) {
      setError(null);
      return;
    }

    let cancelled = false;
    const room = new Room({ adaptiveStream: true });
    roomRef.current = room;

    const setupMix = (isListener: boolean) => {
      if (!mixContextRef.current) {
        const ctx = new AudioContext();
        mixContextRef.current = ctx;
        const dest = ctx.createMediaStreamDestination();
        mixDestinationRef.current = dest;
        if (isListener) setRemoteStream(dest.stream);
        else setMixedStream(dest.stream);
      }
    };

    const addTrackToMix = (track: MediaStreamTrack, identity: string) => {
      const ctx = mixContextRef.current;
      const dest = mixDestinationRef.current;
      if (!ctx || !dest || track.kind !== "audio") return;
      try {
        const src = ctx.createMediaStreamSource(new MediaStream([track]));
        src.connect(dest);
      } catch {
        // ignore
      }
    };

    const removeTrackFromMix = (_identity: string) => {
      // Mix destination stays; we don't disconnect individual sources (track ended is enough).
    };

    room.on(RoomEvent.Connected, () => {
      setError(null);
    });

    room.on(RoomEvent.Disconnected, () => {
      if (!cancelled) {
        setError("Disconnected from room");
        onDisconnectedRef.current?.();
      }
    });

    room.on(RoomEvent.MediaDevicesError, (e: unknown) => {
      if (!cancelled) setError(e instanceof Error ? e.message : "Media devices error");
    });

    room.on(RoomEvent.ParticipantConnected, (participant) => {
      if (cancelled) return;
      const identity = participant.identity;
      setLiveParticipants((prev) => new Set(prev).add(identity));
    });

    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      if (cancelled) return;
      const identity = participant.identity;
      remoteTracksRef.current.delete(identity);
      setLiveParticipants((prev) => {
        const next = new Set(prev);
        next.delete(identity);
        return next;
      });
      removeTrackFromMix(identity);
    });

    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (cancelled) return;
      const identity = participant.identity;
      if (track.kind === "audio") {
        remoteTracksRef.current.set(identity, track.mediaStreamTrack);
        const isListener = role === "listener";
        const isHost = role === "host";
        if (isListener) {
          setupMix(true);
          addTrackToMix(track.mediaStreamTrack, identity);
        } else if (isHost) {
          setupMix(false);
          addTrackToMix(track.mediaStreamTrack, identity);
        }
      } else if (track.kind === "video" && publication.source === Track.Source.ScreenShare) {
        setScreenShareStream(new MediaStream([track.mediaStreamTrack]));
      } else if (track.kind === "video" && publication.source === Track.Source.Camera) {
        setParticipantVideoTracks((prev) => {
          const next = new Map(prev);
          next.set(identity, new MediaStream([track.mediaStreamTrack]));
          return next;
        });
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      if (cancelled) return;
      const identity = participant.identity;
      remoteTracksRef.current.delete(identity);
      if (track.kind === "video" && publication.source === Track.Source.ScreenShare) {
        setScreenShareStream(null);
      } else if (track.kind === "video" && publication.source === Track.Source.Camera) {
        setParticipantVideoTracks((prev) => {
          const next = new Map(prev);
          next.delete(identity);
          return next;
        });
      }
    });

    room.on(RoomEvent.TrackMuted, (_publication, participant) => {
      if (cancelled) return;
      if (participant.identity === participantId) {
        onMuteRequestRef.current?.(true);
      }
      setMuteByIdentity((prev) => {
        const next = new Map(prev);
        next.set(participant.identity, true);
        return next;
      });
    });

    room.on(RoomEvent.TrackUnmuted, (_publication, participant) => {
      if (cancelled) return;
      if (participant.identity === participantId) {
        onMuteRequestRef.current?.(false);
      }
      setMuteByIdentity((prev) => {
        const next = new Map(prev);
        next.set(participant.identity, false);
        return next;
      });
    });

    room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
      if (cancelled || !onRemoteStrokeRef.current) return;
      try {
        const str = new TextDecoder().decode(payload);
        const data = JSON.parse(str) as { type?: string; stroke?: AnnotationStroke };
        if (data?.type === "annotation_stroke" && data.stroke) {
          onRemoteStrokeRef.current(data.stroke);
        }
      } catch {
        // ignore invalid payloads
      }
    });

    (async () => {
      try {
        await room.connect(liveKitUrl, token);

        if (cancelled) return;

        if (role === "host" || role === "speaker") {
          let stream: MediaStream | null = null;
          try {
            const audioTrack = await createLocalAudioTrack();
            stream = new MediaStream([audioTrack.mediaStreamTrack]);
            setLocalStream(stream);
            setAudioAvailable(true);

            await room.localParticipant.publishTrack(audioTrack.mediaStreamTrack, {
              name: "microphone",
              source: Track.Source.Microphone,
            });
          } catch (audioErr) {
            if (!cancelled) setAudioAvailable(false);
            setLocalStream(null);
          }

          if (role === "host" && stream) {
            const ctx = new AudioContext();
            const dest = ctx.createMediaStreamDestination();
            const src = ctx.createMediaStreamSource(stream);
            src.connect(dest);
            mixContextRef.current = ctx;
            mixDestinationRef.current = dest;
            setMixedStream(dest.stream);
          } else if (role === "host" && !stream) {
            setupMix(false);
          }

          try {
            const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const vTrack = videoStream.getVideoTracks()[0] ?? null;
            if (vTrack && !cancelled) {
              localVideoTrackRef.current = vTrack;
              setLocalVideoTrack(vTrack);
              setCameraAvailable(true);
            } else if (videoStream) {
              videoStream.getTracks().forEach((t) => t.stop());
            }
          } catch {
            if (!cancelled) setCameraAvailable(false);
          }
        }

        setLiveParticipants((prev) => {
          const next = new Set(prev);
          next.add(participantId);
          room.remoteParticipants.forEach((p) => next.add(p.identity));
          return next;
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to connect");
        }
      }
    })();

    return () => {
      cancelled = true;
      localVideoTrackRef.current?.stop();
      localVideoTrackRef.current = null;
      room.disconnect(true);
      roomRef.current = null;
      remoteTracksRef.current.clear();
      mixContextRef.current?.close();
      mixContextRef.current = null;
      mixDestinationRef.current = null;
      setLocalStream(null);
      setRemoteStream(null);
      setMixedStream(null);
      setLiveParticipants(new Set());
      setMuteByIdentity(new Map());
      setScreenShareStream(null);
      setLocalVideoTrack(null);
      setParticipantVideoTracks(new Map());
      setCameraAvailable(false);
      setAudioAvailable(true);
    };
  }, [token, liveKitUrl, roomId, participantId, role]);

  useEffect(() => {
    if (role === "listener" || !localStream) return;
    if (myMuted) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = false));
    } else {
      localStream.getAudioTracks().forEach((t) => (t.enabled = true));
    }
  }, [myMuted, localStream, role]);

  const startScreenShare = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.localParticipant.setScreenShareEnabled(false);
      await room.localParticipant.setScreenShareEnabled(true);
    } catch (e) {
      setError((e as Error)?.message ?? "Failed to start screen share");
    }
  }, []);

  const stopScreenShare = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.localParticipant.setScreenShareEnabled(false);
    } catch {
      // ignore
    }
  }, []);

  const setVideoEnabled = useCallback(
    async (enabled: boolean) => {
      const room = roomRef.current;
      const track = localVideoTrackRef.current;
      if (!room || !track) {
        setVideoEnabledState(false);
        return;
      }
      try {
        if (enabled) {
          await room.localParticipant.publishTrack(track, {
            name: "camera",
            source: Track.Source.Camera,
          });
          setVideoEnabledState(true);
        } else {
          const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
          if (pub?.track) await room.localParticipant.unpublishTrack(pub.track.mediaStreamTrack, false);
          setVideoEnabledState(false);
        }
      } catch (e) {
        setError((e as Error)?.message ?? "Failed to toggle camera");
        setVideoEnabledState(false);
      }
    },
    []
  );

  const publishAnnotationStroke = useCallback((stroke: AnnotationStroke) => {
    const room = roomRef.current;
    if (!room || role !== "host") return;
    try {
      const data = JSON.stringify({ type: "annotation_stroke", stroke });
      room.localParticipant.publishData(new TextEncoder().encode(data), { reliable: false });
    } catch {
      // ignore
    }
  }, [role]);

  return {
    localStream,
    remoteStream,
    mixedStream,
    screenShareStream,
    startScreenShare,
    stopScreenShare,
    publishAnnotationStroke,
    handleSignalingEvent,
    myMuted,
    setMyMuted,
    error,
    participants,
    localVideoTrack,
    videoEnabled,
    setVideoEnabled,
    participantVideoTracks,
    cameraAvailable,
    audioAvailable,
  };
}
