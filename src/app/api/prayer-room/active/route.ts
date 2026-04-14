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
    const groupId = searchParams.get("groupId") ?? undefined;
    const organizationId = searchParams.get("organizationId") ?? undefined;

    const rooms = pruneInactiveParticipantsFromRooms(await getRooms());
    await saveRooms(rooms);
    const active = rooms.filter((r) => r.status === "active");
    let filtered = groupId
      ? active.filter((r) => r.groupId === groupId)
      : active;
    if (organizationId) {
      filtered = filtered.filter(
        (r) => (r as { organizationId?: string }).organizationId === organizationId
      );
    }

    const list = filtered.map((r) => ({
      roomId: r.roomId,
      hostId: r.hostId,
      title: r.title,
      groupId: r.groupId,
      participantCount: r.participants.length,
      createdAt: r.createdAt,
    }));

    return NextResponse.json(
      { rooms: list },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[api/prayer-room/active GET]", err);
    return NextResponse.json({ rooms: [] }, { status: 200 });
  }
}
