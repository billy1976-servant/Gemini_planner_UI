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

type RoomRole = "host" | "speaker" | "listener";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ message: "Sign in to manage room roles" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const roomId = (body?.roomId as string)?.trim();
    const participantId = (body?.participantId as string)?.trim();
    const role = (body?.role as RoomRole | undefined)?.trim() as RoomRole | undefined;
    const validRoles: RoomRole[] = ["host", "speaker", "listener"];

    if (!roomId || !participantId || !role) {
      return NextResponse.json(
        { message: "roomId, participantId, and role are required" },
        { status: 400 }
      );
    }
    if (!validRoles.includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }
    if (role === "host") {
      return NextResponse.json({ message: "Host role cannot be reassigned" }, { status: 400 });
    }

    const rooms = pruneInactiveParticipantsFromRooms(await getRooms());
    const room = rooms.find((r) => r.roomId === roomId);
    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }
    if (room.status !== "active") {
      return NextResponse.json({ message: "Room has ended" }, { status: 400 });
    }

    const hostUserId = room.hostUserId ?? room.hostId;
    if (hostUserId !== userId) {
      return NextResponse.json({ message: "Only host can manage roles" }, { status: 403 });
    }

    const participant = room.participants.find(
      (p) => p.participantId === participantId || p.participantUserId === participantId
    );
    if (!participant) {
      return NextResponse.json({ message: "Participant not found" }, { status: 404 });
    }
    if (participant.role === "host" || participant.participantId === room.hostId) {
      return NextResponse.json({ message: "Host role cannot be changed" }, { status: 400 });
    }

    if (role === "speaker" && participant.role !== "speaker") {
      const maxSpeakers = room.maxSpeakers ?? 6;
      const speakerCount = room.participants.filter((p) => p.role === "speaker").length;
      if (speakerCount >= maxSpeakers) {
        return NextResponse.json(
          { message: `Speaker limit reached (${maxSpeakers})` },
          { status: 409 }
        );
      }
    }

    participant.role = role;
    participant.lastSeenAt = new Date().toISOString();
    await saveRooms(rooms);

    return NextResponse.json({ room, participantId: participant.participantId, role }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/prayer-room/role]", err);
    return NextResponse.json({ message: "Role update failed" }, { status: 500 });
  }
}
