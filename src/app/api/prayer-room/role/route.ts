import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getRooms, saveRooms } from "@/01_App/hiclarify/christian/prayer/data/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RoomRole = "host" | "speaker" | "listener";

function getUserId(
  request: Request,
  session: { user?: { id?: string } } | null
): string | null {
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
      return NextResponse.json(
        { message: "Sign in to change roles" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const roomId = (body?.roomId as string)?.trim();
    const participantId = (body?.participantId as string)?.trim();
    const role = (body?.role as RoomRole) || "listener";

    if (!roomId || !participantId) {
      return NextResponse.json(
        { message: "roomId and participantId are required" },
        { status: 400 }
      );
    }

    const validRoles: RoomRole[] = ["host", "speaker", "listener"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { message: "Invalid role" },
        { status: 400 }
      );
    }

    const rooms = await getRooms();
    const room = rooms.find((r) => r.roomId === roomId);
    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }
    if (room.status !== "active") {
      return NextResponse.json(
        { message: "Room has ended" },
        { status: 400 }
      );
    }

    const hostUserId = room.hostUserId ?? room.hostId;
    if (hostUserId !== userId) {
      return NextResponse.json(
        { message: "Only host can change roles" },
        { status: 403 }
      );
    }

    const participant = room.participants.find(
      (p) => p.participantId === participantId || p.participantUserId === participantId
    );
    if (!participant) {
      return NextResponse.json(
        { message: "Participant not found" },
        { status: 404 }
      );
    }

    participant.role = role;
    await saveRooms(rooms);

    return NextResponse.json(
      { ok: true, roomId, participantId, role },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[api/prayer-room/role]", err);
    return NextResponse.json(
      { message: "Role change failed" },
      { status: 500 }
    );
  }
}

