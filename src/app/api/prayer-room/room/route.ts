import { NextResponse } from "next/server";
import {
  getRooms,
  saveRooms,
  pruneInactiveParticipantsFromRooms,
} from "@/01_App/(live) Gospel/Prayer/data/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    if (!roomId) {
      return NextResponse.json({ message: "roomId required" }, { status: 400 });
    }
    const rooms = pruneInactiveParticipantsFromRooms(await getRooms());
    await saveRooms(rooms);
    const room = rooms.find((r) => r.roomId === roomId);
    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }
    return NextResponse.json(room, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[api/prayer-room/room GET]", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
