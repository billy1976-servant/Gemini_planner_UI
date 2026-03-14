import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getRooms, saveRooms } from "@/01_App/Christian/Prayer/data/store";
import type { RoomRecord, RoomParticipantRecord, RoomSessionType } from "@/01_App/Christian/Prayer/data/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_SPEAKERS = 6;

function getUserId(request: Request, session: { user?: { id?: string } } | null): string | null {
  const fromSession = (session?.user as { id?: string } | undefined)?.id;
  if (fromSession) return fromSession;
  const anon = request.headers.get("x-prayer-anon-id")?.trim();
  return anon || null;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(request, session);
    if (!userId) {
      return NextResponse.json({ message: "Sign in to create a room" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = (body?.title as string)?.trim() || undefined;
    const groupId = (body?.groupId as string)?.trim() || null;
    const organizationId = (body?.organizationId as string)?.trim() || null;
    const sessionType = (body?.sessionType as RoomSessionType) || "prayer";
    const features = Array.isArray(body?.features) ? (body.features as string[]) : ["audio", "recording", "screenShare", "annotations"];

    const roomId = crypto.randomUUID();
    const now = new Date().toISOString();
    const hostParticipant: RoomParticipantRecord = {
      participantId: userId,
      participantUserId: userId,
      role: "host",
      joinedAt: now,
    };
    const room: RoomRecord = {
      roomId,
      hostId: userId,
      hostUserId: userId,
      title,
      groupId: groupId || undefined,
      organizationId: organizationId || undefined,
      sessionType,
      features,
      createdAt: now,
      status: "active",
      participants: [hostParticipant],
      maxSpeakers: MAX_SPEAKERS,
    };

    const rooms = await getRooms();
    rooms.push(room);
    await saveRooms(rooms);

    const base = typeof request.url === "string" ? new URL(request.url).origin : "";
    const inviteLink = `${base}/prayer/room/${roomId}`;

    return NextResponse.json(
      { roomId, inviteLink, room },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[api/prayer-room/create]", err);
    return NextResponse.json({ message: "Create failed" }, { status: 500 });
  }
}
