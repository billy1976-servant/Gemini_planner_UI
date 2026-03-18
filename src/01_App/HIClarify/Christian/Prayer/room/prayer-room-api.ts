/**
 * Client API for Live Prayer Room (host-centric).
 * All requests go to /api/prayer-room/*.
 * Uses safeFetch for reads to prevent UI crashes when API is unavailable.
 */

import type { PrayerRoom, RoomRole } from "../PrayerRoomTypes";
import { safeFetch } from "../utils/safeFetch";

function getBase(): string {
  if (typeof window !== "undefined") return `${window.location.origin}/api/prayer-room`;
  return "/api/prayer-room";
}

export interface PrayerRoomRequestOptions {
  /** When auth is disabled for testing: send this as anonymous participant id. */
  anonId?: string;
}

function headersWithAnon(contentType: boolean, anonId?: string): Record<string, string> {
  const h: Record<string, string> = contentType ? { "Content-Type": "application/json" } : {};
  if (anonId) h["X-Prayer-Anon-Id"] = anonId;
  return h;
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

export type CreateRoomResult =
  | { ok: true; roomId: string; inviteLink: string; room: PrayerRoom }
  | { ok: false; error: string };

export async function createRoom(
  payload: CreateRoomPayload,
  options?: PrayerRoomRequestOptions
): Promise<CreateRoomResult> {
  try {
    const res = await fetch(`${getBase()}/create`, {
      method: "POST",
      headers: headersWithAnon(true, options?.anonId),
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = typeof (data as { message?: string }).message === "string"
        ? (data as { message: string }).message
        : "Failed to create room";
      return { ok: false, error: message };
    }
    if (!data || typeof data !== "object" || typeof (data as CreateRoomResponse).roomId !== "string") {
      return { ok: false, error: "Invalid response from server" };
    }
    const d = data as CreateRoomResponse;
    return { ok: true, roomId: d.roomId, inviteLink: d.inviteLink, room: d.room };
  } catch (err) {
    console.warn("[prayer-room-api] createRoom failed", err);
    return { ok: false, error: "Network error. Try again." };
  }
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

export async function joinRoom(
  payload: JoinRoomPayload,
  options?: PrayerRoomRequestOptions
): Promise<JoinRoomResponse | null> {
  try {
    const data = await safeFetch(`${getBase()}/join`, {
      method: "POST",
      headers: headersWithAnon(true, options?.anonId),
      body: JSON.stringify(payload),
    });
    if (!data || typeof data !== "object") return null;
    return data as JoinRoomResponse;
  } catch {
    console.warn("[prayer-room-api] joinRoom failed");
    return null;
  }
}

export async function endRoom(
  roomId: string,
  options?: PrayerRoomRequestOptions
): Promise<{ ok: boolean }> {
  try {
    const data = await safeFetch(`${getBase()}/end`, {
      method: "POST",
      headers: headersWithAnon(true, options?.anonId),
      body: JSON.stringify({ roomId }),
    });
    if (!data || typeof data !== "object") return { ok: false };
    return (data as { ok?: boolean }).ok === true ? { ok: true } : { ok: false };
  } catch {
    return { ok: false };
  }
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
  const url = groupId
    ? `${getBase()}/active?groupId=${encodeURIComponent(groupId)}`
    : `${getBase()}/active`;
  const data = await safeFetch(url);
  if (!data || typeof data !== "object") return [];
  const rooms = (data as { rooms?: unknown }).rooms;
  return Array.isArray(rooms) ? rooms : [];
}

export async function getRoom(roomId: string): Promise<PrayerRoom | null> {
  const data = await safeFetch(`${getBase()}/room?roomId=${encodeURIComponent(roomId)}`);
  if (!data || typeof data !== "object") return null;
  const r = data as PrayerRoom;
  if (!r.roomId) return null;
  return r;
}

export async function setParticipantMute(
  roomId: string,
  participantId: string,
  muted: boolean,
  options?: PrayerRoomRequestOptions
): Promise<void> {
  try {
    await safeFetch(`${getBase()}/mute`, {
      method: "POST",
      headers: headersWithAnon(true, options?.anonId),
      body: JSON.stringify({ roomId, participantId, muted }),
    });
  } catch {
    console.warn("[prayer-room-api] setParticipantMute failed");
  }
}

export interface LiveKitTokenResponse {
  token: string;
  url: string;
}

const LIVEKIT_WARNED_KEY = "prayer-livekit-warned";

export async function getLiveKitToken(
  roomId: string,
  role: RoomRole,
  displayName?: string,
  options?: PrayerRoomRequestOptions
): Promise<LiveKitTokenResponse | null> {
  try {
    const data = await safeFetch(`${getBase()}/token`, {
      method: "POST",
      headers: headersWithAnon(true, options?.anonId),
      body: JSON.stringify({ roomId, role, displayName }),
    });
    if (!data || typeof data !== "object") {
      if (typeof sessionStorage !== "undefined" && !sessionStorage.getItem(LIVEKIT_WARNED_KEY)) {
        sessionStorage.setItem(LIVEKIT_WARNED_KEY, "1");
        console.warn(
          "[LiveKit] Room token unavailable. If live audio/recording/screen share are disabled, set in .env.local (dev) or Vercel (prod): LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET. See .env.local.example."
        );
      }
      return null;
    }
    const d = data as LiveKitTokenResponse;
    if (typeof d.token !== "string" || typeof d.url !== "string") return null;
    return d;
  } catch {
    if (typeof sessionStorage !== "undefined" && !sessionStorage.getItem(LIVEKIT_WARNED_KEY)) {
      sessionStorage.setItem(LIVEKIT_WARNED_KEY, "1");
      console.warn(
        "[LiveKit] Room token request failed. Add LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET to .env.local or Vercel to enable audio, recording, and screen share."
      );
    }
    return null;
  }
}

export async function setParticipantRole(
  roomId: string,
  participantId: string,
  role: RoomRole,
  options?: PrayerRoomRequestOptions
): Promise<{ ok: boolean }> {
  try {
    const res = await fetch(`${getBase()}/role`, {
      method: "POST",
      headers: headersWithAnon(true, options?.anonId),
      body: JSON.stringify({ roomId, participantId, role }),
    });
    if (!res.ok) {
      return { ok: false };
    }
    return { ok: true };
  } catch {
    console.warn("[prayer-room-api] setParticipantRole failed");
    return { ok: false };
  }
}
