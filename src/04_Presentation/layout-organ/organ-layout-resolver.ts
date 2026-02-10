/**
 * Organ layout resolver: given organ type (or detected capabilities), return valid
 * internal layout IDs. Internal organ layout only; does not touch section layout (layout-2).
 */

import profilesData from "./organ-layout-profiles.json";

type OrganProfile = {
  organId: string;
  capabilities?: Record<string, unknown>;
  internalLayoutIds: string[];
  defaultInternalLayoutId: string;
};

type ProfilesRoot = {
  description?: string;
  organs: OrganProfile[];
};

const profiles = (profilesData as ProfilesRoot).organs;
const byOrganId = new Map<string, OrganProfile>(
  profiles.map((p) => [p.organId.toLowerCase().trim(), p])
);

/**
 * Get the organ layout profile for an organ type, or null if unknown.
 */
export function getOrganLayoutProfile(organId: string): OrganProfile | null {
  if (!organId || typeof organId !== "string") return null;
  return byOrganId.get(organId.toLowerCase().trim()) ?? null;
}

/**
 * Return valid internal layout IDs for the given organ type. Empty if unknown. Unique by id only.
 */
export function getInternalLayoutIds(organId: string): string[] {
  const profile = getOrganLayoutProfile(organId);
  const ids = profile?.internalLayoutIds ?? [];
  return [...new Set(ids)];
}

/**
 * Return the default internal layout ID for the organ type, or null if unknown.
 */
export function getDefaultInternalLayoutId(organId: string): string | null {
  const profile = getOrganLayoutProfile(organId);
  return profile?.defaultInternalLayoutId ?? null;
}

/**
 * True if the given layout ID is valid for the organ type.
 */
export function isValidInternalLayoutId(organId: string, layoutId: string): boolean {
  const ids = getInternalLayoutIds(organId);
  const normalized = (layoutId ?? "").toLowerCase().trim();
  return ids.some((id) => id.toLowerCase() === normalized);
}

/**
 * Resolve internal layout ID for an organ: use the given layoutId if valid,
 * otherwise the organ's default. Returns null only if organ is unknown.
 */
export function resolveInternalLayoutId(
  organId: string,
  layoutId?: string | null
): string | null {
  const profile = getOrganLayoutProfile(organId);
  if (!profile) return null;
  const requested = (layoutId ?? "").trim();
  if (requested && isValidInternalLayoutId(organId, requested)) {
    const ids = profile.internalLayoutIds;
    const match = ids.find((id) => id.toLowerCase() === requested.toLowerCase());
    return match ?? profile.defaultInternalLayoutId;
  }
  return profile.defaultInternalLayoutId;
}

/** All organ IDs that have an organ layout profile. */
export function getOrganLayoutOrganIds(): string[] {
  return profiles.map((p) => p.organId);
}

/**
 * Dev/testing only: all organs with their internal layout IDs. Use for a separate dev dropdown;
 * do not mix with section layout dropdown.
 */
export function getInternalLayoutOptionsForDev(): { organId: string; internalLayoutIds: string[]; defaultId: string }[] {
  return profiles.map((p) => ({
    organId: p.organId,
    internalLayoutIds: p.internalLayoutIds,
    defaultId: p.defaultInternalLayoutId,
  }));
}
