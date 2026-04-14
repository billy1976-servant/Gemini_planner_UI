/**
 * Client API for Live Prayer Room (host-centric).
 * All requests go to /api/prayer-room/*.
 */

import type { PrayerRoom, RoomRole } from "../PrayerRoomTypes";

function getBase(): string {
  if (typeof window !== "undefined") return `${window.location.origin}/api/prayer-room`;
  return "/api/prayer-room";
}

interface ApiErrorPayload {
  message?: string;
}

async function parseApiError(res: Response, fallback: string): Promise<string> {
  const payload = (await res.json().catch(() => ({}))) as ApiErrorPayload;
  if (payload.message) return payload.message;
  if (res.status === 401) return "Sign in is required.";
  if (res.status === 403) return "You do not have access to this room.";
  if (res.status === 404) return "Room not found.";
  return fallback;
}

export interface CreateRoomPayload {
  title?: string;
  groupId?: string | null;
  organizationId?: string | null;
}

export interface CreateRoomResponse {
  roomId: string;
  inviteLink: string;
  room: PrayerRoom;
}

export async function createRoom(payload: CreateRoomPayload): Promise<CreateRoomResponse> {
  const res = await fetch(`${getBase()}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await parseApiError(res, "Create room failed"));
  }
  return res.json();
}

export interface JoinRoomPayload {
  roomId: string;
  role: RoomRole;
  displayName?: string;
}

export interface JoinRoomResponse {
  room: PrayerRoom;
  role: RoomRole;
  alreadyJoined?: boolean;
}

export async function joinRoom(payload: JoinRoomPayload): Promise<JoinRoomResponse> {
  const res = await fetch(`${getBase()}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await parseApiError(res, "Join room failed"));
  }
  return res.json();
}

export async function endRoom(roomId: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${getBase()}/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId }),
  });
  if (!res.ok) {
    throw new Error(await parseApiError(res, "End room failed"));
  }
  return res.json();
}

export interface ActiveRoomSummary {
  roomId: string;
  hostId: string;
  title?: string;
  groupId?: string;
  participantCount: number;
  createdAt: string;
}

export async function getActiveRooms(groupId?: string | null): Promise<ActiveRoomSummary[]> {
  try {
    const url = groupId
      ? `${getBase()}/active?groupId=${encodeURIComponent(groupId)}`
      : `${getBase()}/active`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json().catch(() => ({}));
    return Array.isArray(data?.rooms) ? data.rooms : [];
  } catch {
    return [];
  }
}

export async function getRoom(roomId: string): Promise<PrayerRoom | null> {
  const res = await fetch(`${getBase()}/room?roomId=${encodeURIComponent(roomId)}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function setParticipantMute(
  roomId: string,
  participantId: string,
  muted: boolean
): Promise<void> {
  const res = await fetch(`${getBase()}/mute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, participantId, muted }),
  });
  if (!res.ok) {
    throw new Error(await parseApiError(res, "Mute failed"));
  }
}

export interface LiveKitTokenResponse {
  token: string;
  url: string;
  role?: RoomRole;
}

export async function getLiveKitToken(
  roomId: string,
  role: RoomRole,
  displayName?: string
): Promise<LiveKitTokenResponse> {
  const res = await fetch(`${getBase()}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, role, displayName }),
  });
  if (!res.ok) {
    throw new Error(await parseApiError(res, "Token failed"));
  }
  return res.json();
}

export async function heartbeatRoom(roomId: string): Promise<void> {
  const res = await fetch(`${getBase()}/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId }),
  });
  if (!res.ok) {
    throw new Error(await parseApiError(res, "Heartbeat failed"));
  }
}

export async function leaveRoom(roomId: string): Promise<void> {
  const res = await fetch(`${getBase()}/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId }),
    keepalive: true,
  });
  if (!res.ok) {
    throw new Error(await parseApiError(res, "Leave room failed"));
  }
}
