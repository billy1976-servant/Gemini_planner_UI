/**
 * Centralized data layer for Prayer platform.
 * All reads and writes to JSON data files must go through this module.
 * Uses fs/promises for async I/O to avoid blocking and reduce corruption risk.
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(
  process.cwd(),
  "src",
  "01_App",
  "Christian",
  "Prayer",
  "data"
);

const PRAYERS_PATH = path.join(DATA_DIR, "prayers.json");
const GROUPS_PATH = path.join(DATA_DIR, "groups.json");
const MEMBERS_PATH = path.join(DATA_DIR, "group-members.json");
const ROOMS_PATH = path.join(DATA_DIR, "rooms.json");
const GUIDED_PATH = path.join(DATA_DIR, "guided-prayers.json");
const CHAINS_PATH = path.join(DATA_DIR, "prayer-chains.json");
const DAILY_PROGRESS_PATH = path.join(DATA_DIR, "daily-prayer-progress.json");

async function ensureDir(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw);
    return data as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await ensureDir(filePath);
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

// --- Prayer types (minimal for store) ---
export type PrayerRecord = Record<string, unknown>;

// --- Prayers ---
export async function getPrayers(): Promise<PrayerRecord[]> {
  const data = await readJsonFile<PrayerRecord[] | unknown>(PRAYERS_PATH, []);
  return Array.isArray(data) ? data : [];
}

export async function addPrayer(prayer: PrayerRecord): Promise<void> {
  const prayers = await getPrayers();
  prayers.push(prayer);
  await writeJsonFile(PRAYERS_PATH, prayers);
}

export async function updatePrayer(
  id: string,
  patch: Partial<PrayerRecord>
): Promise<void> {
  const prayers = await getPrayers();
  const index = prayers.findIndex((p) => p.id === id);
  if (index >= 0) {
    prayers[index] = { ...prayers[index], ...patch };
    await writeJsonFile(PRAYERS_PATH, prayers);
  }
}

// --- Group types ---
export type GroupRecord = Record<string, unknown> & { organizationId?: string };

export interface GroupMemberRecord {
  userId: string;
  groupId: string;
  role: "admin" | "member";
}

// --- Groups ---
export async function getGroups(): Promise<GroupRecord[]> {
  const data = await readJsonFile<GroupRecord[] | unknown>(GROUPS_PATH, []);
  return Array.isArray(data) ? data : [];
}

export async function addGroup(group: GroupRecord): Promise<void> {
  const groups = await getGroups();
  groups.push(group);
  await writeJsonFile(GROUPS_PATH, groups);
}

export async function updateGroup(
  id: string,
  patch: Partial<GroupRecord>
): Promise<void> {
  const groups = await getGroups();
  const index = groups.findIndex((g) => (g as { id?: string }).id === id);
  if (index >= 0) {
    groups[index] = { ...groups[index], ...patch };
    await writeJsonFile(GROUPS_PATH, groups);
  }
}

// --- Group members ---
export async function getGroupMembers(): Promise<GroupMemberRecord[]> {
  const data = await readJsonFile<GroupMemberRecord[] | unknown>(MEMBERS_PATH, []);
  return Array.isArray(data) ? data : [];
}

export async function joinGroup(
  userId: string,
  groupId: string,
  role: "admin" | "member" = "member"
): Promise<void> {
  const members = await getGroupMembers();
  if (members.some((m) => m.userId === userId && m.groupId === groupId)) return;
  members.push({ userId, groupId, role });
  await writeJsonFile(MEMBERS_PATH, members);
}

export async function leaveGroup(userId: string, groupId: string): Promise<void> {
  const members = await getGroupMembers();
  const filtered = members.filter(
    (m) => !(m.userId === userId && m.groupId === groupId)
  );
  if (filtered.length < members.length) {
    await writeJsonFile(MEMBERS_PATH, filtered);
  }
}

// --- Room types ---
export interface RoomParticipantRecord {
  participantId: string;
  participantUserId?: string;
  role: "host" | "speaker" | "listener";
  displayName?: string;
  muted?: boolean;
  joinedAt: string;
}

export type RoomSessionType = "prayer" | "study" | "meeting" | "teaching";

export interface RoomRecord {
  roomId: string;
  hostId: string;
  hostUserId?: string;
  title?: string;
  groupId?: string | null;
  organizationId?: string | null;
  sessionType?: RoomSessionType;
  features?: string[];
  createdAt: string;
  status: string;
  participants: RoomParticipantRecord[];
  maxSpeakers?: number;
}

// --- Rooms ---
export async function getRooms(): Promise<RoomRecord[]> {
  const data = await readJsonFile<{ rooms?: RoomRecord[] } | RoomRecord[] | unknown>(
    ROOMS_PATH,
    []
  );
  if (Array.isArray(data)) return data;
  const list = (data as { rooms?: RoomRecord[] }).rooms;
  return Array.isArray(list) ? list : [];
}

export async function saveRooms(rooms: RoomRecord[]): Promise<void> {
  await writeJsonFile(ROOMS_PATH, { rooms });
}

// --- Guided prayers ---
export interface GuidedPrayerRecord {
  id: string;
  title: string;
  scripture: string;
  focus: string;
  category: string;
}

export async function getGuidedPrayers(): Promise<GuidedPrayerRecord[]> {
  const data = await readJsonFile<GuidedPrayerRecord[] | unknown>(GUIDED_PATH, []);
  return Array.isArray(data) ? data : [];
}

export async function addGuidedPrayer(
  record: GuidedPrayerRecord
): Promise<void> {
  const list = await getGuidedPrayers();
  list.push(record);
  await writeJsonFile(GUIDED_PATH, list);
}

// --- Prayer chains ---
export interface PrayerChainRecord {
  id: string;
  request: string;
  prayerIds: string[];
}

export async function getPrayerChains(): Promise<PrayerChainRecord[]> {
  const data = await readJsonFile<PrayerChainRecord[] | unknown>(CHAINS_PATH, []);
  return Array.isArray(data) ? data : [];
}

export async function addPrayerChain(chain: PrayerChainRecord): Promise<void> {
  const chains = await getPrayerChains();
  chains.push(chain);
  await writeJsonFile(CHAINS_PATH, chains);
}

// --- Daily prayer progress ---

export interface DailyPrayerProgressRecord {
  userId: string;
  /** ISO date string YYYY-MM-DD */
  date: string;
  /** Cumulative seconds prayed (listening) for that day */
  secondsPrayed: number;
}

