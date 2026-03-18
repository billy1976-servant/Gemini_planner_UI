import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { RoomServiceClient, TrackSource } from "livekit-server-sdk";
import { getRooms, saveRooms } from "@/01_App/HIClarify/Christian/Prayer/data/store";

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
      return NextResponse.json({ message: "Sign in to moderate" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const roomId = (body?.roomId as string)?.trim();
    const participantId = (body?.participantId as string)?.trim();
    const muted = Boolean(body?.muted);

    if (!roomId || !participantId) {
      return NextResponse.json(
        { message: "roomId and participantId are required" },
        { status: 400 }
      );
    }

    const rooms = await getRooms();
    const room = rooms.find((r) => r.roomId === roomId);
    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }
    if (room.status !== "active") {
      return NextResponse.json({ message: "Room has ended" }, { status: 400 });
    }
    const hostUserId = room.hostUserId ?? room.hostId;
    if (hostUserId !== userId) {
      return NextResponse.json({ message: "Only host can mute participants" }, { status: 403 });
    }

    const p = room.participants.find(
      (x) => x.participantId === participantId || x.participantUserId === participantId
    );
    if (p) p.muted = muted;
    await saveRooms(rooms);

    const liveKitUrl = process.env.LIVEKIT_URL?.trim();
    const apiKey = process.env.LIVEKIT_API_KEY?.trim();
    const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();
    if (liveKitUrl && apiKey && apiSecret) {
      try {
        const host = liveKitUrl.replace(/^wss:/i, "https:");
        const roomService = new RoomServiceClient(host, apiKey, apiSecret);
        const targetIdentity = p?.participantId ?? participantId;
        const participant = await roomService.getParticipant(roomId, targetIdentity);
        const tracks = participant.tracks ?? [];
        const micTrack = tracks.find(
          (t: { source?: number }) => t.source === TrackSource.MICROPHONE
        );
        if (micTrack?.sid) {
          await roomService.mutePublishedTrack(
            roomId,
            participantId,
            micTrack.sid,
            muted
          );
        }
      } catch (e) {
        console.error("[api/prayer-room/mute] LiveKit mute:", e);
      }
    }

    return NextResponse.json(
      { ok: true, participantId, muted },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[api/prayer-room/mute POST]", err);
    return NextResponse.json({ message: "Mute failed" }, { status: 500 });
  }
}
