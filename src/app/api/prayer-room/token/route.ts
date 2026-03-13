import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { AccessToken } from "livekit-server-sdk";
import { getRooms } from "@/01_App/(live) Gospel/Prayer/data/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RoomRole = "host" | "speaker" | "listener";

export async function POST(request: Request) {
  try {
    const url = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!url || !apiKey || !apiSecret) {
      return NextResponse.json(
        { message: "LiveKit is not configured" },
        { status: 500 }
      );
    }

    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json(
        { message: "Sign in to get a room token" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const roomId = (body?.roomId as string)?.trim();
    const role = (body?.role as RoomRole)?.trim();
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
    const resolvedRole = role && validRoles.includes(role as RoomRole) ? (role as RoomRole) : null;
    if (!resolvedRole) {
      return NextResponse.json(
        { message: "role must be host, speaker, or listener" },
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
    const inRoom = room.participants.some(
      (p) => p.participantId === userId || p.participantUserId === userId
    );
    if (!inRoom) {
      return NextResponse.json(
        { message: "Participant not in room" },
        { status: 403 }
      );
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: displayName || userId,
    });

    at.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: resolvedRole === "host" || resolvedRole === "speaker",
      canSubscribe: true,
    });

    const token = await at.toJwt();

    return NextResponse.json(
      { token, url },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[api/prayer-room/token]", err);
    return NextResponse.json(
      { message: "Token generation failed" },
      { status: 500 }
    );
  }
}
