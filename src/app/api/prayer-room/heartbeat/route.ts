import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import {
  getRooms,
  saveRooms,
  pruneInactiveParticipantsFromRooms,
} from "@/01_App/(live) Gospel/Prayer/data/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ message: "Sign in to heartbeat room presence" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const roomId = (body?.roomId as string)?.trim();
    if (!roomId) {
      return NextResponse.json({ message: "roomId is required" }, { status: 400 });
    }

    const rooms = pruneInactiveParticipantsFromRooms(await getRooms());
    const room = rooms.find((r) => r.roomId === roomId);
    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }
    if (room.status !== "active") {
      return NextResponse.json({ message: "Room has ended" }, { status: 400 });
    }

    const participant = room.participants.find(
      (p) => p.participantId === userId || p.participantUserId === userId
    );
    if (!participant) {
      return NextResponse.json({ message: "Participant not in room" }, { status: 403 });
    }

    participant.lastSeenAt = new Date().toISOString();
    await saveRooms(rooms);

    return NextResponse.json(
      { ok: true, roomId, participantId: participant.participantId },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[api/prayer-room/heartbeat]", err);
    return NextResponse.json({ message: "Heartbeat failed" }, { status: 500 });
  }
}
