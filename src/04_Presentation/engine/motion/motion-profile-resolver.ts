/**
 * Motion Profile Resolver
 * Resolves motion and intensity profiles based on current mode from driver.json
 * NO DEFAULTS - all values must come from JSON configs
 */
import motionProfiles from "@/ui/motion.json";
import intensityProfiles from "@/ui/intensity.json";
import driver from "@/ux/driver.json";
import { resolveToken } from "@/engine/core/palette-resolve-token";


export type MotionProfile = {
  duration?: string;
  easing?: string;
};


export type IntensityProfile = {
  hoverScale?: number;
  pressScale?: number;
  hoverOpacity?: number;
  pressOpacity?: number;
};


/**
 * Get motion profile for current mode
 * @param mode - Current mode (defaults to driver.defaultMode)
 * @returns Motion profile config or empty object if not found
 */
export function getMotionProfile(mode?: string): MotionProfile {
  const currentMode = mode ?? driver.defaultMode;
  const modeBinding = (driver.bindings as any)[currentMode];
  
  if (!modeBinding?.ui?.motionProfile) {
    return {};
  }
  
  const profileName = modeBinding.ui.motionProfile;
  const profile = (motionProfiles as any)[profileName];
  
  if (!profile) {
    return {};
  }
  
  // Resolve duration token if it references a palette token
  const duration = profile.duration?.startsWith("transition.")
    ? resolveToken(profile.duration)
    : profile.duration;
  
  return {
    duration: typeof duration === "string" ? duration : undefined,
    easing: profile.easing,
  };
}


/**
 * Get intensity profile for current mode
 * @param mode - Current mode (defaults to driver.defaultMode)
 * @returns Intensity profile config or empty object if not found
 */
export function getIntensityProfile(mode?: string): IntensityProfile {
  const currentMode = mode ?? driver.defaultMode;
  const modeBinding = (driver.bindings as any)[currentMode];
  
  if (!modeBinding?.ui?.intensityProfile) {
    return {};
  }
  
  const profileName = modeBinding.ui.intensityProfile;
  const profile = (intensityProfiles as any)[profileName];
  
  return profile ?? {};
}


/**
 * Get combined motion and intensity profiles for current mode
 * @param mode - Current mode (defaults to driver.defaultMode)
 * @returns Combined motion and intensity config
 */
export function getModeProfiles(mode?: string) {
  return {
    motion: getMotionProfile(mode),
    intensity: getIntensityProfile(mode),
  };
}
