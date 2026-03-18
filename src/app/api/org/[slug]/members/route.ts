import { NextResponse } from "next/server";
import { getOrganizationBySlug } from "@/lib/universal-identity/org-store";
import { requireOrgRole } from "@/lib/universal-identity/auth-helpers";
import { getOrgMembershipsForOrg } from "@/lib/universal-identity/org-store";
import { getUserById } from "@/lib/universal-identity/user-store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });
    const org = await getOrganizationBySlug(slug);
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    const auth = await requireOrgRole(org.id, "admin");
    if (auth.ok === false) return auth.response;
    const members = await getOrgMembershipsForOrg(org.id);
    const withUsers = await Promise.all(
      members.map(async (m) => {
        const user = await getUserById(m.userId);
        return {
          userId: m.userId,
          role: m.role,
          email: user?.email ?? "",
          displayName: user?.displayName ?? "",
        };
      })
    );
    return NextResponse.json({ members: withUsers }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/org/[slug]/members]", err);
    return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
  }
}
