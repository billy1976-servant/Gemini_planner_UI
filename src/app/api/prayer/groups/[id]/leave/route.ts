import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getGroups, getGroupMembers, leaveGroup } from "@/01_App/(live) Gospel/Prayer/data/store";
import { authOptions } from "@/app/lib/auth";
import { removeOrgMembership } from "@/lib/universal-identity/org-store";

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
      return NextResponse.json({ message: "Sign in to leave a group" }, { status: 401 });
    }

    const { id: groupId } = await params;
    const members = await getGroupMembers();
    const filtered = members.filter(
      (m) => !(m.userId === email && m.groupId === groupId)
    );
    if (filtered.length === members.length) {
      return NextResponse.json({ message: "Not a member" }, { status: 200 });
    }

    await leaveGroup(email, groupId);

    const groups = await getGroups();
    const group = groups.find((g) => (g as { id?: string }).id === groupId);
    const organizationId = group ? (group as { organizationId?: string }).organizationId : undefined;
    if (internalUserId && organizationId) {
      await removeOrgMembership(internalUserId, organizationId);
    }

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/prayer/groups/[id]/leave]", err);
    return NextResponse.json({ message: "Leave failed" }, { status: 500 });
  }
}
