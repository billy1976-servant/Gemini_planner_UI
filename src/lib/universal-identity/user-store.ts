/**
 * UserRecord store — single source for user identity.
 * All modules must resolve identity through getOrCreateUserByEmail / getUserById.
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { UserRecord } from "./types";
import type { AuthProvider } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "identity");
const USERS_PATH = path.join(DATA_DIR, "users.json");

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

async function readUsers(): Promise<UserRecord[]> {
  try {
    const raw = await readFile(USERS_PATH, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeUsers(users: UserRecord[]): Promise<void> {
  await ensureDir(DATA_DIR);
  await writeFile(USERS_PATH, JSON.stringify(users, null, 2), "utf8");
}

function generateUserId(): string {
  return `user_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get or create a user by email. Used by NextAuth and other providers to resolve stable userId.
 */
export async function getOrCreateUserByEmail(
  email: string,
  displayName?: string,
  provider: AuthProvider = "nextauth-google"
): Promise<UserRecord> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) throw new Error("Email is required");
  const users = await readUsers();
  let user = users.find((u) => u.email.toLowerCase() === normalized);
  if (user) {
    if (!user.providers.includes(provider)) {
      user = { ...user, providers: [...user.providers, provider] };
      if (displayName && displayName.trim()) user.displayName = displayName.trim();
      const index = users.findIndex((u) => u.id === user!.id);
      users[index] = user;
      await writeUsers(users);
    }
    return user;
  }
  user = {
    id: generateUserId(),
    email: normalized,
    displayName: (displayName ?? email).trim().slice(0, 200) || normalized,
    providers: [provider],
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await writeUsers(users);
  return user;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const users = await readUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase();
  const users = await readUsers();
  return users.find((u) => u.email.toLowerCase() === normalized) ?? null;
}
