import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getRooms } from "@/01_App/HIClarify/Christian/Prayer/data/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PRAYER_ROOT = path.join(
  process.cwd(),
  "src",
  "01_App",
  "Christian",
  "Prayer"
);
const SESSIONS_PATH = path.join(PRAYER_ROOT, "data", "live-sessions.json");

const HEARTBEAT_TTL_MS = 40_000;

interface LiveSession {
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

export async function GET() {
  try {
    const rooms = await getRooms();
    const activeRooms = rooms.filter((r) => r.status === "active");
    const roomParticipants = activeRooms.reduce(
      (sum, r) => sum + (r.participants?.length ?? 0),
      0
    );

    const sessions = readSessions();
    const now = Date.now();
    const listenerCount = sessions.filter(
      (s) => s.lastHeartbeat >= now - HEARTBEAT_TTL_MS
    ).length;

    const total = roomParticipants + listenerCount;

    return NextResponse.json(
      {
        roomParticipants,
        listenerCount,
        total,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[api/prayer/presence GET]", err);
    return NextResponse.json(
      { roomParticipants: 0, listenerCount: 0, total: 0 },
      { status: 200 }
    );
  }
}
