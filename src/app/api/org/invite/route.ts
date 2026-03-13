import { NextResponse } from "next/server";
import { requireOrgRole } from "@/lib/universal-identity/auth-helpers";
import { createInvite } from "@/lib/universal-identity/invite-store";
import type { OrgRole } from "@/lib/universal-identity/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const organizationId = (body?.organizationId as string)?.trim();
    const role = ((body?.role as string)?.trim() || "member") as OrgRole;
    const expiresInDays = typeof body?.expiresInDays === "number" ? body.expiresInDays : 7;
    if (!organizationId) {
      return NextResponse.json({ message: "organizationId required" }, { status: 400 });
    }
    const auth = await requireOrgRole(organizationId, "admin");
    if (auth.ok === false) return auth.response;
    const invite = await createInvite(organizationId, role, expiresInDays);
    const base = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const origin = `${protocol}://${base}`;
    const inviteLink = `${origin}/org/join?token=${encodeURIComponent(invite.token)}`;
    return NextResponse.json(
      { inviteLink, token: invite.token, organizationId, role, expiresAt: invite.expiresAt },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[api/org/invite]", err);
    return NextResponse.json({ message: "Invite failed" }, { status: 500 });
  }
}
