/**
 * Organization and membership store — org model and requireOrgRole helper.
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type {
  OrganizationRecord,
  OrgMembershipRecord,
  OrgRole,
} from "./types";
import { hasOrgRoleAtLeast } from "./types";

export type { OrgRole } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "identity");
const ORGS_PATH = path.join(DATA_DIR, "organizations.json");
const MEMBERS_PATH = path.join(DATA_DIR, "org-members.json");

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

async function readOrgs(): Promise<OrganizationRecord[]> {
  try {
    const raw = await readFile(ORGS_PATH, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function readMembers(): Promise<OrgMembershipRecord[]> {
  try {
    const raw = await readFile(MEMBERS_PATH, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeOrgs(orgs: OrganizationRecord[]): Promise<void> {
  await ensureDir(DATA_DIR);
  await writeFile(ORGS_PATH, JSON.stringify(orgs, null, 2), "utf8");
}

async function writeMembers(members: OrgMembershipRecord[]): Promise<void> {
  await ensureDir(DATA_DIR);
  await writeFile(MEMBERS_PATH, JSON.stringify(members, null, 2), "utf8");
}

export async function getOrganizations(): Promise<OrganizationRecord[]> {
  return readOrgs();
}

export async function getOrganizationById(id: string): Promise<OrganizationRecord | null> {
  const orgs = await readOrgs();
  return orgs.find((o) => o.id === id) ?? null;
}

export async function getOrganizationBySlug(slug: string): Promise<OrganizationRecord | null> {
  const orgs = await readOrgs();
  const normalized = slug.trim().toLowerCase();
  return orgs.find((o) => o.slug.toLowerCase() === normalized) ?? null;
}

export async function addOrganization(org: OrganizationRecord): Promise<void> {
  const orgs = await readOrgs();
  if (orgs.some((o) => o.id === org.id || o.slug.toLowerCase() === org.slug.toLowerCase())) {
    throw new Error("Organization id or slug already exists");
  }
  orgs.push(org);
  await writeOrgs(orgs);
}

export async function updateOrganization(
  id: string,
  patch: Partial<Omit<OrganizationRecord, "id" | "createdAt">>
): Promise<void> {
  const orgs = await readOrgs();
  const i = orgs.findIndex((o) => o.id === id);
  if (i < 0) return;
  orgs[i] = { ...orgs[i], ...patch };
  await writeOrgs(orgs);
}

export async function getOrgMemberships(): Promise<OrgMembershipRecord[]> {
  return readMembers();
}

export async function getOrgMembershipsForUser(userId: string): Promise<OrgMembershipRecord[]> {
  const members = await readMembers();
  return members.filter((m) => m.userId === userId);
}

export async function getOrgMembershipsForOrg(organizationId: string): Promise<OrgMembershipRecord[]> {
  const members = await readMembers();
  return members.filter((m) => m.organizationId === organizationId);
}

export async function addOrgMembership(
  userId: string,
  organizationId: string,
  role: OrgRole
): Promise<void> {
  const members = await readMembers();
  if (members.some((m) => m.userId === userId && m.organizationId === organizationId)) return;
  members.push({ userId, organizationId, role });
  await writeMembers(members);
}

export async function setOrgMembershipRole(
  userId: string,
  organizationId: string,
  role: OrgRole
): Promise<void> {
  const members = await readMembers();
  const m = members.find((x) => x.userId === userId && x.organizationId === organizationId);
  if (m) m.role = role;
  await writeMembers(members);
}

export async function removeOrgMembership(userId: string, organizationId: string): Promise<void> {
  const members = await readMembers();
  const filtered = members.filter(
    (m) => !(m.userId === userId && m.organizationId === organizationId)
  );
  if (filtered.length < members.length) await writeMembers(filtered);
}

/**
 * Resolve user's role in an organization. Returns null if not a member.
 */
export async function getOrgRole(userId: string, organizationId: string): Promise<OrgRole | null> {
  const members = await readMembers();
  const m = members.find((x) => x.userId === userId && x.organizationId === organizationId);
  return m?.role ?? null;
}

/**
 * Check if userId has at least minRole in organization. Use in API routes with session.user.id.
 * Returns { allowed: true } or { allowed: false, status: 403 }.
 */
export async function requireOrgRole(
  userId: string | undefined,
  organizationId: string,
  minRole: OrgRole
): Promise<{ allowed: true; role: OrgRole } | { allowed: false; status: number }> {
  if (!userId) return { allowed: false, status: 401 };
  const role = await getOrgRole(userId, organizationId);
  if (role === null) return { allowed: false, status: 403 };
  if (!hasOrgRoleAtLeast(role, minRole)) return { allowed: false, status: 403 };
  return { allowed: true, role };
}
