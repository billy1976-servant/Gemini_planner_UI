import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { getUserById } from "@/lib/universal-identity/user-store";
import { getOrgMembershipsForUser } from "@/lib/universal-identity/org-store";

export const dynamic = "force-dynamic";

export interface CurrentIdentityResponse {
  userId: string | null;
  email: string;
  displayName: string;
  organizations: { organizationId: string; role: string }[];
  activeOrgId: string | null;
}

export async function GET(): Promise<NextResponse<CurrentIdentityResponse>> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  if (!userId) {
    return NextResponse.json({
      userId: null,
      email: "",
      displayName: "",
      organizations: [],
      activeOrgId: null,
    });
  }
  const user = await getUserById(userId);
  const memberships = await getOrgMembershipsForUser(userId);
  const organizations = memberships.map((m) => ({
    organizationId: m.organizationId,
    role: m.role,
  }));
  const activeOrgId =
    organizations.length > 0 ? organizations[0].organizationId : null;
  return NextResponse.json({
    userId,
    email: user?.email ?? (session?.user?.email as string) ?? "",
    displayName: user?.displayName ?? (session?.user?.name as string) ?? "",
    organizations,
    activeOrgId,
  });
}
