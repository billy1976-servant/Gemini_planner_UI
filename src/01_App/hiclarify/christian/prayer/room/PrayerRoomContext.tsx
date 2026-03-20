"use client";

import React, { createContext, useContext } from "react";
import type { PrayerRoom as PrayerRoomType } from "../PrayerRoomTypes";
import type { RoomParticipant, RoomRole } from "../PrayerRoomTypes";
import type { RecordingStatus } from "./useRoomRecording";
import type { SessionEvent } from "./session-timeline";
import type { AnnotationEvent } from "./annotation-timeline";

export interface PrayerRoomContextValue {
  roomId: string;
  room: PrayerRoomType | null;
  hostId: string | null;
  participantId: string | null;
  role: RoomRole | null;
  recording: {
    recordingStatus: RecordingStatus;
    recordedBlob: Blob | null;
    recordDurationSec: number;
    onStartRecording: () => void;
    onStopRecording: () => void;
    onPublishRecording: (title: string) => void;
  };
  webrtc: {
    participants: RoomParticipant[];
    isScreenSharing: boolean;
    onStartScreenShare: () => Promise<void>;
    onStopScreenShare: () => Promise<void>;
    videoEnabled: boolean;
    setVideoEnabled: (enabled: boolean) => void;
    cameraAvailable: boolean;
    myMuted: boolean;
    onMuteSelf: (muted: boolean) => void;
    onMuteAll: () => void;
    onMuteParticipant: (participantId: string, muted: boolean) => void;
    connectionStatus: string | null;
    recordingReady: boolean;
    screenShareReady: boolean;
    error: string | null;
  };
  exportReplay: {
    sessionTimeline: SessionEvent[];
    annotationTimeline: AnnotationEvent[];
    canExportSession: boolean;
    onExportSession: () => void;
  };
  /** Absolute invite URL for this room, when available. */
  inviteUrl?: string;
  onEndRoom: () => void;
  onSaveStudyPage: (title: string) => void;
  onAnnotateScreen: () => void;
  onCopyInviteLink: () => void;
  hasAnnotatableContent: boolean;
  isPublishing: boolean;
  publishError: string | null;
}

const PrayerRoomContext = createContext<PrayerRoomContextValue | null>(null);

export function usePrayerRoomContext(): PrayerRoomContextValue {
  const ctx = useContext(PrayerRoomContext);
  if (!ctx) throw new Error("usePrayerRoomContext must be used within PrayerRoomContext.Provider");
  return ctx;
}

export function PrayerRoomProvider({
  value,
  children,
}: {
  value: PrayerRoomContextValue;
  children: React.ReactNode;
}) {
  return (
    <PrayerRoomContext.Provider value={value}>
      {children}
    </PrayerRoomContext.Provider>
  );
}
