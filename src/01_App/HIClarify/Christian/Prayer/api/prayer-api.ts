/**
 * Client-side API helpers for the Prayer platform.
 * All requests go to /api/prayer/* — handlers live in src/app/api/prayer/ and read/write only under Gospel/Prayer.
 * Uses safeFetch: never throws, always returns safe defaults to prevent UI crashes.
 */

import type { Prayer, Group } from "../PrayerTypes";
import { safeFetch } from "../utils/safeFetch";

function getBase(): string {
  if (typeof window !== "undefined") return `${window.location.origin}/api/prayer`;
  return "/api/prayer";
}

function groupsBase(): string {
  if (typeof window !== "undefined") return `${window.location.origin}/api/prayer/groups`;
  return "/api/prayer/groups";
}

export async function getMyGroupIds(): Promise<string[]> {
  const data = await safeFetch(`${groupsBase()}/members`);
  if (!data || typeof data !== "object") return [];
  const ids = (data as { groupIds?: unknown }).groupIds;
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
}

export async function joinGroup(groupId: string): Promise<void> {
  try {
    const data = await safeFetch(`${groupsBase()}/${encodeURIComponent(groupId)}/join`, {
      method: "POST",
    });
    if (!data) return;
  } catch {
    console.warn("[prayer-api] joinGroup failed:", groupId);
  }
}

export async function leaveGroup(groupId: string): Promise<void> {
  try {
    const data = await safeFetch(`${groupsBase()}/${encodeURIComponent(groupId)}/leave`, {
      method: "POST",
    });
    if (!data) return;
  } catch {
    console.warn("[prayer-api] leaveGroup failed:", groupId);
  }
}

export async function getPrayers(groupId?: string | null): Promise<Prayer[]> {
  const url = groupId ? `${getBase()}?groupId=${encodeURIComponent(groupId)}` : getBase();
  const data = await safeFetch(url);
  if (!data) return [];
  const list = Array.isArray(data) ? data : (data as { prayers?: unknown[] }).prayers ?? [];
  return list.filter((p: unknown) => p && typeof (p as Prayer).id === "string") as Prayer[];
}

export async function getPrayer(id: string): Promise<Prayer | null> {
  const data = await safeFetch(`${getBase()}?id=${encodeURIComponent(id)}`);
  if (!data || typeof data !== "object" || !(data as Prayer).id) return null;
  return data as Prayer;
}

export async function uploadPrayer(formData: FormData, groupId?: string | null): Promise<Prayer | null> {
  try {
    if (groupId) formData.append("groupId", groupId);
    const res = await fetch(getBase(), { method: "POST", body: formData });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data?.id ? data : null;
  } catch {
    console.warn("[prayer-api] uploadPrayer failed");
    return null;
  }
}

/** Never throws: uses safeFetch so network/CORS errors don't crash the app. */
export async function getGroups(): Promise<Group[]> {
  const data = await safeFetch(groupsBase());
  if (!data || typeof data !== "object") return [];
  const list = Array.isArray(data) ? data : (data as { groups?: unknown[] }).groups ?? [];
  return list.filter((g: unknown) => g && typeof (g as Group).id === "string") as Group[];
}

export async function getGroupBySlug(slug: string): Promise<Group | null> {
  try {
    const data = await safeFetch(`${groupsBase()}?slug=${encodeURIComponent(slug)}`);
    if (!data || typeof data !== "object" || !(data as Group).id) return null;
    return data as Group;
  } catch {
    return null;
  }
}

export async function getGroup(id: string): Promise<Group | null> {
  const data = await safeFetch(`${groupsBase()}/${encodeURIComponent(id)}`);
  if (!data || typeof data !== "object" || !(data as Group).id) return null;
  return data as Group;
}

