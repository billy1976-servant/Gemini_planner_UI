import website from "@/lib/layout/presentation/website.profile.json";
import app from "@/lib/layout/presentation/app.profile.json";
import learning from "@/lib/layout/presentation/learning.profile.json";


/**
 * Experience profile registry
 * (pure data selection — no layout logic here)
 */
const PROFILES: Record<string, any> = {
  website,
  app,
  learning,
};

/**
 * Return the raw experience profile JSON (sections/defaults).
 * Useful when a renderer needs section-role mapping data, not just a single resolved section.
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


