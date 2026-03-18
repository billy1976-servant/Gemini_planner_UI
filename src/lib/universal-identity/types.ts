/**
 * Universal Identity — single identity source for the platform.
 * No module may create or manage its own user identity; all identity resolves through this layer.
 */

export type AuthProvider = "nextauth-google" | "firebase" | "shopify";

export interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  providers: AuthProvider[];
  createdAt: string;
}

export interface UniversalIdentity {
  userId: string;
  email: string;
  displayName: string;
  providers: AuthProvider[];
  organizations: { organizationId: string; role: OrgRole }[];
  createdAt: string;
}

export type OrgRole = "owner" | "admin" | "moderator" | "member" | "guest";

export interface OrganizationRecord {
  id: string;
  slug: string;
  name: string;
  palette?: Record<string, string>;
  logo?: string;
  ownerId: string;
  createdAt: string;
}

export interface OrgMembershipRecord {
  userId: string;
  organizationId: string;
  role: OrgRole;
}

export const ORG_ROLE_ORDER: OrgRole[] = ["guest", "member", "moderator", "admin", "owner"];

export function orgRoleLevel(role: OrgRole): number {
  const i = ORG_ROLE_ORDER.indexOf(role);
  return i >= 0 ? i : -1;
}

export function hasOrgRoleAtLeast(role: OrgRole, minRole: OrgRole): boolean {
  return orgRoleLevel(role) >= orgRoleLevel(minRole);
}