export async function createGroup(payload: {
  name: string;
  description?: string;
  accentColor?: string;
  createdBy?: string;
}): Promise<Group | null> {
  try {
    const data = await safeFetch(groupsBase(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!data || typeof data !== "object" || !(data as Group).id) return null;
    return data as Group;
  } catch {
    console.warn("[prayer-api] createGroup failed");
    return null;
  }
}

export async function updateGroup(
  id: string,
  payload: { name?: string; slug?: string; accentColor?: string; description?: string }
): Promise<Group | null> {
  try {
    const data = await safeFetch(`${groupsBase()}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!data || typeof data !== "object" || !(data as Group).id) return null;
    return data as Group;
  } catch {
    console.warn("[prayer-api] updateGroup failed");
    return null;
  }
}

export async function uploadGroupLogo(
  groupId: string,
  file: File
): Promise<{ ok: boolean; logo: string } | null> {
  try {
    const formData = new FormData();
    formData.append("logo", file);
    const res = await fetch(`${groupsBase()}/${encodeURIComponent(groupId)}/logo`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data && typeof data.logo === "string" ? { ok: true, logo: data.logo } : null;
  } catch {
    console.warn("[prayer-api] uploadGroupLogo failed");
    return null;
  }
}

export function getGroupLogoUrl(groupId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/prayer/groups/${encodeURIComponent(groupId)}/logo`;
  }
  return `/api/prayer/groups/${encodeURIComponent(groupId)}/logo`;
}

const GUIDED_BASE = () =>
  typeof window !== "undefined" ? `${window.location.origin}/api/prayer/guided` : "/api/prayer/guided";

export interface GuidedPrayer {
  id: string;
  title: string;
  scripture: string;
  focus: string;
  category: string;
}

export async function getGuidedPrayers(category?: string | null): Promise<GuidedPrayer[]> {
  const url = category ? `${GUIDED_BASE()}?category=${encodeURIComponent(category)}` : GUIDED_BASE();
  const data = await safeFetch(url);
  if (!data) return [];
  return Array.isArray(data) ? (data as GuidedPrayer[]) : [];
}

export async function createGuidedPrayer(payload: {
  title: string;
  scripture?: string;
  focus?: string;
  category?: string;
}): Promise<GuidedPrayer | null> {
  try {
    const data = await safeFetch(GUIDED_BASE(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!data || typeof data !== "object" || !(data as GuidedPrayer).id) return null;
    return data as GuidedPrayer;
  } catch {
    console.warn("[prayer-api] createGuidedPrayer failed");
    return null;
  }
}

const CHAINS_BASE = () =>
  typeof window !== "undefined" ? `${window.location.origin}/api/prayer/chains` : "/api/prayer/chains";

export interface PrayerChain {
  id: string;
  request: string;
  prayerIds: string[];
}

export async function getChains(): Promise<PrayerChain[]> {
  const data = await safeFetch(CHAINS_BASE());
  if (!data) return [];
  return Array.isArray(data) ? (data as PrayerChain[]) : [];
}

export async function getChain(id: string): Promise<PrayerChain | null> {
  const data = await safeFetch(`${CHAINS_BASE()}?id=${encodeURIComponent(id)}`);
  if (!data || typeof data !== "object" || !(data as PrayerChain).id) return null;
  return data as PrayerChain;
}

export async function createChain(payload: {
  request?: string;
  prayerIds?: string[];
}): Promise<PrayerChain | null> {
  try {
    const data = await safeFetch(CHAINS_BASE(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!data || typeof data !== "object" || !(data as PrayerChain).id) return null;
    return data as PrayerChain;
  } catch {
    console.warn("[prayer-api] createChain failed");
    return null;
  }
}

const LISTENERS_BASE = () =>
  typeof window !== "undefined" ? `${window.location.origin}/api/prayer/listeners` : "/api/prayer/listeners";

export async function recordPlayed(prayerId: string): Promise<{ totalListeners: number }> {
  try {
    const data = await safeFetch(LISTENERS_BASE(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "played", prayerId }),
    });
    if (!data || typeof data !== "object") return { totalListeners: 0 };
    const n = (data as { totalListeners?: number }).totalListeners;
    return { totalListeners: typeof n === "number" ? n : 0 };
  } catch {
    return { totalListeners: 0 };
  }
}

export async function joinSession(prayerId: string): Promise<{ sessionId: string } | null> {
  try {
    const data = await safeFetch(LISTENERS_BASE(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", prayerId }),
    });
    if (!data || typeof data !== "object") return null;
    const sid = (data as { sessionId?: string }).sessionId;
    return typeof sid === "string" ? { sessionId: sid } : null;
  } catch {
    return null;
  }
}

export async function heartbeatSession(prayerId: string, sessionId: string): Promise<void> {
  try {
    await safeFetch(LISTENERS_BASE(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "heartbeat", prayerId, sessionId }),
    });
  } catch {
    // no-op
  }
}

export async function leaveSession(sessionId: string): Promise<void> {
  try {
    await fetch(LISTENERS_BASE(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "leave", sessionId }),
      keepalive: true,
    });
  } catch {
    // no-op
  }
}

export async function getLiveCount(prayerId: string): Promise<number> {
  const data = await safeFetch(`${LISTENERS_BASE()}?prayerId=${encodeURIComponent(prayerId)}`);
  if (!data || typeof data !== "object") return 0;
  const n = (data as { live?: number }).live;
  return typeof n === "number" ? n : 0;
}

export async function getLiveCountByGroup(groupId: string): Promise<number> {
  const data = await safeFetch(`${LISTENERS_BASE()}?groupId=${encodeURIComponent(groupId)}`);
  if (!data || typeof data !== "object") return 0;
  const n = (data as { live?: number }).live;
  return typeof n === "number" ? n : 0;
}

const PRESENCE_BASE = () =>
  typeof window !== "undefined" ? `${window.location.origin}/api/prayer/presence` : "/api/prayer/presence";

export interface PresenceData {
  roomParticipants: number;
  listenerCount: number;
  total: number;
}

export async function getPresence(): Promise<PresenceData> {
  const data = await safeFetch(PRESENCE_BASE());
  if (!data || typeof data !== "object") return { roomParticipants: 0, listenerCount: 0, total: 0 };
  const d = data as { roomParticipants?: number; listenerCount?: number; total?: number };
  return {
    roomParticipants: typeof d.roomParticipants === "number" ? d.roomParticipants : 0,
    listenerCount: typeof d.listenerCount === "number" ? d.listenerCount : 0,
    total: typeof d.total === "number" ? d.total : 0,
  };
}
