import presentationProfiles from "@/lib/layout/presentation-profiles.json";

/**
 * Experience profile registry (single JSON authority).
 */
const PROFILES: Record<string, any> = presentationProfiles as Record<string, any>;

/**
 * Return the raw experience profile JSON (sections/defaults).
 * Used as fallback when no template is selected; template profile overrides in page.tsx effectiveProfile.
 */
export function getExperienceProfile(profileId: string) {
  return PROFILES[profileId] ?? null;
}


/**
 * Resolve layout intent from an experience profile.
 *
 * This does NOT resolve row/column/grid.
 * It ONLY selects which layout instruction should apply.
 *
 * Output feeds directly into resolveLayout() from @/layout.
 */
export function resolveProfileLayout(
  profileId: string,
  role?: string
) {
  const profile = PROFILES[profileId];


  if (!profile) {
    console.warn(`[profile-resolver] Unknown profile: ${profileId}`);
    return null;
  }


  // Role-specific override (section-level)
  if (role && profile.sections?.[role]) {
    return profile.sections[role];
  }


  // Fallback to profile defaults (screen-level)
  return profile.defaults ?? null;
}


