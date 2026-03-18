import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getInviteByToken, consumeInvite } from "@/lib/universal-identity/invite-store";
import { addOrgMembership } from "@/lib/universal-identity/org-store";
import { getOrganizationById } from "@/lib/universal-identity/org-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ message: "Sign in to join" }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const token = (body?.token as string)?.trim();
    if (!token) {
      return NextResponse.json({ message: "token required" }, { status: 400 });
    }
    const invite = await getInviteByToken(token);
    if (!invite) {
      return NextResponse.json({ message: "Invalid or expired invite" }, { status: 400 });
    }
    const consumed = await consumeInvite(token, userId);
    if (!consumed) {
      return NextResponse.json({ message: "Invite already used" }, { status: 400 });
    }
    await addOrgMembership(userId, invite.organizationId, invite.role);
    const org = await getOrganizationById(invite.organizationId);
    return NextResponse.json(
      { ok: true, organizationId: invite.organizationId, slug: org?.slug },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[api/org/join]", err);
    return NextResponse.json({ message: "Join failed" }, { status: 500 });
  }
}
