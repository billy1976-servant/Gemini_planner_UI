/**
 * Server-side auth helpers for API routes.
 * Use requireAuthenticatedUser, requireOrgMembership, and requireOrgRole to enforce permissions.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import {
  requireOrgRole as checkOrgRole,
  getOrgRole,
  type OrgRole,
} from "./org-store";

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Require an authenticated user. Returns userId or a 401 NextResponse.
 */
export async function requireAuthenticatedUser(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Sign in required" },
        { status: 401 }
      ),
    };
  }
  return { ok: true, userId };
}

export type OrgMembershipResult =
  | { ok: true; userId: string; role: OrgRole }
  | { ok: false; response: NextResponse };

/**
 * Require that the current user is a member of the organization (any role).
 * Returns userId and role or 401/403 NextResponse.
 */
export async function requireOrgMembership(
  organizationId: string
): Promise<OrgMembershipResult> {
  const auth = await requireAuthenticatedUser();
  if (auth.ok === false) return { ok: false, response: auth.response };
  const role = await getOrgRole(auth.userId, organizationId);
  if (role === null) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Not a member of this organization" },
        { status: 403 }
      ),
    };
  }
  return { ok: true, userId: auth.userId, role };
}

/**
 * Require that the current user has at least minRole in the organization.
 * Returns userId and role or 401/403 NextResponse.
 */
export async function requireOrgRole(
  organizationId: string,
  minRole: OrgRole
): Promise<OrgMembershipResult> {
  const auth = await requireAuthenticatedUser();
  if (auth.ok === false) return { ok: false, response: auth.response };
  const result = await checkOrgRole(auth.userId, organizationId, minRole);
  if (result.allowed === false) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Insufficient permissions" },
        { status: result.status }
      ),
    };
  }
  return { ok: true, userId: auth.userId, role: result.role };
}
