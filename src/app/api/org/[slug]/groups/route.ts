import { NextResponse } from "next/server";
import { getOrganizationBySlug } from "@/lib/universal-identity/org-store";
import { requireOrgRole } from "@/lib/universal-identity/auth-helpers";
import { getGroups } from "@/01_App/Christian/Prayer/data/store";

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
    const auth = await requireOrgRole(org.id, "member");
    if (auth.ok === false) return auth.response;
    const groups = await getGroups();
    const orgGroups = groups.filter(
      (g) => (g as { organizationId?: string }).organizationId === org.id
    );
    return NextResponse.json({ groups: orgGroups }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/org/[slug]/groups]", err);
    return NextResponse.json({ error: "Failed to load groups" }, { status: 500 });
  }
}
