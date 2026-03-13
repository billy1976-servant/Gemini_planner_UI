import { NextResponse } from "next/server";
import { getOrganizationBySlug } from "@/lib/universal-identity/org-store";

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
    return NextResponse.json(org, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/org/[slug]]", err);
    return NextResponse.json({ error: "Failed to load organization" }, { status: 500 });
  }
}
