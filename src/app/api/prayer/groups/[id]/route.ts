import { NextResponse } from "next/server";
import { getGroups, updateGroup } from "@/01_App/HIClarify/Christian/Prayer/data/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const groups = await getGroups();
    const one = groups.find((g) => (g as { id?: string }).id === id);
    if (!one) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(one, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/prayer/groups/[id] GET]", err);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const groups = await getGroups();
    const index = groups.findIndex((g) => (g as { id?: string }).id === id);
    if (index < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const current = groups[index] as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = String(body.name).trim();
    if (body.slug !== undefined) patch.slug = String(body.slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (body.accentColor !== undefined) patch.accentColor = String(body.accentColor).trim() || "#7c3aed";
    if (body.description !== undefined) patch.description = body.description;

    await updateGroup(id, patch);
    const updated = { ...current, ...patch };

    return NextResponse.json(updated, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/prayer/groups/[id] PATCH]", err);
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}
