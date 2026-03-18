import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getGroups, getGroupMembers, joinGroup } from "@/01_App/HIClarify/Christian/Prayer/data/store";
import { authOptions } from "@/app/lib/auth";
import { addOrgMembership } from "@/lib/universal-identity/org-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    const internalUserId = (session?.user as { id?: string } | undefined)?.id;
    if (!email) {
      return NextResponse.json({ message: "Sign in to join a group" }, { status: 401 });
    }

    const { id: groupId } = await params;
    const groups = await getGroups();
    const group = groups.find((g) => (g as { id?: string }).id === groupId);
    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    const members = await getGroupMembers();
    if (members.some((m) => m.userId === email && m.groupId === groupId)) {
      return NextResponse.json({ message: "Already a member" }, { status: 200 });
    }

    await joinGroup(email, groupId, "member");

    const organizationId = (group as { organizationId?: string }).organizationId;
    if (internalUserId && organizationId) {
      await addOrgMembership(internalUserId, organizationId, "member");
    }

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/prayer/groups/[id]/join]", err);
    return NextResponse.json({ message: "Join failed" }, { status: 500 });
  }
}
