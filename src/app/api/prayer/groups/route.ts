import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import {
  getGroups,
  addGroup,
  joinGroup,
} from "@/01_App/HIClarify/Christian/Prayer/data/store";
import {
  addOrganization,
  addOrgMembership,
  getOrganizations,
} from "@/lib/universal-identity/org-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || `group-${Date.now()}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const groups = await getGroups();

    if (slug) {
      const one = groups.find((g) => (g as { slug?: string }).slug === slug);
      if (!one) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(one, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json(groups, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/prayer/groups GET]", err);
    return NextResponse.json([], { status: 200, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    const createdBy = (session?.user?.email as string)?.trim() || undefined;

    const body = await request.json().catch(() => ({}));
    const name = (body?.name as string)?.trim();
    const description = (body?.description as string)?.trim() ?? "";
    const accentColor = (body?.accentColor as string)?.trim() || "#7c3aed";

    if (!name) return NextResponse.json({ message: "Name is required" }, { status: 400 });

    const groups = await getGroups();
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 0;
    while (groups.some((g) => (g as { slug?: string }).slug === slug)) {
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }

    const id = crypto.randomUUID().slice(0, 8);
    let organizationId: string | undefined;

    if (userId) {
      const orgs = await getOrganizations();
      let orgSlug = slug;
      let orgCounter = 0;
      while (orgs.some((o) => o.slug === orgSlug)) {
        orgCounter += 1;
        orgSlug = `${slug}-${orgCounter}`;
      }
      const orgId = `org_${id}`;
      await addOrganization({
        id: orgId,
        slug: orgSlug,
        name,
        palette: { accent: accentColor },
        ownerId: userId,
        createdAt: new Date().toISOString(),
      });
      await addOrgMembership(userId, orgId, "owner");
      organizationId = orgId;
    }

    const group: Record<string, unknown> = {
      id,
      name,
      slug,
      logo: "",
      accentColor,
      description,
      organizationId,
    };
    if (createdBy) group.createdBy = createdBy;

    await addGroup(group);

    if (createdBy) {
      await joinGroup(createdBy, id, "admin");
    }

    return NextResponse.json(group, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/prayer/groups POST]", err);
    return NextResponse.json({ message: "Create failed" }, { status: 500 });
  }
}
