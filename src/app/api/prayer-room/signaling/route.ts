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
const EVENTS_PATH = path.join(PRAYER_ROOT, "data", "room-events.json");

const MAX_EVENTS_PER_ROOM = 200;

interface SignalingEvent {
  id: string;
  from: string;
  to: string;
  type: "offer" | "answer" | "ice" | "mute";
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  muted?: boolean;
  timestamp: number;
}

interface EventsStore {
  [roomId: string]: SignalingEvent[];
}

function readEvents(): EventsStore {
  if (!fs.existsSync(EVENTS_PATH)) return {};
  try {
    const raw = fs.readFileSync(EVENTS_PATH, "utf8");
    const data = JSON.parse(raw);
    return typeof data === "object" && data !== null ? data : {};
  } catch {
    return {};
  }
}

function writeEvents(store: EventsStore) {
  const dir = path.dirname(EVENTS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(EVENTS_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const after = searchParams.get("after");

    if (!roomId) {
      return NextResponse.json({ message: "roomId required" }, { status: 400 });
    }

    const store = readEvents();
    const events = store[roomId] || [];
    const afterTs = after ? parseInt(after, 10) : 0;
    const filtered = Number.isNaN(afterTs)
      ? events
      : events.filter((e) => e.timestamp > afterTs);

    return NextResponse.json(
      { events: filtered },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[api/prayer-room/signaling GET]", err);
    return NextResponse.json({ events: [] }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const roomId = (body?.roomId as string)?.trim();
    const from = (body?.from as string)?.trim();
    const to = (body?.to as string)?.trim();
    const type = body?.type as "offer" | "answer" | "ice" | "mute";
    const sdp = body?.sdp as RTCSessionDescriptionInit | undefined;
    const candidate = body?.candidate as RTCIceCandidateInit | undefined;

    if (!roomId || !from || !to || !type) {
      return NextResponse.json(
        { message: "roomId, from, to, and type are required" },
        { status: 400 }
      );
    }
    if (!["offer", "answer", "ice", "mute"].includes(type)) {
      return NextResponse.json({ message: "Invalid type" }, { status: 400 });
    }
    if ((type === "offer" || type === "answer") && !sdp) {
      return NextResponse.json({ message: "sdp required for offer/answer" }, { status: 400 });
    }
    if (type === "ice" && !candidate) {
      return NextResponse.json({ message: "candidate required for ice" }, { status: 400 });
    }
    const muted = type === "mute" ? Boolean(body?.muted) : undefined;

    const store = readEvents();
    if (!store[roomId]) store[roomId] = [];
    const event: SignalingEvent = {
      id: crypto.randomUUID(),
      from,
      to,
      type,
      sdp: type !== "ice" && type !== "mute" ? sdp : undefined,
      candidate: type === "ice" ? candidate : undefined,
      muted: type === "mute" ? muted : undefined,
      timestamp: Date.now(),
    };
    store[roomId].push(event);
    if (store[roomId].length > MAX_EVENTS_PER_ROOM) {
      store[roomId] = store[roomId].slice(-MAX_EVENTS_PER_ROOM);
    }
    writeEvents(store);

    return NextResponse.json(
      { ok: true, eventId: event.id },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[api/prayer-room/signaling POST]", err);
    return NextResponse.json({ message: "Signaling failed" }, { status: 500 });
  }
}
