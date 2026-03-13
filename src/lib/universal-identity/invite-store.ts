/**
 * Organization invite store — token-based invites to join an org.
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { OrgRole } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "identity");
const INVITES_PATH = path.join(DATA_DIR, "invites.json");

export interface OrgInviteRecord {
  token: string;
  organizationId: string;
  role: OrgRole;
  createdAt: string;
  expiresAt?: string;
  usedBy?: string;
}

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

async function readInvites(): Promise<OrgInviteRecord[]> {
  try {
    const raw = await readFile(INVITES_PATH, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeInvites(invites: OrgInviteRecord[]): Promise<void> {
  await ensureDir(DATA_DIR);
  await writeFile(INVITES_PATH, JSON.stringify(invites, null, 2), "utf8");
}

function generateToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

export async function createInvite(
  organizationId: string,
  role: OrgRole,
  expiresInDays?: number
): Promise<OrgInviteRecord> {
  const invites = await readInvites();
  const now = new Date();
  const expiresAt = expiresInDays
    ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : undefined;
  const record: OrgInviteRecord = {
    token: generateToken(),
    organizationId,
    role,
    createdAt: now.toISOString(),
    expiresAt,
  };
  invites.push(record);
  await writeInvites(invites);
  return record;
}

export async function getInviteByToken(token: string): Promise<OrgInviteRecord | null> {
  const invites = await readInvites();
  const normalized = token.trim();
  const invite = invites.find((i) => i.token === normalized);
  if (!invite || invite.usedBy) return null;
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return null;
  return invite;
}

export async function consumeInvite(token: string, userId: string): Promise<boolean> {
  const invites = await readInvites();
  const normalized = token.trim();
  const idx = invites.findIndex((i) => i.token === normalized);
  if (idx < 0 || invites[idx]!.usedBy) return false;
  invites[idx]!.usedBy = userId;
  await writeInvites(invites);
  return true;
}
