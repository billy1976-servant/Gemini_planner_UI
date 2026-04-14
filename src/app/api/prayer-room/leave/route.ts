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
      return NextResponse.json({ message: "Sign in to leave a room" }, { status: 401 });
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

    const hostUserId = room.hostUserId ?? room.hostId;
    if (hostUserId === userId) {
      const hostParticipant = room.participants.find(
        (p) => p.participantId === room.hostId || p.role === "host"
      );
      if (hostParticipant) {
        hostParticipant.lastSeenAt = new Date().toISOString();
      }
      await saveRooms(rooms);
      return NextResponse.json({ ok: true, host: true }, { headers: { "Cache-Control": "no-store" } });
    }

    const initialCount = room.participants.length;
    room.participants = room.participants.filter(
      (p) => p.participantId !== userId && p.participantUserId !== userId
    );
    if (room.participants.length !== initialCount) {
      await saveRooms(rooms);
    }

    return NextResponse.json({ ok: true, host: false }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/prayer-room/leave]", err);
    return NextResponse.json({ message: "Leave failed" }, { status: 500 });
  }
}
