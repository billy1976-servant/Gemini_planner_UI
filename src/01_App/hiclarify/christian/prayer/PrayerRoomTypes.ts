/**
 * Types for Live Prayer Room (host-centric audio).
 * Speakers send to host; host mixes and sends one stream to listeners.
 */

export type RoomRole = "host" | "speaker" | "listener";

export type RoomStatus = "active" | "ended";

export interface RoomParticipant {
  participantId: string;
  role: RoomRole;
  displayName?: string;
  muted?: boolean;
  joinedAt: string;
}

export interface PrayerRoom {
  roomId: string;
  hostId: string;
  title?: string;
  groupId?: string | null;
  createdAt: string;
  status: RoomStatus;
  participants: RoomParticipant[];
  maxSpeakers: number;
}

export interface PrayerRoomCreatePayload {
  hostId: string;
  title?: string;
  groupId?: string | null;
}

export interface PrayerRoomJoinPayload {
  roomId: string;
  participantId: string;
  role: RoomRole;
  displayName?: string;
}

export type SignalingMessageType = "offer" | "answer" | "ice" | "mute";

export interface SignalingMessage {
  type: SignalingMessageType;
  from: string;
  to: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  muted?: boolean;
  timestamp: number;
}

export interface RoomSignalingEvent {
  id: string;
  roomId: string;
  message: SignalingMessage;
}
