import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PRAYER_ROOT = path.join(
  process.cwd(),
  "src",
  "01_App",
  "(live) Gospel",
  "Prayer"
);
const SESSIONS_PATH = path.join(PRAYER_ROOT, "data", "live-sessions.json");

const HEARTBEAT_TTL_MS = 40_000;

interface LiveSession {
  prayerId: string;
  sessionId: string;
  lastHeartbeat: number;
}

function readSessions(): LiveSession[] {
  if (!fs.existsSync(SESSIONS_PATH)) return [];
  try {
    const raw = fs.readFileSync(SESSIONS_PATH, "utf8");
    const data = JSON.parse(raw);
    const list = data?.sessions;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeSessions(sessions: LiveSession[]) {
  const dir = path.dirname(SESSIONS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SESSIONS_PATH, JSON.stringify({ sessions }, null, 2), "utf8");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const prayerId = searchParams.get("prayerId");
    const groupId = searchParams.get("groupId");
    const sessions = readSessions();
    const now = Date.now();
    const validSessions = sessions.filter((s) => s.lastHeartbeat >= now - HEARTBEAT_TTL_MS);

    if (groupId) {
      const { getPrayers } = await import("@/01_App/(live) Gospel/Prayer/data/store");
      const prayers = await getPrayers();
      const groupPrayerIds = new Set(
        prayers.filter((p) => (p as { groupId?: string }).groupId === groupId).map((p) => (p as { id: string }).id)
      );
      const live = validSessions.filter((s) => groupPrayerIds.has(s.prayerId)).length;
      return NextResponse.json({ live }, { headers: { "Cache-Control": "no-store" } });
    }

    if (!prayerId) {
      return NextResponse.json({ live: 0 }, { headers: { "Cache-Control": "no-store" } });
    }
    const live = validSessions.filter((s) => s.prayerId === prayerId).length;
    return NextResponse.json({ live }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/prayer/listeners GET]", err);
    return NextResponse.json({ live: 0 }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body?.action as string;
    const prayerId = body?.prayerId as string | undefined;
    const sessionId = body?.sessionId as string | undefined;

    if (action === "played" && prayerId) {
      const { getPrayers, updatePrayer } = await import("@/01_App/(live) Gospel/Prayer/data/store");
      const prayers = await getPrayers();
      const p = prayers.find((x) => (x as { id?: string }).id === prayerId) as Record<string, unknown> | undefined;
      if (p) {
        const total = Math.max(0, ((p.totalListeners as number) ?? 0) + 1);
        await updatePrayer(prayerId, { totalListeners: total });
        return NextResponse.json({ totalListeners: total }, { headers: { "Cache-Control": "no-store" } });
      }
      return NextResponse.json({ totalListeners: 0 }, { headers: { "Cache-Control": "no-store" } });
    }

    if (action === "join" && prayerId) {
      const sid = crypto.randomUUID();
      const sessions = readSessions();
      sessions.push({ prayerId, sessionId: sid, lastHeartbeat: Date.now() });
      writeSessions(sessions);
      return NextResponse.json({ sessionId: sid }, { headers: { "Cache-Control": "no-store" } });
    }

    if (action === "heartbeat" && prayerId && sessionId) {
      const sessions = readSessions();
      const idx = sessions.findIndex((s) => s.sessionId === sessionId && s.prayerId === prayerId);
      if (idx >= 0) {
        sessions[idx].lastHeartbeat = Date.now();
        writeSessions(sessions);
      }
      return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    }

    if (action === "leave" && sessionId) {
      const sessions = readSessions().filter((s) => s.sessionId !== sessionId);
      writeSessions(sessions);
      return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  } catch (err) {
    console.error("[api/prayer/listeners POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
