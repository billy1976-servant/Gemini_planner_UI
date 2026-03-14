import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getRooms, saveRooms } from "@/01_App/Christian/Prayer/data/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      return NextResponse.json({ message: "Sign in to end the room" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const roomId = (body?.roomId as string)?.trim();

    if (!roomId) {
      return NextResponse.json(
        { message: "roomId is required" },
        { status: 400 }
      );
    }

    const rooms = await getRooms();
    const room = rooms.find((r) => r.roomId === roomId);
    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }
    const hostUserId = room.hostUserId ?? room.hostId;
    if (hostUserId !== userId) {
      return NextResponse.json({ message: "Only host can end the room" }, { status: 403 });
    }

    room.status = "ended";
    await saveRooms(rooms);

    return NextResponse.json(
      { ok: true, roomId },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[api/prayer-room/end]", err);
    return NextResponse.json({ message: "End failed" }, { status: 500 });
  }
}
