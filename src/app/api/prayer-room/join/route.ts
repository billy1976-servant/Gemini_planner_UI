import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getRooms, saveRooms } from "@/01_App/HIClarify/Christian/Prayer/data/store";
import type { RoomRecord, RoomParticipantRecord } from "@/01_App/HIClarify/Christian/Prayer/data/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RoomRole = "host" | "speaker" | "listener";

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
      return NextResponse.json({ message: "Sign in to join a room" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const roomId = (body?.roomId as string)?.trim();
    const requestedRole = (body?.role as RoomRole) || "listener";
    const displayName =
      (body?.displayName as string)?.trim() ||
      (session?.user?.name as string) ||
      undefined;

    if (!roomId) {
      return NextResponse.json(
        { message: "roomId is required" },
        { status: 400 }
      );
    }

    const validRoles: RoomRole[] = ["host", "speaker", "listener"];
    if (!validRoles.includes(requestedRole)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    const rooms = await getRooms();
    const room = rooms.find((r) => r.roomId === roomId);
    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }
    if (room.status !== "active") {
      return NextResponse.json({ message: "Room has ended" }, { status: 400 });
    }

    const existing = room.participants.find(
      (p) => p.participantId === userId || p.participantUserId === userId
    );
    if (existing) {
      return NextResponse.json(
        { room, alreadyJoined: true, role: existing.role },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const speakerCount = room.participants.filter((p) => p.role === "speaker").length;
    const maxSpeakers = room.maxSpeakers ?? 6;
    // For invite links, everyone joins as listener by default.
    // Host can promote specific listeners to speaker via a separate role API.
    const resolvedRole: RoomRole =
      requestedRole === "host"
        ? "host"
        : requestedRole === "speaker" && speakerCount < maxSpeakers
          ? "listener"
          : "listener";

    const newParticipant: RoomParticipantRecord = {
      participantId: userId,
      participantUserId: userId,
      role: resolvedRole,
      displayName,
      muted: false,
      joinedAt: new Date().toISOString(),
    };
    room.participants.push(newParticipant);
    await saveRooms(rooms);

    return NextResponse.json(
      { room, role: resolvedRole },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[api/prayer-room/join]", err);
    return NextResponse.json({ message: "Join failed" }, { status: 500 });
  }
}
