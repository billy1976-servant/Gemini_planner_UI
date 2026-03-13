/**
 * Client-side API helpers for the Prayer platform.
 * All requests go to /api/prayer/* — handlers live in src/app/api/prayer/ and read/write only under Gospel/Prayer.
 */

import type { Prayer, Group } from "../PrayerTypes";

function getBase(): string {
  if (typeof window !== "undefined") return `${window.location.origin}/api/prayer`;
  return "/api/prayer";
}

function groupsBase(): string {
  if (typeof window !== "undefined") return `${window.location.origin}/api/prayer/groups`;
  return "/api/prayer/groups";
}

export async function getMyGroupIds(): Promise<string[]> {
  const res = await fetch(`${groupsBase()}/members`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  return Array.isArray(data?.groupIds) ? data.groupIds : [];
}

export async function joinGroup(groupId: string): Promise<void> {
  const res = await fetch(`${groupsBase()}/${encodeURIComponent(groupId)}/join`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Join failed");
  }
}

export async function leaveGroup(groupId: string): Promise<void> {
  const res = await fetch(`${groupsBase()}/${encodeURIComponent(groupId)}/leave`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Leave failed");
  }
}

export async function getPrayers(groupId?: string | null): Promise<Prayer[]> {
  const url = groupId ? `${getBase()}?groupId=${encodeURIComponent(groupId)}` : getBase();
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  try {
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data?.prayers ?? []);
    return list.filter((p: unknown) => p && typeof (p as Prayer).id === "string");
  } catch {
    return [];
  }
}

export async function getPrayer(id: string): Promise<Prayer | null> {
  const res = await fetch(`${getBase()}?id=${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.id ? data : null;
}

export async function uploadPrayer(formData: FormData, groupId?: string | null): Promise<Prayer> {
  if (groupId) formData.append("groupId", groupId);
  const res = await fetch(getBase(), {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Upload failed");
  }
  return res.json();
}

export async function getGroups(): Promise<Group[]> {
  const res = await fetch(groupsBase(), { cache: "no-store" });
  if (!res.ok) return [];
  try {
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    return list.filter((g: unknown) => g && typeof (g as Group).id === "string");
  } catch {
    return [];
  }
}

export async function getGroupBySlug(slug: string): Promise<Group | null> {
  const res = await fetch(`${groupsBase()}?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.id ? data : null;
}

export async function getGroup(id: string): Promise<Group | null> {
  const res = await fetch(`${groupsBase()}/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.id ? data : null;
}

export async function createGroup(payload: { name: string; description?: string; accentColor?: string; createdBy?: string }): Promise<Group> {
  const res = await fetch(groupsBase(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Create failed");
  }
  return res.json();
}

export async function updateGroup(
  id: string,
  payload: { name?: string; slug?: string; accentColor?: string; description?: string }
): Promise<Group> {
  const res = await fetch(`${groupsBase()}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Update failed");
  }
  return res.json();
}

export async function uploadGroupLogo(groupId: string, file: File): Promise<{ ok: boolean; logo: string }> {
  const formData = new FormData();
  formData.append("logo", file);
  const res = await fetch(`${groupsBase()}/${encodeURIComponent(groupId)}/logo`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Upload failed");
  }
  return res.json();
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
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

export async function createGuidedPrayer(payload: {
  title: string;
  scripture?: string;
  focus?: string;
  category?: string;
}): Promise<GuidedPrayer> {
  const res = await fetch(GUIDED_BASE(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Create failed");
  }
  return res.json();
}

const CHAINS_BASE = () =>
  typeof window !== "undefined" ? `${window.location.origin}/api/prayer/chains` : "/api/prayer/chains";

export interface PrayerChain {
  id: string;
  request: string;
  prayerIds: string[];
}

export async function getChains(): Promise<PrayerChain[]> {
  const res = await fetch(CHAINS_BASE(), { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

export async function getChain(id: string): Promise<PrayerChain | null> {
  const res = await fetch(`${CHAINS_BASE()}?id=${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.id ? data : null;
}

export async function createChain(payload: { request?: string; prayerIds?: string[] }): Promise<PrayerChain> {
  const res = await fetch(CHAINS_BASE(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Create failed");
  }
  return res.json();
}

const LISTENERS_BASE = () =>
  typeof window !== "undefined" ? `${window.location.origin}/api/prayer/listeners` : "/api/prayer/listeners";

export async function recordPlayed(prayerId: string): Promise<{ totalListeners: number }> {
  const res = await fetch(LISTENERS_BASE(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "played", prayerId }),
  });
  if (!res.ok) return { totalListeners: 0 };
  return res.json();
}

export async function joinSession(prayerId: string): Promise<{ sessionId: string } | null> {
  const res = await fetch(LISTENERS_BASE(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "join", prayerId }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function heartbeatSession(prayerId: string, sessionId: string): Promise<void> {
  await fetch(LISTENERS_BASE(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "heartbeat", prayerId, sessionId }),
  });
}

export async function leaveSession(sessionId: string): Promise<void> {
  const body = JSON.stringify({ action: "leave", sessionId });
  await fetch(LISTENERS_BASE(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

export async function getLiveCount(prayerId: string): Promise<number> {
  const res = await fetch(`${LISTENERS_BASE()}?prayerId=${encodeURIComponent(prayerId)}`, {
    cache: "no-store",
  });
  if (!res.ok) return 0;
  const data = await res.json().catch(() => ({}));
  return typeof data?.live === "number" ? data.live : 0;
}

export async function getLiveCountByGroup(groupId: string): Promise<number> {
  const res = await fetch(`${LISTENERS_BASE()}?groupId=${encodeURIComponent(groupId)}`, {
    cache: "no-store",
  });
  if (!res.ok) return 0;
  const data = await res.json().catch(() => ({}));
  return typeof data?.live === "number" ? data.live : 0;
}

const PRESENCE_BASE = () =>
  typeof window !== "undefined" ? `${window.location.origin}/api/prayer/presence` : "/api/prayer/presence";

export interface PresenceData {
  roomParticipants: number;
  listenerCount: number;
  total: number;
}

export async function getPresence(): Promise<PresenceData> {
  const res = await fetch(PRESENCE_BASE(), { cache: "no-store" });
  if (!res.ok) return { roomParticipants: 0, listenerCount: 0, total: 0 };
  const data = await res.json().catch(() => ({}));
  return {
    roomParticipants: typeof data?.roomParticipants === "number" ? data.roomParticipants : 0,
    listenerCount: typeof data?.listenerCount === "number" ? data.listenerCount : 0,
    total: typeof data?.total === "number" ? data.total : 0,
  };
}
