import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getGroupMembers } from "@/01_App/(live) Gospel/Prayer/data/store";
import { authOptions } from "@/app/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email;
    if (!userId) {
      return NextResponse.json({ groupIds: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const members = await getGroupMembers();
    const groupIds = members
      .filter((m) => m.userId === userId)
      .map((m) => m.groupId);

    return NextResponse.json(
      { groupIds },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[api/prayer/groups/members GET]", err);
    return NextResponse.json({ groupIds: [] }, { status: 200 });
  }
}