async function getDailyPrayerProgressList(): Promise<DailyPrayerProgressRecord[]> {
  const data = await readJsonFile<DailyPrayerProgressRecord[] | unknown>(
    DAILY_PROGRESS_PATH,
    []
  );
  return Array.isArray(data) ? data : [];
}

export async function getDailyPrayerProgress(
  userId: string,
  date: string
): Promise<DailyPrayerProgressRecord | null> {
  const list = await getDailyPrayerProgressList();
  const found = list.find((r) => r.userId === userId && r.date === date);
  return found ?? null;
}

export async function incrementDailyPrayerProgress(
  userId: string,
  date: string,
  secondsDelta: number
): Promise<DailyPrayerProgressRecord> {
  if (!Number.isFinite(secondsDelta) || secondsDelta <= 0) {
    const existing = await getDailyPrayerProgress(userId, date);
    return (
      existing ?? {
        userId,
        date,
        secondsPrayed: 0,
      }
    );
  }

  const list = await getDailyPrayerProgressList();
  const idx = list.findIndex((r) => r.userId === userId && r.date === date);
  if (idx >= 0) {
    const current = list[idx]!;
    const nextSeconds = (current.secondsPrayed ?? 0) + secondsDelta;
    const updated: DailyPrayerProgressRecord = {
      userId,
      date,
      secondsPrayed: Math.max(0, nextSeconds),
    };
    list[idx] = updated;
  } else {
    list.push({
      userId,
      date,
      secondsPrayed: Math.max(0, secondsDelta),
    });
  }
  await writeJsonFile(DAILY_PROGRESS_PATH, list);
  const updated = list.find((r) => r.userId === userId && r.date === date)!;
  return updated;
}
