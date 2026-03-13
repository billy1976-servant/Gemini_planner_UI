/**
 * Client API for Live Prayer Room (host-centric).
 * All requests go to /api/prayer-room/*.
 */

import type { PrayerRoom, RoomRole } from "../PrayerRoomTypes";

function getBase(): string {
  if (typeof window !== "undefined") return `${window.location.origin}/api/prayer-room`;
  return "/api/prayer-room";
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
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Create room failed");
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
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Join room failed");
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
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "End room failed");
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
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Mute failed");
  }
}

export interface LiveKitTokenResponse {
  token: string;
  url: string;
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
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Token failed");
  }
  return res.json();
}
